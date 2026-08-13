import { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { getShipmentById } from '../api/gasApi';

export default function ShipmentPrintModal({ shipments = [], onClose }) {
  const [printList, setPrintList] = useState(shipments);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchMissingItems() {
      setLoading(true);
      try {
        const enriched = await Promise.all(
          shipments.map(async (s) => {
            if (s.shipment_items && s.shipment_items.length > 0) {
              return s;
            }
            try {
              const res = await getShipmentById(s.id);
              if (res.success && res.items) {
                return { ...s, shipment_items: res.items };
              }
            } catch (err) {
              console.warn("Failed to load details for print shipment:", s.id, err);
            }
            return s;
          })
        );
        setPrintList(enriched);
      } finally {
        setLoading(false);
      }
    }
    fetchMissingItems();
  }, [shipments]);

  function handlePrint() {
    window.print();
  }

  const paymentMethodLabels = {
    cod: 'Оплата при отриманні',
    kit_group: 'КИТ Group',
    cash: '💵 Готівка'
  };

  const todayStr = new Date().toLocaleDateString('uk-UA');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 flex flex-col max-h-[90vh]">
        {/* Modal Header (Hidden on print) */}
        <div className="p-4 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-lg">
            <Printer size={22} className="text-primary" />
            Реєстр відправлень для друку ({shipments.length})
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer size={18} />
              Радрукувати список
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 rounded-lg text-xl font-bold"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-black font-sans print:p-0 print:overflow-visible">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .printable-area, .printable-area * { visibility: visible; }
              .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="printable-area space-y-6">
            {/* Header Document Banner */}
            <div className="border-b-2 border-black pb-4 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-black">
                  Реєстр Відправлень Товарів
                </h1>
                <div className="text-sm font-medium text-gray-600">
                  ТОВ «CSO Solar» — Складський облік
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-semibold">Дата формування</div>
                <div className="text-base font-bold">{todayStr}</div>
                <div className="text-xs text-gray-600 font-semibold">Всього відправок: {shipments.length}</div>
              </div>
            </div>

            {/* List Table */}
            <table className="w-full text-left text-xs border-collapse border border-gray-400 table-fixed">
              <thead>
                <tr className="bg-gray-100 text-black uppercase font-bold border-b border-gray-400">
                  <th className="p-2 border-r border-gray-400 w-[4%] text-center">№</th>
                  <th className="p-2 border-r border-gray-400 w-[17%]">Отримувач (Кому / Тел)</th>
                  <th className="p-2 border-r border-gray-400 w-[15%]">Адреса доставки (Куди)</th>
                  <th className="p-2 border-r border-gray-400 w-[32%]">Товари & Кількість</th>
                  <th className="p-2 border-r border-gray-400 w-[16%] text-right">Сума / Оплата</th>
                  <th className="p-2 w-[16%]">ТТН & Відправник</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {printList.map((ship, idx) => (
                  <tr key={ship.id || idx} className="align-top">
                    {/* № */}
                    <td className="p-2 border-r border-gray-400 font-bold text-center">
                      {idx + 1}
                    </td>

                    {/* Customer */}
                    <td className="p-2 border-r border-gray-400">
                      <div className="font-bold text-sm text-black break-words">{ship.client_name}</div>
                      {ship.client_phone && (
                        <div className="text-xs font-semibold text-gray-800">
                          📞 {ship.client_phone}
                        </div>
                      )}
                    </td>

                    {/* Address */}
                    <td className="p-2 border-r border-gray-400 font-medium break-words">
                      {ship.shipping_address || '—'}
                    </td>

                    {/* Goods */}
                    <td className="p-2 border-r border-gray-400">
                      {ship.shipment_items && ship.shipment_items.length > 0 ? (
                        <ul className="space-y-1.5">
                          {ship.shipment_items.map((item, itemIdx) => (
                            <li key={item.id || itemIdx} className="border-b border-gray-200 last:border-0 pb-1">
                              <div className="font-bold text-xs text-black leading-snug break-words hyphens-none">
                                {item.product_name || item.product_id}
                              </div>
                              <div className="text-[11px] text-gray-700 font-semibold mt-0.5 whitespace-nowrap">
                                Кількість: <strong className="text-black font-extrabold">{item.quantity} шт</strong>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500 italic">Специфікація товарів</span>
                      )}
                    </td>

                    {/* Financials */}
                    <td className="p-2 border-r border-gray-400 text-right">
                      <div className="font-extrabold text-sm text-black">
                        {ship.total_amount} {ship.currency}
                      </div>
                      {parseFloat(ship.debt_amount) > 0 ? (
                        <div className="text-xs font-bold text-red-700">
                          Борг: {ship.debt_amount} {ship.currency}
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-green-700">
                          Оплачено
                        </div>
                      )}
                      <div className="text-[10px] text-gray-600 mt-1 font-semibold">
                        {paymentMethodLabels[ship.payment_method] || ship.payment_method}
                      </div>
                    </td>

                    {/* Sender & TTN */}
                    <td className="p-2">
                      <div className="font-bold text-xs text-black break-words">
                        Від: {ship.sender_name || '—'}
                      </div>
                      <div className="font-mono text-xs font-bold mt-1 whitespace-nowrap tracking-tight">
                        ТТН: {ship.ttn || '—'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {ship.carrier || 'Нова Пошта'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Print Signatures */}
            <div className="pt-8 flex justify-between text-xs font-semibold text-gray-700">
              <div>
                Відпустив (Комірник): ________________________
              </div>
              <div>
                Прийняв (Курьєр / Менеджер): ________________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
