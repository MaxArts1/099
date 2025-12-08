import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS, WHATSAPP_PHONE, EXTERNAL_SITE_URL } from './constants';
import { Segment } from './types';
import ProductCard from './components/ProductCard';

const ITEMS_PER_PAGE = 8; // Показываем по 8 товаров за раз для быстрой загрузки

const App: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<Segment | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Сбрасываем количество видимых товаров при смене фильтров
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [activeFilter, searchQuery]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      const matchFilter = activeFilter === 'all' || product.segment === activeFilter;
      const matchSearch = 
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.model.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activeFilter, searchQuery]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 text-white pt-12 pb-24 px-4 shadow-xl relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-block mb-4">
                 <a href={EXTERNAL_SITE_URL} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-2">
                    <i className="fas fa-external-link-alt"></i> ALP-PRO.CLIENTS.SITE
                </a>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
                Кондиционеры в Сочи
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 font-medium max-w-2xl mx-auto leading-relaxed">
                Модели 07–09 BTU. Профессиональный монтаж и сервис.
            </p>
            
            <div className="inline-flex items-center gap-3 bg-white text-blue-900 px-6 py-3 rounded-full shadow-2xl mb-10 transform hover:scale-105 transition-transform duration-300">
                <i className="fas fa-truck-fast text-orange-500 text-xl"></i>
                <span className="text-sm font-bold uppercase tracking-wide">Бесплатно: Адлер — Дагомыс</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                    <div className="text-2xl font-black text-white">37+</div>
                    <div className="text-xs font-medium text-blue-200 uppercase tracking-wider mt-1">Моделей</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                    <div className="text-2xl font-black text-white">24 000 ₽</div>
                    <div className="text-xs font-medium text-blue-200 uppercase tracking-wider mt-1">Цена от</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                    <div className="text-2xl font-black text-white">-10%</div>
                    <div className="text-xs font-medium text-blue-200 uppercase tracking-wider mt-1">Монтаж Премиум</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                    <div className="text-2xl font-black text-white">24/7</div>
                    <div className="text-xs font-medium text-blue-200 uppercase tracking-wider mt-1">Поддержка</div>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 flex-grow w-full">
         {/* Search & Filters */}
         <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-gray-100">
            <div className="flex flex-col gap-6">
                <div className="relative w-full">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск бренда или модели..." 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-gray-700 font-medium placeholder-gray-400"
                    />
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar -mx-2 px-2 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
                    {(['all', 'Budget', 'Basic', 'Middle', 'Premium'] as const).map((filter) => (
                         <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                                activeFilter === filter 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {filter === 'all' ? 'Все модели' : filter === 'Budget' ? 'Бюджет' : filter === 'Basic' ? 'Базовый' : filter === 'Middle' ? 'Средний' : 'Премиум'}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Benefits Grid */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-blue-600 rounded-3xl p-6 text-white flex items-center gap-5 shadow-lg shadow-blue-200">
                <div className="bg-white/20 p-3 rounded-2xl">
                    <i className="fas fa-map-location-dot text-2xl"></i>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Адлер — Дагомыс</h3>
                    <p className="text-sm text-blue-100 font-medium opacity-90">Бесплатная доставка до двери</p>
                </div>
            </div>
            <div className="bg-emerald-500 rounded-3xl p-6 text-white flex items-center gap-5 shadow-lg shadow-emerald-200">
                <div className="bg-white/20 p-3 rounded-2xl">
                     <i className="fab fa-whatsapp text-2xl"></i>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Консультация</h3>
                    <p className="text-sm text-emerald-100 font-medium opacity-90">Поможем выбрать за 5 минут</p>
                </div>
            </div>
            <div className="bg-rose-500 rounded-3xl p-6 text-white flex items-center gap-5 shadow-lg shadow-rose-200">
                <div className="bg-white/20 p-3 rounded-2xl">
                    <i className="fas fa-screwdriver-wrench text-2xl"></i>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Монтаж -10%</h3>
                    <p className="text-sm text-rose-100 font-medium opacity-90">Скидка на премиум сегмент</p>
                </div>
            </div>
        </div>

        {/* Product Grid */}
        {visibleProducts.length > 0 ? (
             <div className="flex flex-col items-center mb-16">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full mb-8">
                    {visibleProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                 </div>
                 
                 {hasMore && (
                     <button 
                        onClick={handleShowMore}
                        className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-xl active:scale-95"
                     >
                        Показать еще ({filteredProducts.length - visibleCount})
                     </button>
                 )}
             </div>
        ) : (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 mb-16">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-search text-3xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ничего не найдено</h3>
                <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
            </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-800 pb-12">
                <div>
                    <h4 className="text-2xl font-bold mb-8 text-white">Контакты</h4>
                    <div className="space-y-5">
                        <a href={`tel:+${WHATSAPP_PHONE}`} className="flex items-center gap-4 text-lg text-slate-300 hover:text-white transition-colors group">
                            <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                <i className="fas fa-phone-alt text-sm"></i>
                            </span> 
                            +7 (964) 940-65-56
                        </a>
                        <a href={`https://wa.me/${WHATSAPP_PHONE}`} className="flex items-center gap-4 text-lg text-slate-300 hover:text-white transition-colors group">
                             <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                <i className="fab fa-whatsapp text-lg"></i>
                            </span>
                            Написать в WhatsApp
                        </a>
                         <a href={EXTERNAL_SITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 text-lg text-slate-300 hover:text-white transition-colors group">
                             <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                                <i className="fas fa-globe text-sm"></i>
                            </span>
                            alp-pro.clients.site
                        </a>
                        <div className="flex items-center gap-4 text-slate-300">
                             <span className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                <i className="fas fa-map-marker-alt text-sm"></i>
                            </span>
                             г. Сочи, ул. Транспортная
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="text-2xl font-bold mb-8 text-white">Зона обслуживания</h4>
                    <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                        Бесплатная доставка климатической техники осуществляется на участке:
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg text-sm font-bold">Адлер</span>
                        <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold">Кудепста</span>
                        <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold">Хоста</span>
                        <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold">Мацеста</span>
                        <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold">Центр Сочи</span>
                        <span className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg text-sm font-bold">Дагомыс</span>
                    </div>
                </div>
            </div>
            <div className="text-center mt-10 text-slate-600 text-sm font-medium">
                <p>© 2024 Каталог Кондиционеров Сочи. Все права защищены.</p>
            </div>
        </div>
    </footer>
    </div>
  );
};

export default App;