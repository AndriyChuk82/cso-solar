import { User, Phone, MapPin, Building, UserCheck } from 'lucide-react';
import { SELLERS } from '../../config';
import type { SellerId } from '../../types/index';

interface ClientInfoFormProps {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  selectedSeller: SellerId;
  onUpdateField: (field: string, value: string) => void;
  onSetSeller: (seller: SellerId) => void;
}

export function ClientInfoForm({
  clientName,
  clientPhone,
  clientAddress,
  selectedSeller,
  onUpdateField,
  onSetSeller,
}: ClientInfoFormProps) {
  return (
    <div className="bg-[#fbfaf5]/90 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-[#e8e4d1]/75 dark:border-slate-800/50 p-4 client-info-block transition-all duration-300 shadow-[0_8px_30px_rgba(245,158,11,0.02)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.04)] no-print">
      {/* Title block */}
      <h3 className="font-extrabold text-[#a89a74] dark:text-slate-400 mb-3 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2 select-none border-b border-[#e8e4d1]/40 dark:border-slate-800/30 pb-1.5">
        <UserCheck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        Параметри комерційної пропозиції
      </h3>
      
      {/* Split Grid - Optimized to 5-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
        
        {/* Ліве крило: Дані Замовника (col-span-3) */}
        <div className="lg:col-span-3 space-y-2.5">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 select-none font-mono">
            Дані Замовника
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Ім'я клієнта */}
            <div className="relative flex items-center group border-b border-[#e8e4d1] dark:border-slate-800/80 focus-within:border-amber-500 transition-colors pb-0.5">
              <div className="text-[#a89a74] dark:text-slate-500 group-focus-within:text-amber-500 transition-colors mr-2">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="ПІБ Клієнта"
                value={clientName}
                onChange={(e) => onUpdateField('clientName', e.target.value)}
                className="w-full py-1.5 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-450 placeholder:font-medium dark:placeholder:text-slate-600 transition-all"
              />
            </div>

            {/* Телефон */}
            <div className="relative flex items-center group border-b border-[#e8e4d1] dark:border-slate-800/80 focus-within:border-amber-500 transition-colors pb-0.5">
              <div className="text-[#a89a74] dark:text-slate-500 group-focus-within:text-amber-500 transition-colors mr-2">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="tel"
                placeholder="Контактний телефон"
                value={clientPhone || ''}
                onChange={(e) => onUpdateField('clientPhone', e.target.value)}
                className="w-full py-1.5 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-455 placeholder:font-medium dark:placeholder:text-slate-600 transition-all"
              />
            </div>

            {/* Адреса */}
            <div className="relative flex items-center group border-b border-[#e8e4d1] dark:border-slate-800/80 focus-within:border-amber-500 transition-colors pb-0.5">
              <div className="text-[#a89a74] dark:text-slate-500 group-focus-within:text-amber-500 transition-colors mr-2">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Адреса об'єкта"
                value={clientAddress || ''}
                onChange={(e) => onUpdateField('clientAddress', e.target.value)}
                className="w-full py-1.5 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-455 placeholder:font-medium dark:placeholder:text-slate-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Праве крило: Інтерактивні картки Виконавця (col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 select-none font-mono">
            Вибір Виконавця
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
            {Object.entries(SELLERS).map(([id, seller]) => {
              const isActive = selectedSeller === id;
              return (
                <div
                  key={id}
                  onClick={() => onSetSeller(id as SellerId)}
                  className={`cursor-pointer p-2 rounded-xl border-2 transition-all duration-300 relative flex flex-col justify-center overflow-hidden select-none active:scale-[0.98] ${
                    isActive
                      ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.02] shadow-[0_2px_8px_rgba(245,158,11,0.04)]'
                      : 'border-slate-200/60 hover:border-[#e8e4d1] hover:bg-[#faf9f3] bg-white/40 dark:border-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center rounded-bl-lg shadow-sm z-10">
                      <span className="text-[9px] font-black">✓</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {/* Logo container */}
                    <div className="p-1 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0 flex items-center justify-center">
                      <img src={seller.logo} alt={seller.shortName} className="h-4.5 w-auto object-contain max-w-[45px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-800 dark:text-slate-250 text-[10px] tracking-tight truncate leading-tight">
                        {id === 'tov_cso' ? 'ТОВ "ЦСО"' : seller.shortName}
                      </div>
                      <div className="text-[8px] text-slate-450 dark:text-slate-500 leading-tight">
                        {seller.taxIdType}: <span className="font-bold text-slate-600 dark:text-slate-400">{seller.taxId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
