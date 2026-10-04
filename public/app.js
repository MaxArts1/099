'use strict';

/* ===== SuperMaster — клиент ===== */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  categories: [],
  services: [],
  masters: [],
  orders: [],
  cities: [],
  filters: { category: '', query: '' },
  view: 'catalog',
  bookingService: null,
};

/* ---------- Форматирование ---------- */
const fmtPrice = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' });
};

const fmtNum = (n) => new Intl.NumberFormat('ru-RU').format(n);

const STATUS_LABEL = {
  new: 'Новый',
  paid: 'Оплачен',
  confirmed: 'Подтверждён мастером',
  done: 'Выполнен',
  cancelled: 'Отменён',
};

const LEAD_LABEL = {
  ok: { icon: '✅', text: 'Лид отправлен в API' },
  duplicate: { icon: '🔄', text: 'Лид: дубль (заявка уже есть)' },
  error: { icon: '❌', text: 'Лид: ошибка отправки' },
  not_configured: { icon: '⚙️', text: 'Отправка лида не настроена (offer/direction)' },
  disabled: { icon: '⚙️', text: 'Отправка лидов отключена' },
  pending: { icon: '⏳', text: 'Лид отправляется…' },
};

function stars(rating) {
  const full = Math.round(rating);
  let s = '';
  for (let i = 0; i < 5; i++) s += i < full ? '★' : '☆';
  return s;
}

/* ---------- API ---------- */
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data;
}

/* ---------- Загрузка данных ---------- */
async function loadAll() {
  state.categories = await api('/categories');
  state.services = await api('/services');
  state.masters = await api('/masters');
  state.orders = await api('/orders');
  state.cities = await api('/cities').catch(() => []);
}

/* ---------- Навигация ---------- */
function setView(view) {
  state.view = view;
  // Desktop nav
  $$('.nav-link').forEach((b) => b.classList.toggle('active', b.dataset.nav === view || (view === 'home' && b.dataset.nav === 'catalog')));
  // Mobile bottom nav
  $$('.mobile-nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.nav === view || (view === 'home' && b.dataset.nav === 'home')));
  // Секции
  $('#home').hidden = view !== 'home';
  $('#catalog').hidden = view !== 'catalog' && view !== 'home';
  $('#masters').hidden = view !== 'masters';
  $('#orders').hidden = view !== 'orders';
  const howItWorks = $('#how-it-works');
  if (howItWorks) howItWorks.hidden = view !== 'home';
  if (view === 'masters') renderMasters();
  if (view === 'orders') renderOrders();
  if (view === 'catalog' || view === 'home') renderServices();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Категории-чипы ---------- */
/* ---------- Категории (цветная сетка) ---------- */
// Маппинг id категории -> css-класс и цветной блок для карточек услуг
const CATEGORY_CLASS = {
  1: 'cat-repair', 2: 'cat-electric', 3: 'cat-plumbing',
  4: 'cat-cleaning', 5: 'cat-furniture', 6: 'cat-appliances',
};
const CATEGORY_EMOJI = {
  1: '🔨', 2: '⚡', 3: '🚿', 4: '🧹', 5: '🪑', 6: '🔧',
};
// Цвета-заглушки для карточек услуг по категориям (градиенты)
const CATEGORY_GRADIENT = {
  1: 'linear-gradient(135deg,#e8f0fe,#cfe0ff)',
  2: 'linear-gradient(135deg,#fff3d6,#ffe9ab)',
  3: 'linear-gradient(135deg,#dff3f7,#c3ebf1)',
  4: 'linear-gradient(135deg,#e6f6e8,#c9ecd0)',
  5: 'linear-gradient(135deg,#f3e6f5,#e3c8e8)',
  6: 'linear-gradient(135deg,#fdeae6,#ffd0c2)',
};

function renderCategories() {
  const grid = $('#category-grid');
  if (!grid) return;
  grid.innerHTML = state.categories.map((c) => {
    const cls = CATEGORY_CLASS[c.id] || 'cat-repair';
    return `
      <article class="cat-card ${cls}" data-cat="${c.id}">
        <div class="cat-arrow"><span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span></div>
        <div class="cat-emoji">${c.icon}</div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.services_count} услуг</div>
      </article>
    `;
  }).join('');
  grid.querySelectorAll('.cat-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.filters.category = card.dataset.cat;
      setView('catalog');
    });
  });
}

/* ---------- Фильтры каталога ---------- */
function renderFilters() {
  const box = $('#catalog-filters');
  const html = ['<button class="filter-btn active" data-cat="">Все</button>'];
  state.categories.forEach((c) => {
    html.push(`<button class="filter-btn" data-cat="${c.id}">${c.icon} ${c.name}</button>`);
  });
  box.innerHTML = html.join('');
  box.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filters.category = btn.dataset.cat;
      box.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderServices();
    });
  });
}

/* ---------- Услуги ---------- */
function getFilteredServices() {
  let list = state.services;
  if (state.filters.category) {
    list = list.filter((s) => String(s.category_id) === String(state.filters.category));
  }
  const q = state.filters.query.trim().toLowerCase();
  if (q) {
    list = list.filter((s) =>
      `${s.title} ${s.description} ${s.master_name} ${s.category} ${s.city}`.toLowerCase().includes(q)
    );
  }
  return list;
}

function renderServices() {
  const grid = $('#services-grid');
  const sub = $('#catalog-sub');
  if (sub) {
    const q = state.filters.query.trim();
    const cat = state.categories.find((c) => String(c.id) === String(state.filters.category));
    sub.textContent = q ? `Результаты поиска «${q}»` : cat ? `${cat.icon} ${cat.name}` : 'Прозрачные цены · онлайн-бронирование';
  }
  const list = getFilteredServices();
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">search_off</span>Ничего не найдено. Попробуйте изменить запрос.</div>';
    return;
  }
  grid.innerHTML = list.map((s) => {
    const grad = CATEGORY_GRADIENT[s.category_id] || CATEGORY_GRADIENT[1];
    const emoji = CATEGORY_EMOJI[s.category_id] || '🛠';
    const initials = s.master_name ? s.master_name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '';
    return `
      <article class="service-card">
        <div class="service-img" style="background:${grad};">
          <span>${emoji}</span>
          <span class="badge-top">${s.category}</span>
        </div>
        <div class="service-body">
          <div class="service-title">${s.title}</div>
          <div class="service-desc">${s.description}</div>
          <div class="service-meta">
            <span class="material-symbols-outlined">person</span> ${s.master_name}
            <span class="material-symbols-outlined">location_on</span> ${s.city}
            <span class="material-symbols-outlined">schedule</span> ~${Math.round(s.duration_min / 60 * 10) / 10} ч
          </div>
          <div class="service-meta">
            <span class="stars">${stars(s.rating)}</span>
            <span class="rating-num">${s.rating.toFixed(1)}</span>
            <span class="reviews-count">(${fmtNum(s.reviews)})</span>
          </div>
        </div>
        <div class="service-footer">
          <div class="service-price">${fmtPrice(s.price)} <small>/ ${s.unit}</small></div>
          <button class="btn btn-amber" data-book="${s.id}" style="padding:10px 16px;font-size:0.85rem;">Забронировать</button>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-book]').forEach((btn) => {
    btn.addEventListener('click', () => openBooking(Number(btn.dataset.book)));
  });
}

/* ---------- Мастера ---------- */
function renderMasters() {
  const grid = $('#masters-grid');
  if (!state.masters.length) {
    grid.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">group_off</span>Мастера пока не загружены.</div>';
    return;
  }
  grid.innerHTML = state.masters.map((m) => {
    const initials = m.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
    return `
      <article class="master-card" data-master="${m.id}">
        <div class="master-top">
          <div class="avatar">${initials}</div>
          <div>
            <div class="master-name">${m.name}</div>
            <div class="master-sub"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px;">location_on</span> ${m.city} · опыт ${m.experience} лет</div>
          </div>
        </div>
        <div class="service-meta" style="margin-bottom:10px;">
          <span class="stars">${stars(m.rating)}</span>
          <span class="rating-num">${m.rating.toFixed(1)}</span>
          <span class="reviews-count">(${fmtNum(m.reviews)} отзывов)</span>
        </div>
        <p class="master-bio">${m.bio}</p>
        <div class="master-footer">
          <span><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px;">build</span> <b>${m.services_count}</b> услуг</span>
          <span>от <b>${fmtPrice(m.price_from)}</b></span>
        </div>
      </article>
    `;
  }).join('');
  grid.querySelectorAll('[data-master]').forEach((card) => {
    card.addEventListener('click', () => openMaster(Number(card.dataset.master)));
  });
}

/* ---------- Заказы ---------- */
const ORDER_STATUS_LABEL = STATUS_LABEL;

function leadBadge(o) {
  const info = LEAD_LABEL[o.lead_status];
  if (!info) return '';
  const errTip = o.lead_error ? ` title="${o.lead_error.replace(/"/g, '&quot;')}"` : '';
  return `<div class="order-sub lead-status"${errTip}>${info.icon} ${info.text}</div>`;
}

function orderActions(o) {
  const btns = [];
  if (o.status === 'new') btns.push({ label: 'Оплатить', icon: 'credit_card', action: 'pay', cls: 'btn-amber' });
  if (o.status === 'paid') btns.push({ label: 'Подтвердить', icon: 'check_circle', action: 'confirmed', cls: 'btn-blue' });
  if (o.status === 'confirmed') btns.push({ label: 'Завершить', icon: 'flag', action: 'done', cls: 'btn-blue' });
  if (['new', 'paid', 'confirmed'].includes(o.status)) btns.push({ label: 'Отменить', icon: 'close', action: 'cancelled', cls: 'btn-danger' });
  return btns;
}

function renderOrders() {
  const list = $('#orders-list');
  if (!state.orders.length) {
    list.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">receipt_long</span>Заказов пока нет. Выберите услугу в каталоге и забронируйте!</div>';
    const badge = $('#orders-count');
    if (badge) badge.hidden = true;
    return;
  }
  const badge = $('#orders-count');
  if (badge) { badge.hidden = false; badge.textContent = state.orders.length; }
  list.innerHTML = state.orders.map((o) => `
    <article class="order-card">
      <div class="order-info">
        <h3>${o.service_title} <span class="status-badge status-${o.status}">${ORDER_STATUS_LABEL[o.status] || o.status}</span></h3>
        <div class="order-sub"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px;">person</span> ${o.master_name} · ${o.category}</div>
        <div class="order-when">
          <span><span class="material-symbols-outlined">calendar_today</span> ${fmtDate(o.date)}</span>
          <span><span class="material-symbols-outlined">schedule</span> ${o.time}</span>
          ${o.city_name ? `<span><span class="material-symbols-outlined">location_on</span> ${o.city_name}</span>` : ''}
          ${o.address ? `<span><span class="material-symbols-outlined">home</span> ${o.address}</span>` : ''}
          <span><span class="material-symbols-outlined">call</span> ${o.customer_name} · ${o.customer_phone}</span>
        </div>
        ${o.comment ? `<div class="order-sub"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px;">chat</span> ${o.comment}</div>` : ''}
        <div class="order-sub" style="margin-top:6px;font-weight:800;font-size:0.95rem;">${fmtPrice(o.price)} <span style="font-weight:500;color:var(--slate);font-size:0.82rem;">· заказ №${o.id}</span></div>
        ${leadBadge(o)}
      </div>
      <div class="order-actions">
        ${orderActions(o).map((b) => `<button class="btn ${b.cls}" data-order-act="${o.id}" data-action="${b.action}"><span class="material-symbols-outlined" style="font-size:16px;">${b.icon}</span> ${b.label}</button>`).join('')}
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-order-act]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.orderAct);
      const action = btn.dataset.action;
      try {
        if (action === 'pay') {
          await api(`/orders/${id}/pay`, { method: 'POST' });
          toast('✅ Заказ оплачен. Мастер подтвердит запись.');
        } else {
          await api(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: action }),
          });
          toast(statusMsg(action));
        }
        await refreshOrders();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function statusMsg(action) {
  return {
    confirmed: '📅 Мастер подтвердил заказ!',
    done: '🏁 Заказ завершён. Спасибо!',
    cancelled: 'Заказ отменён.',
  }[action] || 'Статус обновлён.';
}

async function refreshOrders() {
  state.orders = await api('/orders');
  renderOrders();
}

/* ---------- Модалка бронирования ---------- */
const TIME_SLOTS = [];
for (let h = 9; h <= 18; h++) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function openBooking(serviceId) {
  const s = state.services.find((x) => x.id === serviceId);
  if (!s) return;
  state.bookingService = s;
  $('#booking-title').textContent = s.title;
  $('#booking-summary').innerHTML = `
    <div class="bs-title">${s.master_name} · ★ ${s.rating.toFixed(1)}</div>
    <div class="bs-sub">${s.category_icon} ${s.category} · ${fmtPrice(s.price)} / ${s.unit}</div>
  `;
  // Город: предлагаем клиенту выбрать (обязательно, если справочник задан)
  const citySel = $('#b-city');
  const cityRow = $('#city-row');
  if (state.cities.length) {
    cityRow.hidden = false;
    const saved = localStorage.getItem('sm_city_id');
    citySel.innerHTML = [
      '<option value="" disabled selected>Выберите город…</option>',
      ...state.cities.map((c) => `<option value="${c.id}">${c.name}</option>`),
    ].join('');
    if (saved && state.cities.some((c) => String(c.id) === saved)) {
      citySel.value = saved;
    }
  } else {
    cityRow.hidden = true;
  }
  const dateInput = $('#b-date');
  dateInput.min = todayIso();
  dateInput.value = dateInput.value || todayIso();
  const timeSel = $('#b-time');
  timeSel.innerHTML = TIME_SLOTS.map((t) => `<option value="${t}">${t}</option>`).join('');
  $('#b-name').value = localStorage.getItem('sm_name') || '';
  $('#b-phone').value = localStorage.getItem('sm_phone') || '';
  $('#b-address').value = localStorage.getItem('sm_address') || '';
  $('#b-comment').value = '';
  $('#booking-total-price').textContent = fmtPrice(s.price);
  $('#booking-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

$('#booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const s = state.bookingService;
  if (!s) return;
  const name = $('#b-name').value.trim();
  const phone = $('#b-phone').value.trim();
  const address = $('#b-address').value.trim();
  const cityId = state.cities.length ? $('#b-city').value : '';
  try {
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        service_id: s.id,
        customer_name: name,
        customer_phone: phone,
        address,
        date: $('#b-date').value,
        time: $('#b-time').value,
        comment: $('#b-comment').value.trim(),
        city_id: cityId ? Number(cityId) : null,
      }),
    });
    localStorage.setItem('sm_name', name);
    localStorage.setItem('sm_phone', phone);
    if (address) localStorage.setItem('sm_address', address);
    if (cityId) localStorage.setItem('sm_city_id', cityId);
    closeModal('#booking-modal');
    openPayModal(order);
    await refreshOrders();
  } catch (err) {
    toast(err.message, true);
  }
});

/* ---------- Модалка оплаты ---------- */
function openPayModal(order) {
  $('#pay-summary').innerHTML = `
    <div class="ps-row"><span>Услуга</span><b>${order.service_title || ''}</b></div>
    ${order.city_name ? `<div class="ps-row"><span>Город</span><b>${order.city_name}</b></div>` : ''}
    ${order.address ? `<div class="ps-row"><span>Адрес</span><b>${order.address}</b></div>` : ''}
    <div class="ps-row"><span>Дата и время</span><b>${fmtDate(order.date)} · ${order.time}</b></div>
    <div class="ps-row"><span>Сумма</span><b>${fmtPrice(order.price)}</b></div>
  `;
  $('#pay-now-btn').onclick = async () => {
    try {
      await api(`/orders/${order.id}/pay`, { method: 'POST' });
      closeModal('#pay-modal');
      toast('✅ Оплата прошла успешно! Мастер подтвердит запись.');
      setView('orders');
      await refreshOrders();
    } catch (err) {
      toast(err.message, true);
    }
  };
  $('#pay-later-btn').onclick = () => {
    closeModal('#pay-modal');
    toast(`Заказ №${order.id} сохранён — оплатить можно в разделе «Мои заказы».`);
    setView('orders');
  };
  $('#pay-modal-text').textContent = order.service_title ? `«${order.service_title}» — мастер уже получил уведомление.` : 'Мастер уже получил уведомление.';
  $('#pay-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ---------- Модалка мастера ---------- */
async function openMaster(masterId) {
  try {
    const m = await api(`/masters/${masterId}`);
    const initials = m.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
    $('#master-modal-content').innerHTML = `
      <div class="master-modal-head">
        <div class="avatar">${initials}</div>
        <div>
          <h3 style="margin:0;">${m.name}</h3>
          <div class="muted">📍 ${m.city} · опыт ${m.experience} лет · ${m.phone}</div>
          <div><span class="stars">${stars(m.rating)}</span> <span class="rating-num">${m.rating.toFixed(1)}</span> <span class="reviews-count">(${fmtNum(m.reviews)} отзывов)</span></div>
        </div>
      </div>
      <p class="master-bio">${m.bio}</p>
      <h4 style="margin-bottom:10px;">Услуги мастера</h4>
      <div class="master-modal-services">
        ${m.services.map((s) => `
          <div class="mm-service">
            <div>
              <div class="ms-title">${s.title}</div>
              <div class="ms-cat">${s.category_icon} ${s.category} · ~${Math.round(s.duration_min / 60 * 10) / 10} ч</div>
            </div>
            <div style="text-align:right;">
              <div class="ms-price">${fmtPrice(s.price)}</div>
              <button class="btn btn-amber" style="padding:6px 12px;font-size:0.8rem;" data-mbook="${s.id}">Забронировать</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    $('#master-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#master-modal-content').querySelectorAll('[data-mbook]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeModal('#master-modal');
        openBooking(Number(btn.dataset.mbook));
      });
    });
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- Общие helpers ---------- */
function closeModal(sel) {
  $(sel).hidden = true;
  document.body.style.overflow = '';
}

$$('.modal-overlay').forEach((ov) => {
  ov.addEventListener('click', (e) => {
    if (e.target === ov) {
      ov.hidden = true;
      document.body.style.overflow = '';
    }
  });
});
$$('[data-close-modal]').forEach((b) => {
  b.addEventListener('click', () => {
    b.closest('.modal-overlay').hidden = true;
    document.body.style.overflow = '';
  });
});

let toastTimer;
function toast(msg, isError = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------- Инициализация ---------- */
async function init() {
  await loadAll();
  renderCategories();
  renderFilters();
  renderServices();
  setView('home');
  setupCitySelect();
  setupThemeToggle();
  setupNavigation();
}

function setupCitySelect() {
  const sel = $('#header-city');
  if (!sel || !state.cities.length) {
    if (sel) sel.parentElement.hidden = true;
    return;
  }
  sel.innerHTML = state.cities.map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
  const saved = localStorage.getItem('sm_city');
  if (saved && state.cities.some((c) => c.name === saved)) sel.value = saved;
  sel.addEventListener('change', () => {
    localStorage.setItem('sm_city', sel.value);
    state.currentCity = sel.value;
  });
  state.currentCity = sel.value || state.cities[0]?.name || 'Москва';
}

function setupThemeToggle() {
  const btn = $('#theme-toggle');
  if (!btn) return;
  const isDark = localStorage.getItem('sm_theme') === 'dark';
  if (isDark) document.documentElement.classList.add('dark');
  btn.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('sm_theme', dark ? 'dark' : 'light');
    btn.querySelector('.material-symbols-outlined').textContent = dark ? 'light_mode' : 'dark_mode';
  });
}

function setupNavigation() {
  $$('.nav-link, .mobile-nav-btn').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.nav));
  });
  $('#search-btn').addEventListener('click', () => {
    state.filters.query = $('#search-input').value;
    setView('catalog');
  });
  $('#search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.filters.query = $('#search-input').value;
      setView('catalog');
    }
  });
  // CTA banner button (data-nav links)
  $$('[data-nav]').forEach((b) => {
    if (!b.classList.contains('nav-link') && !b.classList.contains('mobile-nav-btn')) {
      b.addEventListener('click', () => setView(b.dataset.nav));
    }
  });
}

init().catch((err) => {
  toast('Не удалось загрузить данные: ' + err.message, true);
});