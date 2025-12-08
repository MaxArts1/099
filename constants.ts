import { Product } from './types';

export const WHATSAPP_PHONE = '79649406556';
export const EXTERNAL_SITE_URL = 'https://alp-pro.clients.site/';

// Pricing strategy: No price below 24,000 RUB.
export const PRODUCTS: Product[] = [
  // Budget Segment (Prices adjusted to min 24k)
  { id: '1', brand: 'CHIGO', model: 'CP-1A-07', type: 'ON-OFF', btu: '7000', retail: 24000, segment: 'Budget', benefit: 'Экономичное решение для небольших помещений', imageSeed: 101 },
  { id: '2', brand: 'KENTATSU', model: 'KSGYK26', type: 'INVERTER', btu: '9000', retail: 24500, segment: 'Budget', benefit: 'Лучший инвертор в бюджетном сегменте', imageSeed: 102 },
  { id: '3', brand: 'AQUA', model: 'AQ-20BIWA', type: 'ON-OFF', btu: '7000', retail: 24900, segment: 'Budget', benefit: 'Надежность и доступность', imageSeed: 103 },
  { id: '4', brand: 'AUX', model: 'ASW-H07A4BA-R2DI', type: 'ON-OFF', btu: '7000', retail: 25100, segment: 'Budget', benefit: 'Wi-Fi управление в базовой модели', imageSeed: 104 },
  { id: '5', brand: 'HAIER', model: 'HSU-07HPL303 CORAL', type: 'ON-OFF', btu: '7000', retail: 24900, segment: 'Budget', benefit: 'Популярная модель с хорошими отзывами', imageSeed: 105 },
  { id: '6', brand: 'HAIER', model: 'HSU-07HTT03 TUNDRA', type: 'ON-OFF', btu: '7000', retail: 24900, segment: 'Budget', benefit: 'Эффективное охлаждение до -7°C', imageSeed: 106 },
  { id: '7', brand: 'AQUA', model: 'AQ-25BIWA', type: 'ON-OFF', btu: '8500', retail: 25600, segment: 'Budget', benefit: 'Оптимальная мощность для средних комнат', imageSeed: 107 },
  { id: '8', brand: 'CHIGO', model: 'CS-21H3A LOTOS', type: 'ON-OFF', btu: '7000', retail: 24100, segment: 'Budget', benefit: 'Стильный дизайн и надежность', imageSeed: 108 },
  { id: '9', brand: 'AUX', model: 'ASW-H09A4BA-R2DI', type: 'ON-OFF', btu: '9000', retail: 24200, segment: 'Budget', benefit: 'Wi-Fi и таймер в доступной цене', imageSeed: 109 },
  { id: '10', brand: 'HAIER', model: 'HSU-09HTT03 TUNDRA', type: 'ON-OFF', btu: '9000', retail: 27600, segment: 'Budget', benefit: 'Тихая работа и эффективное охлаждение', imageSeed: 110 },
  { id: '11', brand: 'HAIER', model: 'HSU-09HPL303 CORAL', type: 'ON-OFF', btu: '9000', retail: 27600, segment: 'Budget', benefit: 'Проверенная временем модель', imageSeed: 111 },
  { id: '12', brand: 'BALLU', model: 'BSAGI-07HN8V4', type: 'ON-OFF', btu: '7000', retail: 24400, segment: 'Budget', benefit: 'Европейское качество', imageSeed: 112 },
  { id: '13', brand: 'CHIGO', model: 'CP-1A-09', type: 'ON-OFF', btu: '9000', retail: 24900, segment: 'Budget', benefit: 'Лучшая цена в своем классе', imageSeed: 113 },
  { id: '14', brand: 'BALLU', model: 'BSAGI-09HN8V4', type: 'ON-OFF', btu: '9000', retail: 25000, segment: 'Budget', benefit: 'Надежность и долговечность', imageSeed: 114 },
  { id: '15', brand: 'CHIGO', model: 'CS-25H3A LOTOS', type: 'ON-OFF', btu: '8500', retail: 26600, segment: 'Budget', benefit: 'Элегантный дизайн и эффективность', imageSeed: 115 },

  // Basic Segment
  { id: '16', brand: 'AQUA', model: 'AQI-20BIQ BIWA DC', type: 'INVERTER', btu: '7000', retail: 30800, segment: 'Basic', benefit: 'Экономия электроэнергии до 30%', imageSeed: 201 },
  { id: '17', brand: 'HAIER', model: 'AS20HQJ1HRA QUANTUM', type: 'INVERTER', btu: '7000', retail: 35600, segment: 'Basic', benefit: 'Инвертор с Wi-Fi управлением', imageSeed: 202 },
  { id: '18', brand: 'AQUA', model: 'AQI-25BIQ BIWA DC', type: 'INVERTER', btu: '9000', retail: 32300, segment: 'Basic', benefit: 'Тихая работа и высокая эффективность', imageSeed: 203 },
  { id: '19', brand: 'HAIER', model: 'AS25HQJ1HRA QUANTUM', type: 'INVERTER', btu: '9000', retail: 38800, segment: 'Basic', benefit: 'Умное управление через приложение', imageSeed: 204 },
  { id: '20', brand: 'HAIER', model: 'AS20HPL2HRA CORAL', type: 'INVERTER', btu: '7000', retail: 40000, segment: 'Basic', benefit: 'Класс A++ энергоэффективности', imageSeed: 205 },
  { id: '21', brand: 'GREE', model: 'GWH07AAAXA BORA', type: 'ON-OFF', btu: '7000', retail: 41300, segment: 'Basic', benefit: 'Надежность от ведущего производителя', imageSeed: 206 },
  { id: '22', brand: 'TCL', model: 'DH-09I ONYX', type: 'INVERTER', btu: '9000', retail: 35800, segment: 'Basic', benefit: 'Современный дизайн и технологии', imageSeed: 207 },
  { id: '23', brand: 'CHIGO', model: 'CS-25V3A ALBA', type: 'INVERTER', btu: '9000', retail: 36900, segment: 'Basic', benefit: 'Отличное соотношение цена/качество', imageSeed: 208 },
  { id: '24', brand: 'MIDEA', model: 'DS-09I BRILLIANT', type: 'INVERTER', btu: '9000', retail: 37000, segment: 'Basic', benefit: 'Инновационные технологии охлаждения', imageSeed: 209 },
  { id: '25', brand: 'HAIER', model: 'AS25HPL2HRA CORAL', type: 'INVERTER', btu: '9000', retail: 43100, segment: 'Basic', benefit: 'Премиум функции в базовом сегменте', imageSeed: 210 },
  { id: '26', brand: 'GREE', model: 'GWH09AAAXA BORA', type: 'ON-OFF', btu: '9000', retail: 45330, segment: 'Basic', benefit: 'Профессиональная серия', imageSeed: 211 },
  { id: '27', brand: 'AQUA', model: 'AQI-25PIQ TOYA', type: 'INVERTER', btu: '9000', retail: 42500, segment: 'Basic', benefit: 'Wi-Fi и премиум функции', imageSeed: 212 },

  // Middle Segment
  { id: '28', brand: 'ELECTROLUX', model: 'EACS-I-09HP PORTOFINO', type: 'ON-OFF', btu: '9000', retail: 51990, segment: 'Middle', benefit: 'Шведское качество и дизайн', imageSeed: 301 },
  { id: '29', brand: 'ELECTROLUX', model: 'EACS-I-09HP PORTOFINO INV', type: 'INVERTER', btu: '9000', retail: 51990, segment: 'Middle', benefit: 'Инверторная технология от Electrolux', imageSeed: 302 },
  { id: '30', brand: 'CHIGO', model: 'CS-25V3G SUNRISE EU', type: 'INVERTER', btu: '9000', retail: 56200, segment: 'Middle', benefit: 'Европейские стандарты качества', imageSeed: 303 },
  { id: '31', brand: 'GREE', model: 'GWH09AGAXA PULAR', type: 'INVERTER', btu: '9000', retail: 65630, segment: 'Middle', benefit: 'Технология Pular для чистого воздуха', imageSeed: 304 },
  { id: '32', brand: 'GREE', model: 'GWH09AAAXA BORA INV', type: 'INVERTER', btu: '9000', retail: 66500, segment: 'Middle', benefit: 'Инвертор с функцией самоочистки', imageSeed: 305 },
  { id: '33', brand: 'CHIGO', model: 'CS-32V3G SUNRISE', type: 'INVERTER', btu: '12000', retail: 60500, segment: 'Middle', benefit: 'Повышенная мощность для больших помещений', imageSeed: 306 },
  { id: '34', brand: 'AQUA', model: 'AQI-25FIS TOWADA', type: 'INVERTER', btu: '9000', retail: 63100, segment: 'Middle', benefit: 'Премиум инвертор с Wi-Fi', imageSeed: 307 },

  // Premium Segment
  { id: '35', brand: 'GREE', model: 'GWH09AGCXB ARCTIC', type: 'INVERTER', btu: '9000', retail: 89300, segment: 'Premium', benefit: 'Работа при -30°C, Arctic технология', imageSeed: 401 },
  { id: '36', brand: 'GREE', model: 'GWH09AKCXD SOYAL', type: 'INVERTER', btu: '9000', retail: 157500, segment: 'Premium', benefit: 'Флагманская модель с Wi-Fi и R32', imageSeed: 402 },
  { id: '37', brand: 'PANASONIC', model: 'CS-Z25YKEA KITAKAZE', type: 'INVERTER', btu: '8500', retail: 121800, segment: 'Premium', benefit: 'Японское качество и Nanoe™ технология', imageSeed: 403 }
];
