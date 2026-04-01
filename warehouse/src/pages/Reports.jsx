import { useState, useEffect, useMemo } from 'react';
import { getWarehouses, getStockReport, getCompareReport, getMovementReport, getCatalog } from '../api/gasApi';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import { formatQuantity } from '../utils/formatUtils';
import CONFIG from '../config';
import ResizableHeader from '../components/ResizableHeader';

/**
 * Звіти та аналітика — 3 типи звітів з експортом Excel/PDF.
 */
export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  const [stockFilter, setStockFilter] = useState({
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    nonZeroOnly: true
  });
  const [compareFilter, setCompareFilter] = useState({ nonZeroOnly: true });
  const [moveFilter, setMoveFilter] = useState({
    warehouseId: '',
    productId: '',
    dateFrom: '',
    dateTo: '',
    type: ''
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const [whResult, catResult] = await Promise.all([getWarehouses(), getCatalog()]);
        if (whResult?.success) setWarehouses(whResult.warehouses || []);
        if (catResult?.success) setProducts(catResult.products || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  async function generateReport() {
    setLoading(true);
    setReportData(null);
    try {
      let result;
      if (activeTab === 'stock') {
        result = await getStockReport(stockFilter.warehouseId, stockFilter.date);
      } else if (activeTab === 'compare') {
        result = await getCompareReport();
      } else {
        result = await getMovementReport(moveFilter);
      }
      if (result?.success) setReportData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const sortedItems = useMemo(() => {
    if (!reportData?.items) return [];
    
    let items = [...reportData.items];

    // Фільтрація ненульових залишків
    if (activeTab === 'stock' && stockFilter.nonZeroOnly) {
      items = items.filter(item => (parseFloat(item['Кількість']) || 0) !== 0);
    } else if (activeTab === 'compare' && compareFilter.nonZeroOnly) {
      items = items.filter(item => (parseFloat(item['Всього']) || 0) !== 0);
    }

    if (!sortAsc) return items;

    return items.sort((a, b) => {
      const nameA = String(a['Товар'] || a['Назва'] || a['Назва категорії'] || '');
      const nameB = String(b['Товар'] || b['Назва'] || b['Назва категорії'] || '');
      return nameA.localeCompare(nameB);
    });
  }, [reportData, sortAsc, activeTab, stockFilter.nonZeroOnly, compareFilter.nonZeroOnly]);

  function getReportTitle() {
    if (activeTab === 'stock') {
      const whName = warehouses.find((w) => w.id === stockFilter.warehouseId)?.name || 'Всі склади';
      return `Залишки — ${whName} на ${formatDate(stockFilter.date)}`;
    }
    if (activeTab === 'compare') return 'Порівняння складів';
    return 'Рух товарів';
  }

  function getFileName() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const typeMap = { stock: 'залишки', compare: 'порівняння', move: 'рух' };
    return `звіт_${typeMap[activeTab]}_${date}`;
  }

  function handleExportExcel() {
    if (!reportData?.columns || sortedItems.length === 0) return;
    
    // Форматуємо дати та кількості в айтемах перед експортом
    const items = sortedItems.map(row => {
      const newRow = { ...row };
      if (newRow['Дата']) newRow['Дата'] = formatDate(newRow['Дата']);
      
      reportData.columns.forEach(col => {
        if (col === 'Кількість' || col === 'Всього' || warehouses.some(w => w.name === col)) {
          newRow[col] = formatQuantity(newRow[col], row.category, row['Товар'] || row['Назва']);
        }
      });
      
      return newRow;
    });

    exportToExcel(reportData.columns, items, getFileName());
  }

  function handleExportPdf() {
    if (!reportData?.columns || sortedItems.length === 0) return;

    // Форматуємо дати та кількості в айтемах перед експортом
    const items = sortedItems.map(row => {
      const newRow = { ...row };
      if (newRow['Дата']) newRow['Дата'] = formatDate(newRow['Дата']);
      
      reportData.columns.forEach(col => {
        if (col === 'Кількість' || col === 'Всього' || warehouses.some(w => w.name === col)) {
          newRow[col] = formatQuantity(newRow[col], row.category, row['Товар'] || row['Назва']);
        }
      });
      
      return newRow;
    });

    exportToPdf(reportData.columns, items, getReportTitle(), getFileName());
  }

  const tabs = [
    { key: 'stock', label: '📦 Залишки по складу', icon: '📦' },
    { key: 'compare', label: '📊 Порівняння складів', icon: '📊' },
    { key: 'move', label: '🔄 Рух товару', icon: '🔄' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Звіти та аналітика</h1>
          <p className="page-subtitle">Аналіз залишків та руху товарів</p>
        </div>
      </div>

      {/* Вкладки */}
      <div style={{
        display: 'flex',
        gap: '2px',
        marginBottom: '20px',
        background: 'var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        width: 'fit-content'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className="btn"
            style={{
              background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '0.82rem',
              padding: '8px 16px'
            }}
            onClick={() => { setActiveTab(tab.key); setReportData(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Фільтри */}
      <div className="card" style={{ marginBottom: '12px', padding: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px' }}>
          {activeTab === 'stock' && (
            <>
              <div className="form-group" style={{ marginBottom: 0, flex: '0 0 160px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Склад</label>
                <select className="form-select" value={stockFilter.warehouseId} onChange={(e) => setStockFilter({ ...stockFilter, warehouseId: e.target.value })} style={{ padding: '6px 10px', height: '36px' }}>
                  <option value="">Всі склади</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>На дату</label>
                <input type="date" className="form-input" value={stockFilter.date} onChange={(e) => setStockFilter({ ...stockFilter, date: e.target.value })} style={{ padding: '6px 10px', height: '36px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', height: '36px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                  <input type="checkbox" checked={stockFilter.nonZeroOnly} onChange={(e) => setStockFilter({ ...stockFilter, nonZeroOnly: e.target.checked })} />
                  Лише ненульові
                </label>
              </div>
            </>
          )}

          {activeTab === 'compare' && (
            <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', height: '36px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                <input type="checkbox" checked={compareFilter.nonZeroOnly} onChange={(e) => setCompareFilter({ ...compareFilter, nonZeroOnly: e.target.checked })} />
                Лише ненульові залишки
              </label>
            </div>
          )}

          {activeTab === 'move' && (
            <>
              <div className="form-group" style={{ marginBottom: 0, flex: '0 0 160px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Склад</label>
                <select className="form-select" value={moveFilter.warehouseId} onChange={(e) => setMoveFilter({ ...moveFilter, warehouseId: e.target.value })} style={{ padding: '6px 10px', height: '36px' }}>
                  <option value="">Всі</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: '1 1 150px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Товар</label>
                <select className="form-select" value={moveFilter.productId} onChange={(e) => setMoveFilter({ ...moveFilter, productId: e.target.value })} style={{ padding: '6px 10px', height: '36px' }}>
                  <option value="">Всі</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: '0 0 120px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Від</label>
                <input type="date" className="form-input" value={moveFilter.dateFrom} onChange={(e) => setMoveFilter({ ...moveFilter, dateFrom: e.target.value })} style={{ padding: '6px 10px', height: '36px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: '0 0 120px' }}>
                <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>До</label>
                <input type="date" className="form-input" value={moveFilter.dateTo} onChange={(e) => setMoveFilter({ ...moveFilter, dateTo: e.target.value })} style={{ padding: '6px 10px', height: '36px' }} />
              </div>
            </>
          )}

          <div>
            <button className="btn btn-primary" onClick={generateReport} disabled={loading} style={{ height: '36px', padding: '0 20px' }}>
              {loading ? '⏳' : '📊 Сформувати'}
            </button>
          </div>
        </div>
      </div>

      {/* Результат */}
      {reportData && (
        <div className="card">
          <div className="card-header">
            <h3>{getReportTitle()}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
                style={sortAsc ? { color: 'white' } : {}}
                onClick={() => setSortAsc(!sortAsc)}
                title="Сортувати від А до Я за назвою"
              >
                {sortAsc ? 'Сортування: А-Я' : 'Сортувати А-Я'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleExportExcel}>
                📥 Завантажити Excel (.csv)
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleExportPdf}>
                📄 Завантажити PDF
              </button>
            </div>
          </div>
          <div className="data-table-wrap">
            {sortedItems && sortedItems.length > 0 ? (
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    {reportData.columns?.map((col, i) => (
                      <th key={i}>
                        <ResizableHeader pageId={`reports-${activeTab}`} columnId={col}>
                          {col}
                        </ResizableHeader>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {reportData.columns?.map((col, colIndex) => (
                        <td key={colIndex} style={{
                          fontWeight: col === 'Всього' || col === 'Кількість' ? 700 : 400
                        }}>
                          {col === 'Дата' ? formatDate(row[col]) : (
                            (col === 'Кількість' || col === 'Всього' || warehouses.some(w => w.name === col)) 
                              ? formatQuantity(row[col], row.category, row['Товар'] || row['Назва']) 
                              : (row[col] ?? '—')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <p>Немає даних за обраними параметрами</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
