import React, { useState } from 'react';
import { Product } from '../types';
import { WHATSAPP_PHONE } from '../constants';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getSavingPercent = (segment: string, price: number) => {
    const marketAvg: Record<string, number> = { 'Budget': 28000, 'Basic': 48000, 'Middle': 75000, 'Premium': 180000 };
    const avg = marketAvg[segment] || price * 1.2;
    return Math.max(5, Math.round((avg - price) / avg * 100));
  };

  const savings = getSavingPercent(product.segment, product.retail);
  
  const waText = `Здравствуйте! Меня интересует кондиционер ${product.brand} ${product.model} за ${product.retail.toLocaleString()} ₽. Расскажите подробнее о наличии и установке в Сочи (Бесплатная доставка Адлер-Дагомыс).`;
  const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waText)}`;

  const segmentColors: Record<string, string> = {
    Budget: 'bg-emerald-500',
    Basic: 'bg-amber-500',
    Middle: 'bg-orange-500',
    Premium: 'bg-rose-500'
  };

  // Формируем поисковый запрос для поиска реального фото модели
  const query = `${product.brand} ${product.model} сплит-система фото`;
  // Добавляем timestamp чтобы избежать кэширования битых ссылок, если такие были
  const mainImageUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=800&h=600&c=7&rs=1&p=0&dpr=2&pid=1.7`;
  
  // Запасной вариант
  const fallbackImageUrl = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(product.brand + ' air conditioner')}&w=800&h=600&c=7&rs=1&p=0&dpr=2&pid=1.7`;

  return (
    <div className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 hover:-translate-y-1 h-full relative">
      {/* Segment Line */}
      <div className={`${segmentColors[product.segment] || 'bg-gray-500'} h-1.5 w-full`} />
      
      {/* Image Area */}
      <div className="relative h-64 w-full bg-white p-4 overflow-hidden border-b border-gray-50 flex items-center justify-center min-h-[250px]">
        {/* Loading Spinner for Image */}
        {!imageLoaded && !imageError && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
             </div>
        )}

        <img 
          src={imageError ? fallbackImageUrl : mainImageUrl}
          alt={`${product.brand} ${product.model}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-500 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${product.type === 'INVERTER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                {product.type}
            </span>
             {product.segment === 'Premium' && (
                <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                    -10% на монтаж
                </span>
             )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{product.brand}</h3>
          <p className="text-sm font-bold text-slate-500 mt-1">{product.model}</p>
        </div>
        
        <div className="mb-5 flex-grow">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-bold mb-3">
            <i className="fas fa-snowflake text-blue-400"></i>
            <span>{product.btu} BTU</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs font-medium text-slate-500 italic leading-relaxed border border-slate-100">
            "{product.benefit}"
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-slate-50 mt-auto">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Цена в Сочи</span>
              <div className="text-2xl font-black text-slate-900 leading-none mt-1">
                {product.retail.toLocaleString()} <span className="text-sm">₽</span>
              </div>
            </div>
            <div className="bg-green-100 text-green-700 text-[11px] font-black px-2 py-1 rounded-lg">
              -{savings}% ВЫГОДА
            </div>
          </div>
          
          <a 
            href={waUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-green-200 hover:shadow-green-300 transition-all active:scale-95"
          >
            <i className="fab fa-whatsapp text-xl"></i>
            ЗАКАЗАТЬ
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;