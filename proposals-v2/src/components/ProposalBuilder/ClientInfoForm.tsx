import { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, UserCheck } from 'lucide-react';
import { SELLERS } from '../../config';
import { useProposalStore } from '../../store';
import type { SellerId } from '../../types/index';

interface ClientInfoFormProps {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  selectedSeller: SellerId;
  onUpdateField: (field: string, value: string) => void;
  onSetSeller: (seller: SellerId) => void;
  proposalNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  hasUnsavedChanges: boolean;
}

export function ClientInfoForm({
  clientName,
  clientPhone,
  clientAddress,
  selectedSeller,
  onUpdateField,
  onSetSeller,
  proposalNumber,
  status,
  hasUnsavedChanges,
}: ClientInfoFormProps) {
  const { regularClients, clientPricesMap, loadClientPrices } = useProposalStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggRef = useRef<HTMLDivElement>(null);

  // Фільтруємо підказки по введеному тексту (показуємо лише коли введено 2+ символи)
  const suggestions = clientName.trim().length >= 2
    ? regularClients.filter((c) =>
        c.name.toLowerCase().includes(clientName.trim().toLowerCase())
      )
    : [];

  // Знайдений клієнт (точний збіг)
  const matchedClient = regularClients.find(
    (c) => c.name.trim().toLowerCase() === clientName.trim().toLowerCase()
  );
  const matchedPrices = matchedClient ? (clientPricesMap[matchedClient.id] || []) : [];

  // Завантажуємо ціни при точному збігу
  useEffect(() => {
    if (matchedClient && !clientPricesMap[matchedClient.id]) {
      loadClientPrices(matchedClient.id);
    }
  }, [matchedClient?.id]);

  // Закриття підказок при кліку поза
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !suggRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectClient = (client: typeof regularClients[0]) => {
    onUpdateField('clientName', client.name);
    if (client.phone) onUpdateField('clientPhone', client.phone);
    setShowSuggestions(false);
    // Завантажуємо ціни якщо ще немає
    if (!clientPricesMap[client.id]) {
      loadClientPrices(client.id);
    }
  };

  return (
    <div className="bg-[#fbfaf5]/90 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-[#e8e4d1]/75 dark:border-slate-800/50 p-4 client-info-block transition-all duration-300 shadow-[0_8px_30px_rgba(245,158,11,0.02)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.04)] no-print relative z-30">
      {/* Title block with status indicator */}
      <div className="flex items-center justify-between border-b border-[#e8e4d1]/40 dark:border-slate-800/30 pb-2 mb-3 select-none">
        <h3 className="font-extrabold text-[#a89a74] dark:text-slate-400 text-[10px] uppercase tracking-widest font-mono flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Параметри комерційної пропозиції
        </h3>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {status !== 'draft' ? (
            hasUnsavedChanges ? (
              <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                {proposalNumber} • ЗМІНЕНО (НЕ ЗБЕРЕЖЕНО)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                {proposalNumber} • {status === 'accepted' ? 'ПРИЙНЯТО' : status === 'rejected' ? 'ВІДХИЛЕНО' : 'ЗБЕРЕЖЕНО'}
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
              ЧЕРНЕТКА (НЕ ЗБЕРЕЖЕНО)
            </div>
          )}
        </div>
      </div>
      
      {/* Split Grid - Optimized to 5-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
        
        {/* Ліве крило: Дані Замовника (col-span-3) */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between mb-1 select-none">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
              Дані Замовника
            </span>
            {matchedClient && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                <span>⭐</span>
                <span>Постійний клієнт{matchedPrices.length > 0 && ` · ${matchedPrices.length} цін`}</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Ім'я клієнта з автодоповненням */}
            <div className="relative z-40">
              <div className="relative flex items-center group border-b border-[#e8e4d1] dark:border-slate-800/80 focus-within:border-amber-500 transition-colors pb-0.5">
                <div className="text-[#a89a74] dark:text-slate-500 group-focus-within:text-amber-500 transition-colors mr-2">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ПІБ Клієнта"
                  value={clientName}
                  onChange={(e) => {
                    onUpdateField('clientName', e.target.value);
                    setShowSuggestions(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => {
                    if (clientName.trim().length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full py-1.5 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-450 placeholder:font-medium dark:placeholder:text-slate-600 transition-all"
                />
              </div>

              {/* Dropdown підказки */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggRef}
                  className="absolute top-full left-0 mt-1 z-[100] min-w-[280px] sm:min-w-[320px] max-w-[380px] bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800"
                >
                  {suggestions.map((client) => {
                    const priceCount = (clientPricesMap[client.id] || []).length;
                    return (
                      <button
                        key={client.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-white">{client.name}</div>
                          {client.phone && (
                            <div className="text-[10px] text-gray-400">{client.phone}</div>
                          )}
                        </div>
                        {priceCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            {priceCount} цін
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
