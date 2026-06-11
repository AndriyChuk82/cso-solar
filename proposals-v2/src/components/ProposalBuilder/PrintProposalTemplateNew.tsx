import { User, Phone, Mail, MapPin, Building, Calendar, FileText, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { SELLERS } from '../../config';
import type { Proposal, SellerId, Currency } from '../../types';

interface PrintProposalTemplateNewProps {
  proposal: Proposal;
  selectedSeller: SellerId;
  activeCurrency: Currency;
  convert: any;
  saleSubtotal: number;
  vatAmount: number;
  total: number;
}

export function PrintProposalTemplateNew(props: PrintProposalTemplateNewProps) {
  const {
    proposal,
    selectedSeller,
    activeCurrency,
    convert,
  } = props;
  const seller = SELLERS[selectedSeller];
  const dateStr = proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  
  // Calculate exact row numbers and sums
  const convertedItems = proposal.items.map(item => {
    const displayPrice = Math.round(convert(item.price, 'USD', activeCurrency) * 100) / 100;
    const displaySum = Math.round(displayPrice * (item.quantity || 0) * 100) / 100;
    return { ...item, displayPrice, displaySum };
  });

  const displaySubtotal = convertedItems.reduce((sum, item) => sum + item.displaySum, 0);

  let displayVat = 0;
  let displayTotal = displaySubtotal;

  if (proposal.vatMode === 'add') {
    displayVat = Math.round(displaySubtotal * 0.2 * 100) / 100;
    displayTotal = displaySubtotal + displayVat;
  } else if (proposal.vatMode === 'extract') {
    displayVat = Math.round((displaySubtotal - (displaySubtotal / 1.2)) * 100) / 100;
    displayTotal = displaySubtotal;
  }

  const currencySymbol = activeCurrency === 'UAH' ? 'грн' : (activeCurrency === 'EUR' ? 'EUR' : 'USD');

  return (
    <div id="print-proposal-template-new" className="print-only-block hidden print:block w-full max-w-[210mm] mx-auto text-slate-800 p-10 font-sans leading-normal relative overflow-hidden shadow-2xl rounded-3xl border border-[#e8e4d1]/30" style={{ backgroundColor: '#ffffff' }}>
      
      {/* Decorative top sand accent strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"></div>
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#e8e4d1]/80 pb-6 mb-6 mt-2">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-50/50 rounded-2xl border border-[#e8e4d1]/70 shadow-sm flex items-center justify-center">
            <img src={seller.logo} alt="CSO Solar Logo" className="h-16 w-auto object-contain max-w-[140px]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
              CSO Solar
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-[10px] text-[#a89a74] uppercase tracking-widest font-bold font-mono">
              ЕНЕРГІЯ ВАШОЇ НЕЗАЛЕЖНОСТІ
            </p>
          </div>
        </div>
        
        {/* Right stacked container */}
        <div className="flex flex-col gap-3 items-end min-w-[280px] w-full sm:w-auto">
          {/* Document meta card */}
          <div className="w-full bg-slate-50/70 border border-[#e8e4d1]/80 rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8"></div>
            <div className="text-[9px] font-black text-[#a89a74] uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              ОФІЦІЙНИЙ ДОКУМЕНТ
            </div>
            <h2 className="text-xs font-black text-slate-800 tracking-tight">
              КОМЕРЦІЙНА ПРОПОЗИЦІЯ
            </h2>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#e8e4d1]/50 text-[10px]">
              <div>
                <span className="text-[8px] text-[#a89a74] uppercase font-bold tracking-wider block">Номер</span>
                <span className="font-black text-amber-600">№ {proposal.number || 'КП-Нова'}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] text-[#a89a74] uppercase font-bold tracking-wider block">Дата</span>
                <span className="font-bold text-slate-800">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Compact Contractor details */}
          <div className="w-full text-right text-[10px] text-slate-600 space-y-0.5 bg-slate-50/20 border border-[#e8e4d1]/40 rounded-xl p-2.5 px-3.5 shadow-sm">
            <div className="font-bold text-slate-800 text-[10px] flex items-center justify-end gap-1.5 mb-1 pb-1 border-b border-[#e8e4d1]/30">
              <Building className="w-3 h-3 text-[#a89a74]" />
              ВИКОНАВЕЦЬ: {seller.id === 'tov_cso' ? 'ТОВ "ЦСО"' : seller.shortName}
            </div>
            <div><span className="text-slate-400">ЄДРПОУ/РНОКПП:</span> <span className="font-bold text-slate-800">{seller.taxId}</span></div>
            {seller.iban && (
              <div className="font-mono text-[9px]"><span className="text-slate-400 font-sans">IBAN:</span> <span className="font-bold text-slate-800">{seller.iban}</span></div>
            )}
            <div><span className="text-slate-400">Телефон:</span> <span className="font-bold text-slate-850">{seller.phone}</span></div>
            <div className="text-[9px] leading-tight mt-0.5"><span className="text-slate-400">Адреса:</span> <span className="font-medium text-slate-800">{seller.office || seller.address}</span></div>
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER SECTION */}
      <div className="mb-6 text-xs">
        <div className="border border-[#e8e4d1]/80 rounded-2xl p-4 bg-slate-50/20 shadow-sm">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e8e4d1]/50">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] uppercase font-black text-[#a89a74] tracking-widest font-mono">ЗАМОВНИК</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="font-extrabold text-slate-850 text-sm">
              {proposal.clientName || 'Шановний Клієнт'}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-700 font-medium">
              {proposal.clientPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#a89a74] shrink-0" />
                  <span>{proposal.clientPhone}</span>
                </div>
              )}
              {proposal.clientEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#a89a74] shrink-0" />
                  <span>{proposal.clientEmail}</span>
                </div>
              )}
              {proposal.clientAddress && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#a89a74] shrink-0" />
                  <span>{proposal.clientAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODERN ITEMS GRID TABLE */}
      <div className="mb-8 rounded-2xl border border-[#e8e4d1] overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[10px] uppercase font-black tracking-wider border-b border-[#e8e4d1]">
              <th className="p-3 text-center w-10">#</th>
              <th className="p-3">Найменування обладнання та послуг</th>
              <th className="p-3 text-center w-14">Од.</th>
              <th className="p-3 text-center w-20">Кількість</th>
              <th className="p-3 text-center w-28">Ціна, {currencySymbol}</th>
              <th className="p-3 text-center w-32 bg-slate-100/60 font-black text-slate-800 border-l border-[#e8e4d1]/50">Сума, {currencySymbol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e4d1]/40">
            {convertedItems.map((item, index) => {
              const displayPrice = item.displayPrice;
              const displaySum = item.displaySum;

              return (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-3 text-center text-[#a89a74] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800 text-sm leading-snug">{item.name}</div>
                    {item.description && (
                      <div className="text-[10px] text-[#a89a74] font-normal leading-tight mt-1 whitespace-pre-wrap italic">
                        {item.description.replace(/\(вхідна ціна постачальника: [^\)]+\)/g, '').trim()}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-500 font-medium">
                    {item.unit || 'шт'}
                  </td>
                  <td className="p-3 text-center font-extrabold text-slate-850">
                    {item.quantity || 0}
                  </td>
                  <td className="p-3 text-center text-slate-600 font-semibold font-mono">
                    {displayPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center font-black text-slate-800 bg-slate-50/40 border-l border-[#e8e4d1]/30 font-mono text-sm">
                    {displaySum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. FINANCIAL SUMMARY & CONVERSIONS */}
      <div className="flex flex-col md:flex-row justify-between items-stretch gap-6 mb-6 text-xs">
        {/* Notes, Guarantees Card */}
        <div className="flex-1 border border-[#e8e4d1] rounded-2xl p-5 bg-slate-50/20 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[10px] uppercase font-black text-[#a89a74] tracking-widest font-mono">Примітки та умови:</span>
            </div>
            <div className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap font-semibold italic">
              {proposal.notes || "1. Гарантія на сонячні панелі — 12 років.\n2. Гарантія на інвертор — 5 років.\n3. Гарантія на акумуляторну батарею — 5 років."}
            </div>
          </div>
          <div className="text-[9px] text-[#a89a74] font-bold mt-4 pt-3 border-t border-[#e8e4d1]/65 flex items-center gap-2 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            Курс: 1$ = {proposal.rates?.usdToUah || 41.5} грн &nbsp;|&nbsp; 1€ = {proposal.rates?.eurToUah || 51.0} грн
          </div>
        </div>

        {/* Grand Total stacked box */}
        <div className="w-full md:w-80 border border-[#e8e4d1] rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col justify-between">
          
          {/* VAT items panel */}
          {proposal.vatMode && proposal.vatMode !== 'none' ? (
            <div className="p-4 bg-slate-50/30 border-b border-[#e8e4d1]/50 space-y-2 text-slate-500 text-xs font-bold">
              <div className="flex justify-between items-center">
                <span>Сума без ПДВ:</span>
                <span className="font-mono text-slate-700">{displaySubtotal.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="italic">{proposal.vatMode === 'add' ? 'ПДВ (+20%):' : 'в т.ч. ПДВ (20%):'}</span>
                <span className="font-mono text-slate-700">{displayVat.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50/20 border-b border-[#e8e4d1]/30 text-[#a89a74] text-[10px] font-black uppercase tracking-wider text-center">
              Розрахунок без податку (ПДВ 0%)
            </div>
          )}
          
          {/* GRAND TOTAL STYLISH BLOCK */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-550 to-orange-500 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
            {/* Elegant glowing sphere inside gradient */}
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mb-6 pointer-events-none"></div>
            
            <div className="z-10">
              <span className="font-black text-[10px] uppercase tracking-widest block opacity-90 font-mono">РАЗОМ ДО СПЛАТИ</span>
              <span className="text-[9px] opacity-75 font-semibold">
                {proposal.vatMode === 'none' ? 'Сума без ПДВ' : 'Сума з урахуванням ПДВ 20%'}
              </span>
            </div>
            <div className="text-right z-10">
              <span className="font-black text-lg whitespace-nowrap tracking-tight">
                {displayTotal.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
