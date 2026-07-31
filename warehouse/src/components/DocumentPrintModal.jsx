import { useState, useEffect } from 'react';
import { numberToWordsUah } from '../utils/numberToWords';

const SELLERS = {
  fop_pastushok: {
    id: "fop_pastushok",
    shortName: "ФОП Пастушок М. В.",
    fullName: "ФОП Пастушок Марія Володимирівна",
    office: "Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38",
    phone: "(067) 374-08-12",
    edrpou: "2987104829"
  },
  tov_cso: {
    id: "tov_cso",
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ "Центр сервісного обслуговування"',
    office: "Львівська обл., м. Золочів, вул. І. Труша 1Б",
    phone: "(067) 374-08-02",
    edrpou: "38920194"
  }
};

function getDefaultWarrantyMonths(productName = '') {
  const name = String(productName).toLowerCase();
  if (name.includes('інвертор') || name.includes('deye') || name.includes('solax') || name.includes('luxpower') || name.includes('victron')) {
    return 60; // 5 років
  }
  if (name.includes('панель') || name.includes('сонячн') || name.includes('ja solar') || name.includes('longi') || name.includes('jinko') || name.includes('trina')) {
    return 120; // 10 років
  }
  if (name.includes('акумулятор') || name.includes('акб') || name.includes('pylontech') || name.includes('dyness') || name.includes('felicity')) {
    return 60; // 5 років
  }
  return 12; // 1 рік по замовчуванню
}

export default function DocumentPrintModal({ isOpen, onClose, initialData = {} }) {
  const [docType, setDocType] = useState('invoice'); // 'invoice' | 'warranty' | 'ttn'
  const [isEditing, setIsEditing] = useState(false);

  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);

  const [sellerKey, setSellerKey] = useState('fop_pastushok');
  const [customSeller, setCustomSeller] = useState({ fullName: '', office: '', phone: '', edrpou: '' });

  const [buyer, setBuyer] = useState({ name: '', phone: '', address: '', edrpou: '' });
  const [currency, setCurrency] = useState('UAH');

  const [items, setItems] = useState([]);

  // Логістика для ТТН
  const [logistics, setLogistics] = useState({
    carrier: 'Нова Пошта',
    driverName: '',
    driverPhone: '',
    vehicleNo: '',
    departure: 'м. Золочів / м. Тернопіль',
    destination: '',
    placesCount: '1',
    grossWeight: '0',
    volume: '0.1',
    declaredValue: '0'
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setDocType(initialData.docType || 'invoice');
      setDocNumber(initialData.docNumber || `ВН-${Math.floor(1000 + Math.random() * 9000)}`);
      setDocDate(initialData.docDate || new Date().toISOString().split('T')[0]);
      
      if (initialData.sellerKey) setSellerKey(initialData.sellerKey);
      
      setBuyer({
        name: initialData.buyerName || initialData.buyer?.name || '',
        phone: initialData.buyerPhone || initialData.buyer?.phone || '',
        address: initialData.buyerAddress || initialData.buyer?.address || '',
        edrpou: initialData.buyerEdrpou || initialData.buyer?.edrpou || ''
      });

      setCurrency(initialData.currency || 'UAH');

      const rawItems = initialData.items || [];
      const formattedItems = rawItems.map((item, idx) => {
        const qty = parseFloat(item.quantity || item.qty) || 1;
        const price = parseFloat(item.price) || 0;
        const total = parseFloat(item.total) || (qty * price);
        return {
          id: item.id || `item_${idx}_${Date.now()}`,
          article: item.product_article || item.article || '',
          name: item.product_name || item.name || 'Товар',
          unit: item.unit || 'шт',
          qty: qty,
          price: price,
          total: total,
          serials: item.serials || '',
          warrantyMonths: item.warrantyMonths || getDefaultWarrantyMonths(item.product_name || item.name)
        };
      });

      setItems(formattedItems.length > 0 ? formattedItems : [
        { id: '1', article: '', name: 'Сонячний інвертор Deye 12 кВт', unit: 'шт', qty: 1, price: 0, total: 0, serials: '', warrantyMonths: 60 }
      ]);

      const totalVal = formattedItems.reduce((acc, i) => acc + (i.total || 0), 0);
      setLogistics(prev => ({
        ...prev,
        driverName: initialData.pickedUpBy || prev.driverName,
        destination: initialData.buyerAddress || prev.destination,
        declaredValue: totalVal > 0 ? String(totalVal) : prev.declaredValue,
        departure: initialData.warehouseName ? `Склад ${initialData.warehouseName}` : prev.departure
      }));

      setNotes(initialData.notes || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const seller = sellerKey === 'custom' ? customSeller : (SELLERS[sellerKey] || SELLERS.fop_pastushok);

  const totalSum = items.reduce((acc, i) => acc + (parseFloat(i.total) || (parseFloat(i.qty) * parseFloat(i.price)) || 0), 0);
  const totalQty = items.reduce((acc, i) => acc + (parseFloat(i.qty) || 0), 0);
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'грн';

  function updateItem(index, field, value) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'qty' || field === 'price') {
        const q = parseFloat(field === 'qty' ? value : updated.qty) || 0;
        const p = parseFloat(field === 'price' ? value : updated.price) || 0;
        updated.total = q * p;
      }
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [
      ...prev,
      { id: String(Date.now()), article: '', name: '', unit: 'шт', qty: 1, price: 0, total: 0, serials: '', warrantyMonths: 12 }
    ]);
  }

  function removeItem(index) {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .doc-print-area, .doc-print-area * {
            visibility: visible;
          }
          .doc-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Шапка модального вікна (no-print) */}
        <div className="p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[var(--text)]">🖨️ Генератор документів</span>
            
            {/* Перемикач типів документів */}
            <div className="flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  docType === 'invoice' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                📄 Видаткова
              </button>
              <button
                type="button"
                onClick={() => setDocType('warranty')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  docType === 'warranty' ? 'bg-amber-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                🛡️ Гарантійка
              </button>
              <button
                type="button"
                onClick={() => setDocType('ttn')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  docType === 'ttn' ? 'bg-emerald-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                🚚 ТТН
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${
                isEditing
                  ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }`}
            >
              {isEditing ? '👁️ Попередній перегляд' : '✏️ Редагувати поля'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors flex items-center gap-1.5"
            >
              🖨️ Друкувати
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Панель редагування полів (no-print, показується при isEditing = true) */}
        {isEditing && (
          <div className="p-4 bg-[var(--bg)] border-b border-[var(--border)] no-print space-y-3 overflow-y-auto max-h-[350px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Параметри документа</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Номер документа</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Дата</label>
                <input
                  type="date"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Продавець / Постачальник</label>
                <select
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={sellerKey}
                  onChange={(e) => setSellerKey(e.target.value)}
                >
                  <option value="fop_pastushok">ФОП Пастушок М. В.</option>
                  <option value="tov_cso">ТОВ "ЦСО"</option>
                  <option value="custom">Свій варіант</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Валюта суми</label>
                <select
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="UAH">UAH (грн)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[var(--border)]/50">
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Покупець / Отримувач</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={buyer.name}
                  onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Телефон покупця</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={buyer.phone}
                  onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Адреса доставки / клієнта</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={buyer.address}
                  onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                />
              </div>
            </div>

            {/* Логістичні поля для ТТН */}
            {docType === 'ttn' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[var(--border)]/50">
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Перевізник</label>
                  <input
                    type="text"
                    className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                    value={logistics.carrier}
                    onChange={(e) => setLogistics({ ...logistics, carrier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">ПІБ водія / Телефон</label>
                  <input
                    type="text"
                    className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                    value={logistics.driverName}
                    onChange={(e) => setLogistics({ ...logistics, driverName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Номер авто</label>
                  <input
                    type="text"
                    className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                    value={logistics.vehicleNo}
                    onChange={(e) => setLogistics({ ...logistics, vehicleNo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Кількість місць / Вага (кг)</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      className="w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                      placeholder="Місць"
                      value={logistics.placesCount}
                      onChange={(e) => setLogistics({ ...logistics, placesCount: e.target.value })}
                    />
                    <input
                      type="text"
                      className="w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                      placeholder="Вага кг"
                      value={logistics.grossWeight}
                      onChange={(e) => setLogistics({ ...logistics, grossWeight: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Область перегляду та друку документа */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-100 dark:bg-neutral-900 text-neutral-900">
          <div className="doc-print-area bg-white text-black p-8 sm:p-10 max-w-[800px] mx-auto shadow-lg font-sans text-xs leading-normal border border-gray-200 rounded-sm">
            
            {/* ----------------- 📄 1. ВИДАТКОВА НАКЛАДНА ----------------- */}
            {docType === 'invoice' && (
              <div>
                {/* Шапка */}
                <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4 mb-4">
                  <div>
                    <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" className="h-10 w-auto mb-1" />
                    <div className="font-extrabold text-sm">{seller.fullName}</div>
                    <div className="text-[10px] text-gray-600">{seller.office} | Тел: {seller.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-amber-600">ВИДАТКОВА НАКЛАДНА</div>
                    <div className="text-sm font-bold mt-1">№ {docNumber}</div>
                    <div className="text-xs text-gray-500">від {new Date(docDate).toLocaleDateString('uk-UA')} р.</div>
                  </div>
                </div>

                {/* Сторони */}
                <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 rounded border border-gray-200">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Постачальник:</span>
                    <div className="font-bold text-xs">{seller.fullName}</div>
                    <div className="text-[10px] text-gray-600">{seller.office}</div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Покупець:</span>
                    <div className="font-bold text-xs">{buyer.name || 'Одержувач'}</div>
                    <div className="text-[10px] text-gray-600">{buyer.phone} {buyer.address && `| ${buyer.address}`}</div>
                  </div>
                </div>

                {/* Таблиця товарів */}
                <table className="w-full border-collapse mb-4 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-y border-gray-300">
                      <th className="py-2 px-1 text-center w-8">№</th>
                      <th className="py-2 px-2 text-left">Найменування товару</th>
                      <th className="py-2 px-1 text-center w-12">Од.</th>
                      <th className="py-2 px-1 text-right w-16">К-сть</th>
                      <th className="py-2 px-2 text-right w-24">Ціна ({currencySymbol})</th>
                      <th className="py-2 px-2 text-right w-28">Сума ({currencySymbol})</th>
                      <th className="py-2 px-1 w-6 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 px-1 text-center font-mono">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none font-medium text-xs"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-1 text-center">{item.unit}</td>
                        <td className="py-2 px-1 text-right">
                          <input
                            type="number"
                            step="any"
                            className="w-14 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none font-bold text-xs"
                            value={item.qty}
                            onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="any"
                            className="w-20 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none font-medium text-xs"
                            value={item.price}
                            onChange={(e) => updateItem(idx, 'price', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-bold">
                          {item.total.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-1 text-center no-print">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                            title="Видалити рядок"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Додати рядок (no-print) */}
                <div className="mb-4 no-print">
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1"
                  >
                    ➕ Додати товар
                  </button>
                </div>

                {/* Підсумки */}
                <div className="flex justify-between items-start pt-2 border-t-2 border-gray-300 mb-6">
                  <div className="text-xs space-y-1">
                    <div>Всього найменувань: <span className="font-bold">{items.length}</span> на суму: <span className="font-bold">{totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span></div>
                    <div className="italic text-gray-700 font-medium">
                      Сума прописом: <span className="font-bold">{numberToWordsUah(totalSum, currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Підписи */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 mt-12 text-xs">
                  <div>
                    <div className="font-bold mb-8">Відпустив (Постачальник):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>(підпис)</span>
                      <span>{seller.shortName}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold mb-8">Отримав (Покупець):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>(підпис)</span>
                      <span>{buyer.name || '____________'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- 🛡️ 2. ГАРАНТІЙНИЙ ТАЛОН ----------------- */}
            {docType === 'warranty' && (
              <div>
                {/* Шапка */}
                <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4 mb-4">
                  <div>
                    <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" className="h-10 w-auto mb-1" />
                    <div className="font-extrabold text-sm">{seller.fullName}</div>
                    <div className="text-[10px] text-gray-600">{seller.office} | Тел: {seller.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-amber-600">ГАРАНТІЙНИЙ ТАЛОН</div>
                    <div className="text-sm font-bold mt-1">№ ГТ-{docNumber.replace(/[^\d]/g, '') || Math.floor(1000+Math.random()*9000)}</div>
                    <div className="text-xs text-gray-500">від {new Date(docDate).toLocaleDateString('uk-UA')} р.</div>
                  </div>
                </div>

                {/* Покупець */}
                <div className="mb-4 p-3 bg-amber-500/5 rounded border border-amber-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-500 block">Покупець / Клієнт:</span>
                      <div className="font-bold text-xs">{buyer.name || 'Одержувач'}</div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-500 block">Телефон:</span>
                      <div className="font-bold text-xs">{buyer.phone || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Таблиця обладнання та серійних номерів */}
                <div className="mb-4">
                  <div className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2">Перелік гарантійного обладнання:</div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-y border-gray-300">
                        <th className="py-2 px-1 text-center w-8">№</th>
                        <th className="py-2 px-2 text-left">Обладнання / Модель</th>
                        <th className="py-2 px-1 text-center w-12">К-сть</th>
                        <th className="py-2 px-2 text-left w-48">Серійні номери (S/N)</th>
                        <th className="py-2 px-2 text-center w-28">Гарантія</th>
                        <th className="py-2 px-1 w-6 no-print"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-1 text-center font-mono">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none font-bold text-xs"
                              value={item.name}
                              onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-1 text-center font-bold">{item.qty} {item.unit}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              className="w-full bg-amber-50/50 border border-amber-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded px-1.5 py-0.5 text-xs font-mono"
                              placeholder="Введіть S/N..."
                              value={item.serials}
                              onChange={(e) => updateItem(idx, 'serials', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-amber-700">
                            <input
                              type="number"
                              className="w-12 text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none font-bold text-xs"
                              value={item.warrantyMonths}
                              onChange={(e) => updateItem(idx, 'warrantyMonths', e.target.value)}
                            /> міс.
                          </td>
                          <td className="py-2 px-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-500 hover:text-red-700 font-bold px-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Умови гарантії */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-[10px] space-y-1 text-gray-700 leading-tight">
                  <div className="font-bold text-xs text-gray-900 mb-1">Умови гарантійного обслуговування CSO Solar:</div>
                  <p>1. Гарантійний ремонт здійснюється при наявності даного талону та збереженні заводських пломб і серійних номерів.</p>
                  <p>2. Гарантія не поширюється на вироби із механічними пошкодженнями, слідами затоплення, термічного впливу або неправильного монтажу.</p>
                  <p>3. Обладнання приймається на діагностику та гарантійне обслуговування в комплекті з оригінальним пакуванням.</p>
                </div>

                {/* Підписи */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 mt-8 text-xs">
                  <div>
                    <div className="font-bold mb-8">Продавець (CSO Solar):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>(підпис, М.П.)</span>
                      <span>{seller.shortName}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold mb-8">Покупець (з умовами ознайомлений):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>(підпис)</span>
                      <span>{buyer.name || '____________'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- 🚚 3. ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА (ТТН) ----------------- */}
            {docType === 'ttn' && (
              <div>
                {/* Шапка */}
                <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-3 mb-3">
                  <div>
                    <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" className="h-9 w-auto mb-1" />
                    <div className="font-extrabold text-xs">{seller.fullName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-emerald-700">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
                    <div className="text-xs font-bold">№ ТТН-{docNumber.replace(/[^\d]/g, '') || Math.floor(1000+Math.random()*9000)}</div>
                    <div className="text-[10px] text-gray-500">від {new Date(docDate).toLocaleDateString('uk-UA')} р.</div>
                  </div>
                </div>

                {/* Перевізник та Авто */}
                <div className="grid grid-cols-2 gap-3 mb-3 p-2.5 bg-gray-50 rounded border border-gray-200 text-xs">
                  <div>
                    <div><span className="font-bold">Перевізник:</span> {logistics.carrier}</div>
                    <div><span className="font-bold">Водій / Експедитор:</span> {logistics.driverName || 'не вказано'}</div>
                  </div>
                  <div>
                    <div><span className="font-bold">Автомобіль / Держномер:</span> {logistics.vehicleNo || '—'}</div>
                    <div><span className="font-bold">Пункт навантаження:</span> {logistics.departure}</div>
                  </div>
                </div>

                {/* Відправник / Одержувач */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div className="p-2 border border-gray-200 rounded">
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Вантажовідправник:</span>
                    <div className="font-bold">{seller.fullName}</div>
                    <div className="text-[10px] text-gray-600">{seller.office}</div>
                  </div>
                  <div className="p-2 border border-gray-200 rounded">
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Вантажоодержувач:</span>
                    <div className="font-bold">{buyer.name || 'Покупець'}</div>
                    <div className="text-[10px] text-gray-600">{logistics.destination || buyer.address || buyer.phone}</div>
                  </div>
                </div>

                {/* Таблиця вантажу */}
                <table className="w-full border-collapse mb-3 text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-y border-gray-300">
                      <th className="py-1.5 px-1 text-center w-8">№</th>
                      <th className="py-1.5 px-2 text-left">Найменування вантажу</th>
                      <th className="py-1.5 px-1 text-center w-12">Од.</th>
                      <th className="py-1.5 px-1 text-right w-16">К-сть</th>
                      <th className="py-1.5 px-2 text-right w-24">Оголошена вартість ({currencySymbol})</th>
                      <th className="py-1.5 px-1 w-6 no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-1.5 px-1 text-center font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-medium">{item.name}</td>
                        <td className="py-1.5 px-1 text-center">{item.unit}</td>
                        <td className="py-1.5 px-1 text-right font-bold">{item.qty}</td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          {item.total.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-1 text-center no-print">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Разом вантажні місця та вага */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-emerald-50 border border-emerald-200 rounded text-center text-xs">
                  <div><span className="text-[10px] text-gray-500 block uppercase">Всього місць:</span> <span className="font-extrabold text-emerald-800">{logistics.placesCount || items.length}</span></div>
                  <div><span className="text-[10px] text-gray-500 block uppercase">Загальна вага (кг):</span> <span className="font-extrabold text-emerald-800">{logistics.grossWeight || '—'} кг</span></div>
                  <div><span className="text-[10px] text-gray-500 block uppercase">Загальна вартість:</span> <span className="font-extrabold text-emerald-800">{totalSum.toLocaleString('uk-UA')} {currencySymbol}</span></div>
                </div>

                {/* 3 підписи */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 mt-6 text-[10px]">
                  <div>
                    <div className="font-bold mb-6">Сдав (Вантажовідправник):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-gray-500 text-center">(підпис)</div>
                  </div>
                  <div>
                    <div className="font-bold mb-6">Прийняв водій-експедитор:</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-gray-500 text-center">(підпис)</div>
                  </div>
                  <div>
                    <div className="font-bold mb-6">Прийняв (Вантажоодержувач):</div>
                    <div className="border-b border-gray-400 w-full mb-1"></div>
                    <div className="text-gray-500 text-center">(підпис)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
