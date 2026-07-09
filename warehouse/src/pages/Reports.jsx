import React, { useState, useEffect, useMemo } from 'react';
import { getWarehouses, getStockReport, getCompareReport, getMovementReport, getCatalog } from '../api/gasApi';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import { formatDate } from '../utils/dateUtils';
import { formatQuantity } from '../utils/formatUtils';
import CONFIG from '../config';
import ResizableHeader from '../components/ResizableHeader';
import { Button } from '@cso/design-system';

/**
 * Звіти та аналітика — 3 типи звітів з експортом Excel/PDF.
 */
export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

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

    return items.sort((a, b) => {
      const catA = String(a.category || 'Без категорії');
      const catB = String(b.category || 'Без категорії');
      if (catA !== catB) return catA.localeCompare(catB);
      const nameA = String(a['Товар'] || a['Назва'] || a['Назва категорії'] || '');
      const nameB = String(b['Товар'] || b['Назва'] || b['Назва категорії'] || '');
      
      const localeOptions = { numeric: true, sensitivity: 'base' };
      return sortAsc 
        ? nameA.localeCompare(nameB, undefined, localeOptions) 
        : nameB.localeCompare(nameA, undefined, localeOptions);
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
    <div style={{ padding: '0 4px' }}>
      {/* Шапка та Вкладки в один рядок */}
      <div className="page-header" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '12px',
        paddingBottom: '8px'
      }}>
        <h1 className="page-title" style={{ fontSize: '1.25rem', margin: 0 }}>📈 Звіти та аналітика</h1>
        
        {/* Вкладки */}
        <div style={{
          display: 'flex',
          gap: '2px',
          background: 'var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
          width: 'fit-content'
        }}>
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant="ghost"
              style={{
                background: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '0.8rem',
                padding: '6px 12px'
              }}
              onClick={() => { setActiveTab(tab.key); setReportData(null); }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Фільтри та дії в один рядок */}
      <div className="card" style={{ marginBottom: '10px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
          
          {/* Секція фільтрів зліва */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '8px', flexGrow: 1 }}>
            {activeTab === 'stock' && (
              <>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 160px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>Склад</label>
                  <select className="form-select" value={stockFilter.warehouseId} onChange={(e) => setStockFilter({ ...stockFilter, warehouseId: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }}>
                    <option value="">Всі склади</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 130px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>На дату</label>
                  <input type="date" className="form-input" value={stockFilter.date} onChange={(e) => setStockFilter({ ...stockFilter, date: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', height: '32px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                    <input type="checkbox" checked={stockFilter.nonZeroOnly} onChange={(e) => setStockFilter({ ...stockFilter, nonZeroOnly: e.target.checked })} />
                    Лише ненульові
                  </label>
                </div>
              </>
            )}

            {activeTab === 'compare' && (
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', height: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                  <input type="checkbox" checked={compareFilter.nonZeroOnly} onChange={(e) => setCompareFilter({ ...compareFilter, nonZeroOnly: e.target.checked })} />
                  Лише ненульові залишки
                </label>
              </div>
            )}

            {activeTab === 'move' && (
              <>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 140px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>Склад</label>
                  <select className="form-select" value={moveFilter.warehouseId} onChange={(e) => setMoveFilter({ ...moveFilter, warehouseId: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }}>
                    <option value="">Всі</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '1 1 150px', maxWidth: '300px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>Товар</label>
                  <select className="form-select" value={moveFilter.productId} onChange={(e) => setMoveFilter({ ...moveFilter, productId: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }}>
                    <option value="">Всі</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 115px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>Від</label>
                  <input type="date" className="form-input" value={moveFilter.dateFrom} onChange={(e) => setMoveFilter({ ...moveFilter, dateFrom: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '0 0 115px' }}>
                  <label style={{ fontSize: '0.7rem', marginBottom: '2px', fontWeight: 600 }}>До</label>
                  <input type="date" className="form-input" value={moveFilter.dateTo} onChange={(e) => setMoveFilter({ ...moveFilter, dateTo: e.target.value })} style={{ padding: '4px 8px', height: '32px', fontSize: '0.8rem' }} />
                </div>
              </>
            )}

            <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
              <Button variant="primary" onClick={generateReport} disabled={loading} loading={loading} style={{ height: '32px', padding: '0 12px', fontSize: '0.8rem' }}>
                {loading ? 'Формування...' : '📊 Сформувати'}
              </Button>
            </div>
          </div>

          {/* Кнопки Дій (справа, з'являються тільки після формування) */}
          {reportData && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '32px' }}>
              <button 
                className={`btn btn-sm ${sortAsc ? 'btn-primary' : 'btn-outline'}`}
                style={{ 
                  height: '32px', 
                  padding: '0 10px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  color: sortAsc ? 'white' : 'var(--text-secondary)',
                  borderColor: 'var(--border)'
                }}
                onClick={() => setSortAsc(!sortAsc)}
                title="Сортувати від А до Я за назвою"
              >
                {sortAsc ? 'Сортування: А-Я' : 'Сортувати А-Я'}
              </button>
              <Button variant="ghost" size="sm" onClick={handleExportExcel} style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                📥 Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportPdf} style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                📄 PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Результат */}
      {reportData && (
        <div className="card" style={{ padding: '4px', borderTop: 'none' }}>
          <div className="data-table-wrap" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            {sortedItems && sortedItems.length > 0 ? (
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    {reportData.columns?.map((col, i) => (
                      <th key={i} style={{ width: (col === 'Товар' || col === 'Назва') ? '100%' : '1px' }}>
                        <ResizableHeader pageId={`reports-${activeTab}`} columnId={col}>
                          {col}
                        </ResizableHeader>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((row, rowIndex) => {
                    const showCategory = rowIndex === 0 || sortedItems[rowIndex - 1].category !== row.category;
                    return (
                      <React.Fragment key={rowIndex}>
                        {showCategory && (
                          <tr className="category-group-header">
                            <td colSpan={reportData.columns?.length || 1} style={{ background: 'var(--bg-light)', fontWeight: 800, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--primary)', borderLeft: '3px solid var(--primary)' }}>
                              📁 {row.category || 'Без категорії'}
                            </td>
                          </tr>
                        )}
                        <tr key={rowIndex}>
                          {reportData.columns?.map((col, colIndex) => (
                            <td key={colIndex} style={{
                              fontWeight: col === 'Всього' || col === 'Кількість' ? 700 : 400,
                              textAlign: (col === 'Кількість' || col === 'Всього' || warehouses.some(w => w.name === col)) ? 'center' : 'left',
                              width: (col === 'Товар' || col === 'Назва') ? '100%' : '1px'
                            }}>
                              {col === 'Дата' ? formatDate(row[col]) : (
                                (col === 'Кількість' || col === 'Всього' || warehouses.some(w => w.name === col)) 
                                  ? formatQuantity(row[col], row.category, row['Товар'] || row['Назва']) 
                                  : (row[col] ?? '—')
                              )}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
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
