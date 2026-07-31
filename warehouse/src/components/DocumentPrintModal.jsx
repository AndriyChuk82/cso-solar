import { useState, useEffect } from 'react';
import { numberToWordsUah } from '../utils/numberToWords';
import { printOfficialDocumentFromKP } from '../utils/documentTemplates';

const SELLERS = {
  fop_pastushok: {
    id: "fop_pastushok",
    shortName: "ФОП Пастушок М. В.",
    fullName: "ФОП Пастушок Марія Володимирівна",
    office: "Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38",
    phone: "(067) 374-08-12",
    taxId: "2987104829",
    taxIdType: "РНОКПП",
    iban: "UA89322313000002600123456789",
    logo: "https://i.ibb.co/32JD4dc/logo.png"
  },
  tov_cso: {
    id: "tov_cso",
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743',
    office: "Львівська обл., м. Золочів, вул. І. Труша 1Б",
    phone: "(067) 374-08-02",
    taxId: "31758743",
    taxIdType: "ЄДРПОУ",
    iban: "UA54322313000002600987654321",
    logo: "https://i.ibb.co/32JD4dc/logo.png"
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

  const [sellerKey, setSellerKey] = useState('tov_cso');
  const [customSeller, setCustomSeller] = useState({
    fullName: '',
    office: '',
    phone: '',
    taxId: '',
    taxIdType: 'ЄДРПОУ',
    iban: '',
    logo: 'https://i.ibb.co/32JD4dc/logo.png'
  });

  const [buyer, setBuyer] = useState({ name: '', phone: '', address: '', edrpou: '' });
  const [currency, setCurrency] = useState('UAH');

  const [items, setItems] = useState([]);

  // Логістика для ТТН
  const [logistics, setLogistics] = useState({
    carrier: 'ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743',
    driverName: '',
    driverPhone: '',
    vehicleNo: '',
    departure: 'м. Тернопіль',
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
      setDocNumber(initialData.docNumber || `${Math.floor(1000 + Math.random() * 9000)}`);
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
        departure: initialData.warehouseName ? `м. ${initialData.warehouseName}` : prev.departure
      }));

      setNotes(initialData.notes || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const seller = sellerKey === 'custom' ? customSeller : (SELLERS[sellerKey] || SELLERS.tov_cso);

  const totalSum = items.reduce((acc, i) => acc + (parseFloat(i.total) || (parseFloat(i.qty) * parseFloat(i.price)) || 0), 0);
  const totalQty = items.reduce((acc, i) => acc + (parseFloat(i.qty) || 0), 0);
  const currencySymbol = currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'грн';

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

  const dateObj = docDate ? new Date(docDate) : new Date();
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const month = monthNames[dateObj.getMonth()];
  const year = String(dateObj.getFullYear()).slice(-2);
  const dateStr = dateObj.toLocaleDateString('uk-UA');

  function handlePrintOfficialDocument() {
    printOfficialDocumentFromKP(docType, {
      docNumber,
      docDate,
      seller,
      buyer,
      currency,
      items,
      logistics,
      notes
    });
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
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Шапка модального вікна (no-print) */}
        <div className="p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[var(--text)]">🖨️ Друк документа</span>
            
            {/* Перемикач типів документів */}
            <div className="flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  docType === 'invoice' ? 'bg-amber-500 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
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
                  docType === 'ttn' ? 'bg-amber-700 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                🚚 ТТН (Форма № 1-ТН)
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
              {isEditing ? '👁️ Перегляд' : '✏️ Редагувати поля'}
            </button>
            <button
              type="button"
              onClick={handlePrintOfficialDocument}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow transition-colors flex items-center gap-1.5"
            >
              🖨️ Друкувати бланк КП
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

        {/* Панель редагування полів (no-print) */}
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
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Продавець / Вантажовідправник</label>
                <select
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={sellerKey}
                  onChange={(e) => setSellerKey(e.target.value)}
                >
                  <option value="tov_cso">ТОВ «ЦСО» (ЄДРПОУ 31758743)</option>
                  <option value="fop_pastushok">ФОП Пастушок М. В.</option>
                  <option value="custom">Свій варіант</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Валюта</label>
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
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Вантажоодержувач / Покупець</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={buyer.name}
                  onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Пункт навантаження</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={logistics.departure}
                  onChange={(e) => setLogistics({ ...logistics, departure: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Пункт розвантаження</label>
                <input
                  type="text"
                  className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                  value={logistics.destination || buyer.address}
                  onChange={(e) => setLogistics({ ...logistics, destination: e.target.value })}
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
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">ПІБ водія</label>
                  <input
                    type="text"
                    className="w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]"
                    value={logistics.driverName}
                    onChange={(e) => setLogistics({ ...logistics, driverName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5">Автомобіль (марка/номер)</label>
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

        {/* ПРЕВ'Ю ДОКУМЕНТА (ЯКЩО ТТН -> 100% ТОЧНА ФОРМА № 1-ТН З ЗВОРОТНИМ БОКОМ З СКРІНШОТУ) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-200 dark:bg-neutral-900">
          
          {docType === 'ttn' ? (
            /* 🚚 ФОРМА № 1-ТН (100% точна копія з додатку КП та скріншоту) */
            <div className="doc-print-area bg-white text-black p-6 sm:p-8 max-w-[280mm] mx-auto shadow-2xl border border-gray-400 font-serif text-[11px] leading-tight">
              
              {/* Додаток 7 */}
              <div className="text-right text-[9px] mb-2 leading-tight">
                Додаток 7<br />
                до Правил перевезень вантажів автомобільним транспортом в Україні<br />
                (пункт 11.1 глави 11)
              </div>

              {/* Заголовок */}
              <div className="text-center my-4 relative">
                <div className="text-base font-bold tracking-wider">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
                <div className="text-xs font-bold mt-1">
                  N <span className="border-b border-black inline-block min-w-[60px] text-center">{docNumber}</span> " <span className="border-b border-black inline-block min-w-[25px] text-center">{day}</span> " <span className="border-b border-black inline-block min-w-[80px] text-center">{month}</span> 20<span className="border-b border-black inline-block min-w-[25px] text-center">{year}</span> року
                </div>
                <div className="absolute right-0 top-0 font-bold text-xs">Форма № 1-ТН</div>
              </div>

              {/* Рядки полів 1-ТН */}
              <div className="space-y-3 mb-6">
                <div className="flex items-end w-[350px]">
                  <span className="font-bold mr-2">Місце складання</span>
                  <span className="border-b border-black flex-1 text-center font-sans font-bold">{logistics.departure}</span>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Автомобіль</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.vehicleNo || 'Автомобільний'}</span>
                    </div>
                    <span className="text-[8px] text-center">(марка, модель, тип, реєстраційний номер)</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Причіп/напівпричіп</span>
                      <span className="border-b border-black flex-1 text-center font-sans"></span>
                    </div>
                    <span className="text-[8px] text-center">(марка, модель, тип, реєстраційний номер)</span>
                  </div>
                  <div className="w-[180px] flex items-end">
                    <span className="font-bold mr-2">Вид перевезень</span>
                    <span className="border-b border-black flex-1 text-center font-sans">Автомобільні</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-end">
                    <span className="font-bold mr-2">Місце де зберігається автомобіль*</span>
                    <span className="border-b border-black flex-1 text-center font-sans"></span>
                  </div>
                  <span className="text-[8px] text-center">(адреса місцезнаходження автомобільного перевізника, його структурного підрозділу або філії, де зберігається транспортний засіб)</span>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-[2] flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Автомобільний перевізник</span>
                      <span className="border-b border-black flex-1 text-center font-sans font-bold">{logistics.carrier || seller.fullName}</span>
                    </div>
                    <span className="text-[8px] text-center">(повне найменування, код ЄДРПОУ)</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Водій</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.driverName || '—'}</span>
                    </div>
                    <span className="text-[8px] text-center">(ПІБ, номер посвідчення водія)</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-end">
                    <span className="font-bold mr-2">Вантажовідправник</span>
                    <span className="border-b border-black flex-1 text-center font-sans font-bold">{seller.fullName}</span>
                  </div>
                  <span className="text-[8px] text-center">(повне найменування, код ЄДРПОУ або податковий номер)</span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-end">
                    <span className="font-bold mr-2">Вантажоодержувач</span>
                    <span className="border-b border-black flex-1 text-center font-sans font-bold">{buyer.name || 'Покупець'}</span>
                  </div>
                  <span className="text-[8px] text-center">(повне найменування, код ЄДРПОУ або податковий номер)</span>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Пункт навантаження</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.departure}</span>
                    </div>
                    <span className="text-[8px] text-center">(місцезнаходження)</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">Пункт розвантаження</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.destination || buyer.address || '—'}</span>
                    </div>
                    <span className="text-[8px] text-center">(місцезнаходження)</span>
                  </div>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">кількість місць</span>
                      <span className="border-b border-black flex-1 text-center font-sans font-bold">{logistics.placesCount || items.length}</span>
                    </div>
                    <span className="text-[8px] text-center">(словами)</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">масою брутто, т</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.grossWeight ? `${logistics.grossWeight} кг` : '—'}</span>
                    </div>
                    <span className="text-[8px] text-center">(словами)</span>
                  </div>
                  <div className="flex-[1.5] flex flex-col">
                    <div className="flex items-end">
                      <span className="font-bold mr-2">отримав водій/експедитор</span>
                      <span className="border-b border-black flex-1 text-center font-sans">{logistics.driverName || '—'}</span>
                    </div>
                    <span className="text-[8px] text-center">(ПІБ, посада, підпис)</span>
                  </div>
                </div>

                <div className="flex items-end gap-2 text-[9px] pt-1">
                  <span className="font-bold shrink-0">Відомості про транспортний засіб:</span>
                  <div className="w-16 border-b border-black text-center"></div>
                  <div className="w-16 border-b border-black text-center"></div>
                  <div className="w-16 border-b border-black text-center"></div>
                  <div className="flex-1 border-b border-black text-center"></div>
                </div>

                <div className="flex items-end gap-2 pt-1">
                  <span className="font-bold">Усього відпущено на загальну суму</span>
                  <span className="border-b border-black flex-1 text-center font-sans font-bold">
                    {totalSum > 0 ? totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2 }) + ' грн.' : '—'}
                  </span>
                  <span className="font-bold">у тому числі ПДВ</span>
                  <span className="border-b border-black w-24 text-center font-sans">0,00</span>
                  <span className="font-bold">грн.</span>
                </div>
              </div>

              {/* ЗВОРОТНІЙ БІК - ВІДОМОСТІ ПРО ВАНТАЖ (12 КОЛОНОК) */}
              <div className="pt-6 border-t-2 border-dashed border-gray-400 mt-8">
                <div className="text-right font-bold text-[9px] mb-1">Зворотній бік</div>
                <div className="text-center font-bold text-xs uppercase mb-2">ВІДОМОСТІ ПРО ВАНТАЖ</div>

                <table className="w-full border-collapse text-[9px] font-sans">
                  <thead>
                    <tr className="bg-gray-100 font-serif">
                      <th className="border border-black p-1 w-6">№<br/>з/п</th>
                      <th className="border border-black p-1 text-left">Найменування вантажу</th>
                      <th className="border border-black p-1 w-16">Ідентифік. номер</th>
                      <th className="border border-black p-1 w-10">Вид тварини</th>
                      <th className="border border-black p-1 w-14">Темпер. режим</th>
                      <th className="border border-black p-1 w-10">Одиниця виміру</th>
                      <th className="border border-black p-1 w-12">Кількість місць</th>
                      <th className="border border-black p-1 w-16">Ціна без ПДВ, грн</th>
                      <th className="border border-black p-1 w-20">Загальна сума з ПДВ, грн</th>
                      <th className="border border-black p-1 w-12">Вид пакування</th>
                      <th className="border border-black p-1 w-14">Документи</th>
                      <th className="border border-black p-1 w-12">Маса брутто, т</th>
                    </tr>
                    <tr className="bg-gray-50 text-center font-bold text-[8px]">
                      <td className="border border-black">1</td>
                      <td className="border border-black">2</td>
                      <td className="border border-black">3</td>
                      <td className="border border-black">4</td>
                      <td className="border border-black">5</td>
                      <td className="border border-black">6</td>
                      <td className="border border-black">7</td>
                      <td className="border border-black">8</td>
                      <td className="border border-black">9</td>
                      <td className="border border-black">10</td>
                      <td className="border border-black">11</td>
                      <td className="border border-black">12</td>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="border border-black font-mono">{idx + 1}</td>
                        <td className="border border-black text-left font-bold p-1">
                          <input
                            type="text"
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none font-bold text-[10px]"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td className="border border-black">—</td>
                        <td className="border border-black">—</td>
                        <td className="border border-black">—</td>
                        <td className="border border-black">{item.unit || 'шт'}</td>
                        <td className="border border-black font-bold">{item.qty}</td>
                        <td className="border border-black">—</td>
                        <td className="border border-black font-bold">
                          {item.total > 0 ? item.total.toLocaleString('uk-UA', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td className="border border-black">—</td>
                        <td className="border border-black">—</td>
                        <td className="border border-black">—</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-100">
                      <td colSpan={6} className="border border-black text-left p-1">Усього:</td>
                      <td className="border border-black text-center">{totalQty}</td>
                      <td className="border border-black"></td>
                      <td className="border border-black text-center">{totalSum > 0 ? totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2 }) : '0,00'}</td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                      <td className="border border-black"></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Підписи */}
                <div className="flex justify-between items-start mt-6 text-[10px] font-serif">
                  <div className="w-[45%]">
                    <div className="font-bold">Здав (відповідальна особа вантажовідправника):</div>
                    <div className="border-b border-black h-5 mt-2"></div>
                    <div className="text-[7.5px] text-center mt-0.5">(прізвище, посада, підпис)</div>
                  </div>
                  <div className="w-[45%]">
                    <div className="font-bold">Прийняв (відповідальна особа вантажоодержувача):</div>
                    <div className="border-b border-black h-5 mt-2"></div>
                    <div className="text-[7.5px] text-center mt-0.5">(прізвище, посада, підпис)</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 📄 ВИДАТКОВА НАКЛАДНА ТА 🛡️ ГАРАНТІЙКА (ДИЗАЙН КП) */
            <div className="doc-print-area bg-white text-slate-900 p-8 sm:p-10 max-w-[210mm] mx-auto shadow-2xl rounded-2xl border border-[#e8e4d1] font-sans leading-relaxed text-xs">
              
              {/* 1. ШАПКА ДОКУМЕНТА */}
              <div className="grid grid-cols-[140px_1fr_325px] gap-6 items-center border-b-2 border-amber-500 pb-5 mb-6">
                <div className="flex items-center">
                  <img src={seller.logo} alt="CSO Solar Logo" className="h-16 w-auto object-contain" />
                </div>

                <div className="text-center flex flex-col justify-center gap-0.5">
                  <h1 className="text-base font-black text-slate-900 tracking-wider uppercase leading-snug whitespace-nowrap">
                    {docType === 'invoice' ? 'ВИДАТКОВА НАКЛАДНА' : 'ГАРАНТІЙНИЙ ТАЛОН'}
                  </h1>
                  <div className="text-sm font-bold text-amber-600">
                    № {docNumber}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    від {dateStr}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="border border-[#e8e4d1] rounded-xl p-3 bg-slate-50/30 w-full max-w-[325px] text-[10px] text-slate-700">
                    <div className="border-b border-[#e8e4d1]/80 pb-1.5 mb-2 text-right">
                      <span className="font-extrabold text-slate-900 uppercase tracking-wide text-[11px] block leading-snug">
                        {seller.fullName}
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400 font-medium">{seller.taxIdType || 'ЄДРПОУ'}:</span>
                        <span className="font-bold text-slate-800 text-right">{seller.taxId}</span>
                      </div>
                      {seller.iban && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-slate-400 font-medium">IBAN:</span>
                          <span className="font-bold text-slate-800 text-right whitespace-nowrap">{seller.iban}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-slate-400 font-medium">Телефон:</span>
                        <span className="font-bold text-slate-800 text-right whitespace-pre-line leading-tight">{seller.phone}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2 pt-0.5">
                        <span className="text-slate-400 font-medium shrink-0">Адреса:</span>
                        <span className="font-bold text-slate-800 text-right leading-tight whitespace-normal break-words max-w-[245px]">{seller.office}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. БЛОК ЗАМОВНИКА / ПОКУПЦЯ */}
              <div className="mb-6 text-xs">
                <div className="py-2 px-1">
                  <div className="border-b border-[#e8e4d1]/80 pb-1.5 mb-2.5">
                    <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                      ПОКУПЕЦЬ / ЗАМОВНИК
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-700 font-medium">
                    <div className="font-extrabold text-slate-900 text-sm tracking-tight">
                      {buyer.name || 'Шановний Клієнт'}
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]">
                      {buyer.phone && (
                        <div className="flex items-center"><span className="text-slate-400 font-medium mr-1.5">Телефон:</span> <span className="text-slate-800 font-bold">{buyer.phone}</span></div>
                      )}
                      {buyer.address && (
                        <div className="flex items-center"><span className="text-slate-400 font-medium mr-1.5">Адреса:</span> <span className="text-slate-800 font-semibold">{buyer.address}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ТАБЛИЦЯ ТОВАРІВ / ОБЛАДНАННЯ */}
              <div className="mb-6">
                <table className="proposal-print-table w-full text-left border-collapse border border-[#e8e4d1] text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider border-b border-[#e8e4d1]">
                      <th className="border border-[#e8e4d1] p-2.5 text-center w-8">#</th>
                      <th className="border border-[#e8e4d1] p-2.5">Найменування обладнання та послуг</th>
                      <th className="border border-[#e8e4d1] p-2.5 text-center w-12">Од.</th>
                      <th className="border border-[#e8e4d1] p-2.5 text-center w-20">Кількість</th>
                      
                      {docType === 'warranty' ? (
                        <>
                          <th className="border border-[#e8e4d1] p-2.5 text-left w-48">Серійний номер (S/N)</th>
                          <th className="border border-[#e8e4d1] p-2.5 text-center w-24">Гарантія</th>
                        </>
                      ) : (
                        <>
                          <th className="border border-[#e8e4d1] p-2.5 text-center w-24">Ціна, {currencySymbol}</th>
                          <th className="border border-[#e8e4d1] p-2.5 text-center w-28">Сума, {currencySymbol}</th>
                        </>
                      )}
                      <th className="border border-[#e8e4d1] p-1 w-6 no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const price = parseFloat(item.price) || 0;
                      const sum = parseFloat(item.total) || (price * (item.qty || 0));

                      return (
                        <tr key={item.id || index} className="hover:bg-slate-50/30">
                          <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-400 font-mono">
                            {index + 1}
                          </td>
                          <td className="border border-[#e8e4d1]/80 p-2.5">
                            <input
                              type="text"
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-800 text-xs"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                            />
                          </td>
                          <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-500">
                            {item.unit || 'шт'}
                          </td>
                          <td className="border border-[#e8e4d1]/80 p-2.5 text-center font-medium text-slate-800">
                            <input
                              type="number"
                              step="any"
                              className="w-14 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs"
                              value={item.qty}
                              onChange={(e) => updateItem(index, 'qty', e.target.value)}
                            />
                          </td>

                          {docType === 'warranty' ? (
                            <>
                              <td className="border border-[#e8e4d1]/80 p-2 text-left">
                                <input
                                  type="text"
                                  className="w-full bg-amber-50/40 border border-amber-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-xs font-mono"
                                  placeholder="Вкажіть S/N..."
                                  value={item.serials}
                                  onChange={(e) => updateItem(index, 'serials', e.target.value)}
                                />
                              </td>
                              <td className="border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-amber-700">
                                <input
                                  type="number"
                                  className="w-12 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs"
                                  value={item.warrantyMonths}
                                  onChange={(e) => updateItem(index, 'warrantyMonths', e.target.value)}
                                /> міс.
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border border-[#e8e4d1]/80 p-2.5 text-center text-slate-600">
                                <input
                                  type="number"
                                  step="any"
                                  className="w-20 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-medium text-xs"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', e.target.value)}
                                />
                              </td>
                              <td className="border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-slate-800">
                                {sum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </>
                          )}
                          
                          <td className="border border-[#e8e4d1]/80 p-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 font-bold px-1"
                              title="Видалити рядок"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Кнопка додавання товару (no-print) */}
              <div className="mb-6 no-print">
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#e8e4d1] flex items-center gap-1.5"
                >
                  ➕ Додати рядок товару
                </button>
              </div>

              {/* 4. ФІНАНСОВИЙ ПІДСУМОК ТА ПРИМІТКИ */}
              <div className="flex justify-between items-start gap-8 mb-8 text-xs">
                <div className="flex-1 border border-[#e8e4d1]/80 rounded-xl p-4 bg-slate-50/25">
                  <span className="text-[10px] uppercase font-bold text-[#a89a74] tracking-wider">
                    {docType === 'warranty' ? 'УМОВИ ГАРАНТІЇ CSO SOLAR:' : 'СУМА ПРОПИСОМ ТА ПРИМІТКИ:'}
                  </span>
                  
                  {docType === 'warranty' ? (
                    <div className="text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium space-y-1">
                      <p>1. Гарантійний ремонт здійснюється при наявності талону та збережених заводських пломб і S/N.</p>
                      <p>2. Гарантія не поширюється на вироби з механічними пошкодженнями чи слідів некоректного монтажу.</p>
                      <p>3. Обладнання приймається на сервіс в оригінальному пакуванні.</p>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700 leading-normal mt-1.5 font-medium">
                      <div className="font-bold text-slate-900">{numberToWordsUah(totalSum, currency)}</div>
                      {notes && <div className="mt-2 text-slate-500 italic border-t border-[#e8e4d1]/60 pt-1.5">{notes}</div>}
                    </div>
                  )}
                </div>

                <div className="w-80 border border-[#e8e4d1] rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="p-3 bg-slate-50/50 border-b border-[#e8e4d1]/65 space-y-1.5 text-slate-500 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span>Всього найменувань:</span>
                      <span className="font-bold text-slate-800">{items.length} позицій</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Загальна кількість:</span>
                      <span className="font-bold text-slate-800">{totalQty} {items[0]?.unit || 'шт'}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shadow-inner">
                    <span className="font-bold text-xs uppercase tracking-wider">ВСЬОГО ДО СПЛАТИ:</span>
                    <span className="font-black text-sm whitespace-nowrap">
                      {totalSum.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. ПІДПИСИ */}
              <div className="grid grid-cols-2 gap-12 pt-6 border-t border-[#e8e4d1] text-xs">
                <div>
                  <div className="font-bold text-slate-800 mb-8">Відпустив (Постачальник):</div>
                  <div className="border-b border-slate-400 w-full mb-1"></div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>(підпис, М.П.)</span>
                    <span className="font-bold">{seller.shortName}</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 mb-8">
                    {docType === 'warranty' ? 'Покупець (з умовами ознайомлений):' : 'Отримав (Покупець):'}
                  </div>
                  <div className="border-b border-slate-400 w-full mb-1"></div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>(підпис)</span>
                    <span className="font-bold">{buyer.name || '____________________'}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
