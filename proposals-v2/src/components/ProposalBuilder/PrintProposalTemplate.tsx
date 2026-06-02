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
    <div id="print-proposal-template" className="print-only-block hidden print:block w-full max-w-[210mm] mx-auto bg-white text-slate-900 p-8 font-sans leading-relaxed">
      
      {/* 1. ШАПКА */}
      <div className="flex justify-between items-center border-b-2 border-amber-500 pb-5 mb-6">
        <div>
          <img src={seller.logo} alt="CSO Solar Logo" className="h-20 w-auto object-contain" />
        </div>
        <div className="text-right">
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2">
            <h2 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">
              КОМЕРЦІЙНА ПРОПОЗИЦІЯ
            </h2>
            <div className="text-xs font-bold text-amber-600 mt-0.5">
              № {proposal.number || 'КП-Нова'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              від {dateStr}
            </div>
          </div>
        </div>
      </div>

      {/* 3. КЛІЄНТ ТА ВИКОНАВЕЦЬ */}
      <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
        {/* Замовник */}
        <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/30">
          <div className="border-b border-slate-200 pb-1.5 mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Замовник (Клієнт)</span>
          </div>
          <div className="space-y-1 text-slate-700">
            <div className="font-semibold text-slate-800 text-sm mb-1">
              {proposal.clientName || 'Шановний Клієнт'}
            </div>
            {proposal.clientPhone && (
              <div><span className="text-slate-400">Телефон:</span> <span className="font-medium text-slate-800">{proposal.clientPhone}</span></div>
            )}
            {proposal.clientEmail && (
              <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-800">{proposal.clientEmail}</span></div>
            )}
            {proposal.clientAddress && (
              <div><span className="text-slate-400">Адреса об'єкта:</span> <span className="font-medium text-slate-800">{proposal.clientAddress}</span></div>
            )}
          </div>
        </div>

        {/* Виконавець */}
        <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/30">
          <div className="border-b border-slate-200 pb-1.5 mb-2">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Виконавець (Продавець)</span>
          </div>
          <div className="space-y-1 text-xs text-slate-700">
            <div className="font-semibold text-slate-800 text-xs mb-1">
              {seller.id === 'tov_cso' ? 'ТОВ "Центр сервісного обслуговування"' : seller.fullName}
            </div>
            <div><span className="text-slate-400">ЄДРПОУ/РНОКПП:</span> <span className="font-medium text-slate-800">{seller.taxId}</span></div>
            {seller.iban && (
              <div><span className="text-slate-400">IBAN:</span> <span className="font-medium text-slate-800">{seller.iban}</span></div>
            )}
            <div><span className="text-slate-400">Телефон:</span> <span className="font-medium text-slate-800">{seller.phone}</span></div>
            <div><span className="text-slate-400">Офіс:</span> <span className="font-medium text-slate-800">{seller.office || seller.address}</span></div>
          </div>
        </div>
      </div>

      {/* 4. ТАБЛИЦЯ ОБЛАДНАННЯ ТА РОБІТ */}
      <div className="mb-6">
        <table className="proposal-print-table w-full text-left border-collapse border border-slate-200 text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
              <th className="border border-slate-200 p-2.5 text-center w-8">#</th>
              <th className="border border-slate-200 p-2.5">Найменування обладнання та послуг</th>
              <th className="border border-slate-200 p-2.5 text-center w-12">Од.</th>
              <th className="border border-slate-200 p-2.5 text-center w-20">Кількість</th>
              <th className="border border-slate-200 p-2.5 text-center w-24">Ціна, {currencySymbol}</th>
              <th className="border border-slate-200 p-2.5 text-center w-28">Сума, {currencySymbol}</th>
            </tr>
          </thead>
          <tbody>
            {convertedItems.map((item, index) => {
              const displayPrice = item.displayPrice;
              const displaySum = item.displaySum;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="border border-slate-200 p-2.5 text-center text-slate-400">
                    {index + 1}
                  </td>
                  <td className="border border-slate-200 p-2.5">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    {item.description && (
                      <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 whitespace-pre-wrap">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center text-slate-500">
                    {item.unit || 'шт'}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center font-medium text-slate-800">
                    {item.quantity || 0}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center text-slate-600">
                    {displayPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-center font-bold text-slate-800">
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
        <div className="flex-1 border border-slate-200/60 rounded-xl p-4 bg-slate-50/20">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Примітки та умови:</span>
          <div className="text-xs text-slate-600 leading-normal mt-1.5 whitespace-pre-wrap font-medium">
            {proposal.notes || "1. Гарантія на сонячні панелі — 12 років.\n2. Гарантія на інвертор — 5 років."}
          </div>
          <div className="text-[9px] text-slate-400 font-medium mt-3 pt-2 border-t border-slate-200/60 font-mono">
            Курс розрахунку: 1$ = {proposal.rates?.usdToUah || 41.5} грн &nbsp;|&nbsp; 1€ = {proposal.rates?.eurToUah || 51.0} грн
          </div>
        </div>

        {/* Розрахунки суми */}
        <div className="w-80 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
          {proposal.vatMode && proposal.vatMode !== 'none' && (
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-1.5 text-slate-500 text-xs font-semibold">
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
          <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
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
