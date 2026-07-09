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
    nonZeroOnly: false
  });
  const [compareFilter, setCompareFilter] = useState({ nonZeroOnly: false });
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
    { key: 'stock', label: 'Залишки по складу' },
    { key: 'compare', label: 'Порівняння складів' },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Панель керування: Вкладки + Сформувати поруч */}
      <div className="card" style={{ marginBottom: '8px', padding: '8px 12px' }}>
        {/* Рядок 1: Вкладки та Кнопка Сформувати поруч */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: activeTab === 'stock' ? '8px' : '0' }}>
          {/* Вкладки */}
          <div style={{
            display: 'flex',
            gap: '2px',
            background: 'var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
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
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  height: '26px'
                }}
                onClick={() => { setActiveTab(tab.key); setReportData(null); }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Кнопка дії поруч */}
          <Button variant="primary" onClick={generateReport} disabled={loading} loading={loading} style={{ height: '28px', padding: '0 12px', fontSize: '0.75rem', fontWeight: 600 }}>
            {loading ? 'Формування...' : '📊 Сформувати'}
          </Button>
        </div>

        {/* Рядок 2: Фільтри (під кнопкою Залишки по складу) */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Склад:</span>
              <select className="form-select" value={stockFilter.warehouseId} onChange={(e) => setStockFilter({ ...stockFilter, warehouseId: e.target.value })} style={{ padding: '2px 6px', height: '28px', fontSize: '0.75rem', width: '150px' }}>
                <option value="">Всі склади</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Дата:</span>
              <input type="date" className="form-input" value={stockFilter.date} onChange={(e) => setStockFilter({ ...stockFilter, date: e.target.value })} style={{ padding: '2px 6px', height: '28px', fontSize: '0.75rem', width: '115px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Результат */}
      {reportData && (
        <div className="card" style={{ padding: '4px', borderTop: 'none' }}>
          <div className="data-table-wrap" style={{ maxHeight: 'calc(100vh - 170px)', overflowY: 'auto' }}>
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
