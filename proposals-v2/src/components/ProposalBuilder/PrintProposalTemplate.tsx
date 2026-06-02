import { SELLERS } from '../../config';
import type { Proposal, SellerId, Currency } from '../../types';

interface PrintProposalTemplateProps {
  proposal: Proposal;
  selectedSeller: SellerId;
  activeCurrency: Currency;
  convert: any;
  saleSubtotal: number;
  vatAmount: number;
  total: number;
}

export function PrintProposalTemplate(props: PrintProposalTemplateProps) {
  const {
    proposal,
    selectedSeller,
    activeCurrency,
    convert,
  } = props;
  const seller = SELLERS[selectedSeller];
  const dateStr = proposal.date ? new Date(proposal.date).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA');
  
  // Обчислюємо точні округлені суми для кожного рядка, щоб уникнути розбіжностей в 0.01 коп
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
    <div id="print-proposal-template" className="print-only-block hidden print:block w-full max-w-[210mm] mx-auto text-slate-900 p-8 font-sans leading-relaxed" style={{ backgroundColor: '#ffffff' }}>
      
      {/* 1. ШАПКА */}
      <div className="grid grid-cols-[140px_1fr_325px] gap-6 items-center border-b-2 border-amber-500 pb-5 mb-6">
        {/* Column 1: Logo */}
        <div className="flex items-center">
          <img src={seller.logo} alt="CSO Solar Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Column 2: Centered Title */}
        <div className="text-center flex flex-col justify-center gap-0.5">
          <h1 className="text-base font-black text-slate-900 tracking-wider uppercase leading-snug whitespace-nowrap">
            КОМЕРЦІЙНА ПРОПОЗИЦІЯ
          </h1>
          <div className="text-sm font-bold text-amber-600">
            № {proposal.number || 'КП-Нова'}
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            від {dateStr}
          </div>
        </div>

        {/* Column 3: Seller details card block */}
        <div className="flex justify-end">
          <div className="border border-[#e8e4d1] rounded-xl p-3 bg-slate-50/30 w-full max-w-[325px] text-[10px] text-slate-700">
            {/* Seller Title */}
            <div className="border-b border-[#e8e4d1]/80 pb-1.5 mb-2 text-right">
              <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[11px] block leading-snug">
                {seller.id === 'tov_cso' ? 'ТОВ "Центр сервісного обслуговування"' : seller.fullName}
              </span>
            </div>

            {/* Seller Info Rows */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-medium">{seller.taxIdType || 'ЄДРПОУ/РНОКПП'}:</span>
                <span className="font-bold text-slate-800 text-right select-all">{seller.taxId}</span>
              </div>
              {seller.iban && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 font-medium">IBAN:</span>
                  <span className="font-bold text-slate-800 text-right select-all whitespace-nowrap">{seller.iban}</span>
                </div>
              )}
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 font-medium">Телефон:</span>
                <span className="font-bold text-slate-800 text-right whitespace-pre-line leading-tight">{seller.phone}</span>
              </div>
              <div className="flex justify-between items-start gap-2 pt-0.5">
                <span className="text-slate-400 font-medium shrink-0">Адреса:</span>
                <span className="font-bold text-slate-800 text-right leading-tight whitespace-normal break-words max-w-[245px]">{seller.office || seller.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER SECTION */}
      <div className="mb-6 text-xs">
        <div className="py-2 px-1">
          <div className="border-b border-[#e8e4d1]/80 pb-1.5 mb-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">ЗАМОВНИК</span>
          </div>
          <div className="space-y-2 text-slate-700 font-medium">
            <div className="font-extrabold text-slate-900 text-sm tracking-tight">
              {proposal.clientName || 'Шановний Клієнт'}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]">
              {proposal.clientPhone && (
                <div className="flex items-center"><span className="text-slate-400 font-medium mr-1.5">Телефон:</span> <span className="text-slate-800 font-bold">{proposal.clientPhone}</span></div>
              )}
              {proposal.clientAddress && (
                <div className="flex items-center"><span className="text-slate-400 font-medium mr-1.5">Адреса:</span> <span className="text-slate-800 font-semibold">{proposal.clientAddress}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. ТАБЛИЦЯ ОБЛАДНАННЯ ТА РОБІТ */}
      <div className="mb-6">
        <table className="proposal-print-table w-full text-left border-collapse border border-[#e8e4d1] text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider border-b border-[#e8e4d1]">
              <th className="border border-[#e8e4d1] p-2.5 text-center w-8">#</th>
              <th className="border border-[#e8e4d1] p-2.5">Найменування обладнання та послуг</th>
              <th className="border border-[#e8e4d1] p-2.5 text-center w-12">Од.</th>
              <th className="border border-[#e8e4d1] p-2.5 text-center w-20">Кількість</th>
              <th className="border border-[#e8e4d1] p-2.5 text-center w-24">Ціна, {currencySymbol}</th>
              <th className="border border-[#e8e4d1] p-2.5 text-center w-28">Сума, {currencySymbol}</th>
            </tr>
          </thead>
          <tbody>
            {convertedItems.map((item, index) => {
              const displayPrice = item.displayPrice;
              const displaySum = item.displaySum;

              return (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-400">
                    {index + 1}
                  </td>
                  <td className="border border-[#e8e4d1]/80 p-2.5">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    {item.description && (
                      <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 whitespace-pre-wrap">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-500">
                    {item.unit || 'шт'}
                  </td>
                  <td className="border border-[#e8e4d1]/80 p-2.5 text-center font-medium text-slate-800">
                    {item.quantity || 0}
                  </td>
                  <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-600">
                    {displayPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-slate-800">
                    {displaySum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. ФІНАНСОВИЙ ПІДСУМОК */}
      <div className="flex justify-between items-start gap-8 mb-8 text-xs">
        {/* Примітки */}
        <div className="flex-1 border border-[#e8e4d1]/80 rounded-xl p-4 bg-slate-50/25">
          <span className="text-[10px] uppercase font-bold text-[#a89a74] tracking-wider">Примітки та умови:</span>
          <div className="text-xs text-slate-600 leading-normal mt-1.5 whitespace-pre-wrap font-medium">
            {proposal.notes || "1. Гарантія на сонячні панелі — 12 років.\n2. Гарантія на інвертор — 5 років.\n3. Гарантія на акумуляторну батарею — 5 років."}
          </div>
          <div className="text-[9px] text-[#a89a74] font-medium mt-3 pt-2 border-t border-[#e8e4d1]/60 font-mono">
            Курс розрахунку: 1$ = {proposal.rates?.usdToUah || 41.5} грн &nbsp;|&nbsp; 1€ = {proposal.rates?.eurToUah || 51.0} грн
          </div>
        </div>

        {/* Розрахунки суми */}
        <div className="w-80 border border-[#e8e4d1] rounded-xl overflow-hidden shadow-sm bg-white">
          {proposal.vatMode && proposal.vatMode !== 'none' && (
            <div className="p-3 bg-slate-50/50 border-b border-[#e8e4d1]/65 space-y-1.5 text-slate-500 text-xs font-semibold">
              <div className="flex justify-between">
                <span>Сума без ПДВ:</span>
                <span className="whitespace-nowrap">{displaySubtotal.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>ПДВ (20%):</span>
                <span className="whitespace-nowrap">{displayVat.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
              </div>
            </div>
          )}
          
          {/* Головний підсумок */}
          <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shadow-inner">
            <span className="font-bold text-xs uppercase tracking-wider">Разом:</span>
            <span className="font-black text-sm whitespace-nowrap">
              {displayTotal.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
