'use strict';

/**
 * SuperMaster — MVP маркетплейс услуг.
 * Zero-dependency сервер: node:http + node:sqlite (Node >= 22.5).
 * Запуск: node server.js  (порт по умолчанию 3000, переменная PORT)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'supermaster.db');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';

/* ------------------------------------------------------------------ */
/* Конфиг интеграции с API лидов (gate.newapi.ru)                      */
/* Настройки: data/config.json И/ИЛИ env NEWAPI_* (env имеет приоритет) */
/* ------------------------------------------------------------------ */

const API_CONFIG_PATH = path.join(DATA_DIR, 'config.json');

const DEFAULT_API_CONFIG = {
  idp: '2e65798c-9ae4-96c7-00537a5c29dd9cdc', // IDP из ЛК партнёра
  offer_id: null,        // ИД оффера (обязателен, если не задан direction_id)
  direction_id: null,    // ИД направления (обязателен, если не задан offer_id)
  branch_id: 0,          // ИД филиала (обязателен)
  is_pm: false,          // true = частный мастер, false = организация
  source: 'partner',     // source в URL запроса
  enabled: true,         // false — не отправлять лиды
  lead_timeout_ms: 8000, // таймаут запроса к API
};

function loadApiConfig() {
  let cfg = { ...DEFAULT_API_CONFIG };
  try {
    if (fs.existsSync(API_CONFIG_PATH)) {
      const file = JSON.parse(fs.readFileSync(API_CONFIG_PATH, 'utf8'));
      cfg = { ...cfg, ...file };
    }
  } catch (err) {
    console.warn('[SuperMaster] Не удалось прочитать data/config.json:', err.message);
  }
  // env поверх файла
  const map = {
    NEWAPI_IDP: 'idp',
    NEWAPI_OFFER_ID: 'offer_id',
    NEWAPI_DIRECTION_ID: 'direction_id',
    NEWAPI_BRANCH_ID: 'branch_id',
    NEWAPI_IS_PM: 'is_pm',
    NEWAPI_SOURCE: 'source',
    NEWAPI_ENABLED: 'enabled',
    NEWAPI_TIMEOUT: 'lead_timeout_ms',
  };
  for (const [envName, key] of Object.entries(map)) {
    if (process.env[envName] !== undefined) {
      let val = process.env[envName];
      if (key === 'offer_id' || key === 'direction_id' || key === 'branch_id') val = Number(val);
      if (key === 'is_pm' || key === 'enabled') val = val === 'true' || val === '1';
      if (key === 'lead_timeout_ms') val = Number(val);
      cfg[key] = val;
    }
  }
  return cfg;
}

const apiConfig = loadApiConfig();

/* ------------------------------------------------------------------ */
/* Справочник городов (data/cities.json)                               */
/* Каждый город: { id: <city_id>, name: "Город", branch_id?: <ид> }   */
/* Если branch_id у города не указан — берётся из config.json          */
/* ------------------------------------------------------------------ */

const CITIES_PATH = path.join(DATA_DIR, 'cities.json');

function loadCities() {
  try {
    if (fs.existsSync(CITIES_PATH)) {
      const data = JSON.parse(fs.readFileSync(CITIES_PATH, 'utf8'));
      const list = Array.isArray(data) ? data : data.cities;
      if (Array.isArray(list)) {
        return list
          .filter((c) => c && c.id && c.name)
          .map((c) => ({ id: Number(c.id), name: String(c.name), branch_id: c.branch_id !== undefined ? Number(c.branch_id) : null }));
      }
    }
  } catch (err) {
    console.warn('[SuperMaster] Не удалось прочитать data/cities.json:', err.message);
  }
  return [];
}

const cities = loadCities();

function cityById(id) {
  return cities.find((c) => c.id === Number(id)) || null;
}

function truncate(str, max) {
  const text = String(str || '');
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/* ------------------------------------------------------------------ */
/* База данных                                                         */
/* ------------------------------------------------------------------ */

let db;

function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🛠',
      description TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS masters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 5.0,
      reviews INTEGER NOT NULL DEFAULT 0,
      experience INTEGER NOT NULL DEFAULT 1,
      bio TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      master_id INTEGER NOT NULL REFERENCES masters(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'услуга',
      duration_min INTEGER NOT NULL DEFAULT 60
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Миграция: колонки статуса отправки лида в API
  const orderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
  if (!orderCols.includes('lead_sent')) db.exec("ALTER TABLE orders ADD COLUMN lead_sent INTEGER NOT NULL DEFAULT 0");
  if (!orderCols.includes('lead_status')) db.exec("ALTER TABLE orders ADD COLUMN lead_status TEXT NOT NULL DEFAULT ''");
  if (!orderCols.includes('lead_error')) db.exec("ALTER TABLE orders ADD COLUMN lead_error TEXT NOT NULL DEFAULT ''");
  // Миграция: город клиента
  if (!orderCols.includes('city_id')) db.exec('ALTER TABLE orders ADD COLUMN city_id INTEGER');
  if (!orderCols.includes('city_name')) db.exec("ALTER TABLE orders ADD COLUMN city_name TEXT NOT NULL DEFAULT ''");
  // Миграция: адрес клиента
  if (!orderCols.includes('address')) db.exec("ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''");
}

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
}

function seed() {
  db.exec('BEGIN');
  try {
    const insCat = db.prepare('INSERT INTO categories (name, icon, description) VALUES (?, ?, ?)');
    const insMaster = db.prepare('INSERT INTO masters (name, phone, city, rating, reviews, experience, bio) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insService = db.prepare('INSERT INTO services (category_id, master_id, title, description, price, unit, duration_min) VALUES (?, ?, ?, ?, ?, ?, ?)');

    const catRepair = insCat.run('Ремонт и отделка', '🔨', 'Косметический и капитальный ремонт, отделочные работы под ключ').lastInsertRowid;
    const catElec = insCat.run('Электрика', '⚡', 'Монтаж проводки, розетки, освещение, щитки').lastInsertRowid;
    const catPlumb = insCat.run('Сантехника', '🚿', 'Установка, замена, устранение засоров и протечек').lastInsertRowid;
    const catClean = insCat.run('Уборка', '🧹', 'Генеральная, поддерживающая и послестроительная уборка').lastInsertRowid;
    const catFurn = insCat.run('Сборка мебели', '🪑', 'Сборка и установка мебели любой сложности').lastInsertRowid;
    const catAppl = insCat.run('Бытовая техника', '🔧', 'Ремонт и установка бытовой техники').lastInsertRowid;

    const m1 = insMaster.run('Алексей Смирнов', '+7 900 111-22-33', 'Москва', 4.9, 214, 12, 'Отделочник с опытом более 12 лет. Работаю аккуратно, с договором и гарантией до 2 лет.').lastInsertRowid;
    const m2 = insMaster.run('Дмитрий Волков', '+7 900 222-33-44', 'Москва', 4.8, 187, 9, 'Плиточник и отделочник. Люблю сложные проекты: мозаика, крупноформат, панно.').lastInsertRowid;
    const m3 = insMaster.run('Игорь Кузнецов', '+7 900 333-44-55', 'Москва', 4.9, 156, 8, 'Электрик с допуском. Схемы, щитки, умный дом, гарантия на работы 1 год.').lastInsertRowid;
    const m4 = insMaster.run('Сергей Морозов', '+7 900 444-55-66', 'Подольск', 4.7, 98, 6, 'Сантехник. Выезд в день обращения, диагностика бесплатно при заказе ремонта.').lastInsertRowid;
    const m5 = insMaster.run('Анна Белова', '+7 900 555-66-77', 'Москва', 5.0, 321, 7, 'Руководитель клининговой бригады. Эко-средства, чек-лист уборки на руки.').lastInsertRowid;
    const m6 = insMaster.run('Павел Орлов', '+7 900 666-77-88', 'Химки', 4.8, 142, 5, 'Сборка и установка мебели. Икея, Hoff, индивидуальные проекты. Аккуратно и быстро.').lastInsertRowid;
    const m7 = insMaster.run('Олег Титов', '+7 900 777-88-99', 'Москва', 4.6, 87, 11, 'Мастер по ремонту бытовой техники. Выезд на дом, оригинальные запчасти.').lastInsertRowid;

    const s = (cat, master, title, desc, price, unit, dur) =>
      insService.run(cat, master, title, desc, price, unit, dur).lastInsertRowid;

    s(catRepair, m1, 'Косметический ремонт комнаты', 'Выравнивание стен, поклейка обоев, покраска потолка, плинтусы. Материалы — по договорённости.', 25000, 'комната', 1440 * 3);
    s(catRepair, m1, 'Покраска стен', 'Подготовка поверхности и покраска в 2 слоя, включая грунтовку.', 800, 'кв. м', 60);
    s(catRepair, m2, 'Укладка плитки в ванной', 'Керамогранит и плитка, ровная геометрия, затирка в цвет.', 1600, 'кв. м', 90);
    s(catRepair, m2, 'Укладка ламината', 'Подложка, подрезка, плинтусы — под ключ.', 450, 'кв. м', 45);
    s(catElec, m3, 'Замена электропроводки', 'Полная замена проводки в квартире, штробление, новый щиток.', 15000, 'квартира', 1440 * 2);
    s(catElec, m3, 'Установка розеток и выключателей', 'Установка с подключением, аккуратные подрозетники.', 3500, 'шт', 20);
    s(catElec, m3, 'Монтаж люстры', 'Сборка и подключение люстры, проверка крепления.', 2500, 'шт', 45);
    s(catPlumb, m4, 'Устранение засора', 'Прочистка труб канализации (кухня, ванная, унитаз).', 2000, 'услуга', 40);
    s(catPlumb, m4, 'Установка смесителя', 'Демонтаж старого, установка нового, проверка на протечки.', 2500, 'шт', 50);
    s(catPlumb, m4, 'Замена унитаза', 'Демонтаж старого, установка нового с подключением.', 4000, 'шт', 90);
    s(catClean, m5, 'Генеральная уборка квартиры', 'Все комнаты, кухня, санузел, мытьё окон по запросу. Свои эко-средства.', 8000, 'квартира', 240);
    s(catClean, m5, 'Уборка после ремонта', 'Удаление строительной пыли, следов краски, финальный клининг.', 12000, 'квартира', 360);
    s(catFurn, m6, 'Сборка шкафа', 'Сборка и установка шкафа по инструкции производителя.', 3000, 'шт', 120);
    s(catFurn, m6, 'Сборка кухни', 'Корпусная мебель, фасады, столешница, подключение мойки.', 9000, 'кухня', 360);
    s(catAppl, m7, 'Ремонт стиральной машины', 'Диагностика, замена ТЭНа, помпы, подшипников. Гарантия на запчасти.', 3500, 'услуга', 120);
    s(catAppl, m7, 'Ремонт холодильника', 'Диагностика, дозаправка фреона, замена компрессора.', 4000, 'услуга', 120);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function initDb() {
  openDb();
  const empty = count('categories') === 0 || count('services') === 0 || count('masters') === 0;
  if (empty) seed();
}

/* ------------------------------------------------------------------ */
/* Хелперы                                                             */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseId(segment) {
  const n = Number(segment);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Путь: /api/orders/:id/pay  ->  { parts: ['orders', id, 'pay'] }
function splitApiPath(pathname) {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
}

/* ------------------------------------------------------------------ */
/* Запросы к БД (возвращают плоские объекты)                           */
/* ------------------------------------------------------------------ */

const serviceRow = `
  SELECT s.id, s.title, s.description, s.price, s.unit, s.duration_min,
         s.category_id, c.name AS category, c.icon AS category_icon,
         s.master_id, m.name AS master_name, m.rating, m.reviews, m.city
  FROM services s
  JOIN categories c ON c.id = s.category_id
  JOIN masters m ON m.id = s.master_id
`;

function getServices(params) {
  const where = [];
  const args = [];
  if (params.category) {
    where.push('s.category_id = ?');
    args.push(Number(params.category));
  }
  if (params.q) {
    where.push('(s.title LIKE ? OR s.description LIKE ? OR m.name LIKE ?)');
    const like = `%${params.q}%`;
    args.push(like, like, like);
  }
  const sql = `${serviceRow} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.id`;
  return db.prepare(sql).all(...args);
}

function getServiceById(id) {
  return db.prepare(`${serviceRow} WHERE s.id = ?`).get(id);
}

function getMasters() {
  return db.prepare(`
    SELECT m.id, m.name, m.phone, m.city, m.rating, m.reviews, m.experience, m.bio,
           COUNT(s.id) AS services_count,
           MIN(s.price) AS price_from
    FROM masters m
    LEFT JOIN services s ON s.master_id = m.id
    GROUP BY m.id
    ORDER BY m.rating DESC, m.reviews DESC
  `).all();
}

function getMasterById(id) {
  const master = db.prepare(`
    SELECT m.id, m.name, m.phone, m.city, m.rating, m.reviews, m.experience, m.bio
    FROM masters m WHERE m.id = ?
  `).get(id);
  if (!master) return null;
  master.services = db.prepare(`${serviceRow} WHERE s.master_id = ? ORDER BY s.id`).all(id);
  return master;
}

function getOrders() {
  return db.prepare(`
    SELECT o.id, o.customer_name, o.customer_phone, o.date, o.time, o.comment,
           o.price, o.status, o.created_at,
           o.lead_sent, o.lead_status, o.lead_error,
           o.city_id, o.city_name,
           o.service_id, s.title AS service_title, s.unit,
           m.name AS master_name, c.name AS category
    FROM orders o
    JOIN services s ON s.id = o.service_id
    JOIN masters m ON m.id = s.master_id
    JOIN categories c ON c.id = s.category_id
    ORDER BY o.created_at DESC, o.id DESC
  `).all();
}

const STATUS_TRANSITIONS = {
  new: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

/* ------------------------------------------------------------------ */
/* Отправка лида в API (gate.newapi.ru, метод /lead)                   */
/* ------------------------------------------------------------------ */

/**
 * Отправляет лид в партнёрский API.
 * @returns {{sent:boolean, status:string, error:string}}
 */
async function sendLeadToApi(order, service) {
  if (!apiConfig.enabled) {
    return { sent: false, status: 'disabled', error: 'Отправка лидов отключена (enabled=false)' };
  }
  if (!apiConfig.offer_id && !apiConfig.direction_id) {
    return { sent: false, status: 'not_configured', error: 'Не заданы offer_id / direction_id (data/config.json)' };
  }

  const hour = (() => {
    const m = String(order.time || '').match(/^(\d{1,2}):/);
    if (!m) return null;
    const h = Number(m[1]);
    return h >= 0 && h <= 23 ? h : null;
  })();

  const descriptionParts = [];
  if (service.title) descriptionParts.push(`Услуга: ${service.title}`);
  if (service.master_name) descriptionParts.push(`Мастер: ${service.master_name} (${service.city || '—'})`);
  if (order.city_name) descriptionParts.push(`Город: ${order.city_name}`);
  if (order.comment) descriptionParts.push(`Комментарий: ${order.comment}`);

  // Филиал: у города свой branch_id, иначе из конфига
  const city = order.city_id ? cityById(order.city_id) : null;
  const branch = city && city.branch_id !== null ? city.branch_id : apiConfig.branch_id;

  const payload = {
    offer_id: apiConfig.offer_id,
    direction_id: apiConfig.direction_id,
    branch_id: branch,
    city_id: order.city_id || null,
    phones: [String(order.customer_phone || '').trim()],
    name: truncate(order.customer_name, 50),
    address: truncate(order.address || '', 254),
    description: truncate(descriptionParts.join('. '), 254),
    comment: truncate(`SuperMaster MVP · заказ №${order.id}`, 254),
    is_pm: apiConfig.is_pm,
    date: order.date || null,
    hour_from: hour,
    hour_to: hour !== null ? Math.min(hour + 1, 23) : null,
    sub_id1: 'supermaster-mvp',
    utm_source: 'supermaster',
    utm_campaign: 'mvp',
  };

  const url = `https://gate.newapi.ru/lead?source=${encodeURIComponent(apiConfig.source)}&idp=${encodeURIComponent(apiConfig.idp)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.lead_timeout_ms || 8000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 204) return { sent: true, status: 'ok', error: '' };
    if (res.status === 202) return { sent: true, status: 'duplicate', error: '' };
    const text = await res.text().catch(() => '');
    return {
      sent: false,
      status: 'error',
      error: truncate(`HTTP ${res.status}: ${text}`, 254),
    };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError'
      ? `Таймаут (${apiConfig.lead_timeout_ms} мс)`
      : String(err.message || err);
    return { sent: false, status: 'error', error: truncate(msg, 254) };
  }
}

/* ------------------------------------------------------------------ */
/* API-роутер                                                          */
/* ------------------------------------------------------------------ */

async function handleApi(req, res, parts) {
  const method = req.method;
  const [resource, idStr, action] = parts;

  // GET /api/cities — справочник городов
  if (resource === 'cities' && method === 'GET') {
    return sendJson(res, 200, cities);
  }

  // GET /api/categories
  if (resource === 'categories' && method === 'GET') {
    return sendJson(res, 200, db.prepare(`
      SELECT c.id, c.name, c.icon, c.description, COUNT(s.id) AS services_count
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id
      GROUP BY c.id ORDER BY c.id
    `).all());
  }

  // GET /api/services  (?category= & q=)
  if (resource === 'services' && !idStr && method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const params = {
      category: url.searchParams.get('category') || '',
      q: (url.searchParams.get('q') || '').trim(),
    };
    return sendJson(res, 200, getServices(params));
  }

  // GET /api/services/:id
  if (resource === 'services' && idStr && !action && method === 'GET') {
    const id = parseId(idStr);
    if (!id) return sendJson(res, 400, { error: 'Неверный id услуги' });
    const service = getServiceById(id);
    if (!service) return sendJson(res, 404, { error: 'Услуга не найдена' });
    return sendJson(res, 200, service);
  }

  // GET /api/masters
  if (resource === 'masters' && !idStr && method === 'GET') {
    return sendJson(res, 200, getMasters());
  }

  // GET /api/masters/:id
  if (resource === 'masters' && idStr && !action && method === 'GET') {
    const id = parseId(idStr);
    if (!id) return sendJson(res, 400, { error: 'Неверный id мастера' });
    const master = getMasterById(id);
    if (!master) return sendJson(res, 404, { error: 'Мастер не найден' });
    return sendJson(res, 200, master);
  }

  // POST /api/orders — создание заказа
  if (resource === 'orders' && !idStr && method === 'POST') {
    const body = await readBody(req);
    const serviceId = parseId(body.service_id);
    const name = String(body.customer_name || '').trim();
    const phone = String(body.customer_phone || '').trim();
    const address = String(body.address || '').trim();
    const date = String(body.date || '');
    const time = String(body.time || '');
    const comment = String(body.comment || '').trim();
    const city = body.city_id ? cityById(body.city_id) : null;

    if (cities.length && !city) {
      return sendJson(res, 400, { error: 'Выберите город — это обязательное поле' });
    }
    if (!serviceId || !name || !phone || !date || !time) {
      return sendJson(res, 400, { error: 'Заполните все обязательные поля: услуга, имя, телефон, дата, время' });
    }
    const service = getServiceById(serviceId);
    if (!service) return sendJson(res, 400, { error: 'Услуга не найдена' });

    const result = db.prepare(`
      INSERT INTO orders (service_id, customer_name, customer_phone, address, date, time, comment, price, city_id, city_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, name, phone, address, date, time, comment, service.price, city ? city.id : null, city ? city.name : '');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    // Отправка лида в партнёрский API (не блокирует создание заказа при ошибке)
    try {
      const lead = await sendLeadToApi(order, service);
      db.prepare('UPDATE orders SET lead_sent = ?, lead_status = ?, lead_error = ? WHERE id = ?')
        .run(lead.sent ? 1 : 0, lead.status, lead.error, order.id);
      Object.assign(order, {
        lead_sent: lead.sent ? 1 : 0,
        lead_status: lead.status,
        lead_error: lead.error,
      });
    } catch (err) {
      db.prepare("UPDATE orders SET lead_sent = 0, lead_status = 'error', lead_error = ? WHERE id = ?")
        .run(String(err.message || err), order.id);
      Object.assign(order, { lead_sent: 0, lead_status: 'error', lead_error: String(err.message || err) });
    }

    return sendJson(res, 201, order);
  }

  // GET /api/orders
  if (resource === 'orders' && !idStr && method === 'GET') {
    return sendJson(res, 200, getOrders());
  }

  // POST /api/orders/:id/pay — симуляция оплаты
  if (resource === 'orders' && idStr && action === 'pay' && method === 'POST') {
    const id = parseId(idStr);
    if (!id) return sendJson(res, 400, { error: 'Неверный id заказа' });
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return sendJson(res, 404, { error: 'Заказ не найден' });
    if (order.status !== 'new') {
      return sendJson(res, 400, { error: `Оплатить можно только новый заказ (текущий статус: ${order.status})` });
    }
    db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(id);
    return sendJson(res, 200, db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  }

  // PATCH /api/orders/:id — смена статуса (подтвердить / завершить / отменить)
  if (resource === 'orders' && idStr && !action && method === 'PATCH') {
    const id = parseId(idStr);
    if (!id) return sendJson(res, 400, { error: 'Неверный id заказа' });
    const body = await readBody(req);
    const target = String(body.status || '');
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return sendJson(res, 404, { error: 'Заказ не найден' });
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(target)) {
      return sendJson(res, 400, { error: `Нельзя перевести заказ из «${order.status}» в «${target}»` });
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(target, id);
    return sendJson(res, 200, db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  }

  return sendJson(res, 404, { error: 'API-метод не найден' });
}

/* ------------------------------------------------------------------ */
/* Статика                                                             */
/* ------------------------------------------------------------------ */

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  let resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    resolved = path.join(PUBLIC_DIR, 'index.html');
  }
  const ext = path.extname(resolved).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const data = fs.readFileSync(resolved);
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length });
  res.end(data);
}

/* ------------------------------------------------------------------ */
/* Сервер                                                              */
/* ------------------------------------------------------------------ */

initDb();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  try {
    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, splitApiPath(pathname.slice(4)));
      return;
    }
    if (req.method === 'GET') {
      serveStatic(req, res, pathname);
      return;
    }
    res.writeHead(405);
    res.end('Method Not Allowed');
  } catch (err) {
    console.error('[SuperMaster] Ошибка:', err);
    sendJson(res, 500, { error: 'Внутренняя ошибка сервера', detail: String(err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ⚡ SuperMaster — MVP маркетплейс услуг');
  console.log(`  ➜  http://${HOST}:${PORT}`);
  console.log('');
});