import { useState } from 'react';
import { createBackup } from '../api/gasApi';
import { runMigration } from '../api/migration';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';
import { supabase } from '../api/supabaseClient';

/**
 * Управління резервними копіями. Лише для адміністратора.
 */
export default function Backups() {
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  async function handleBackup() {
    if (!confirm('Створити резервну копію зараз?')) return;
    setCreating(true);
    setLastResult(null);
    try {
      const result = await createBackup();
      setLastResult(result);
      if (result?.success) {
        showToast('Резервну копію успішно створено', 'success');
      } else {
        showToast(result?.error || 'Помилка створення', 'error');
      }
    } catch (err) {
      console.error('Помилка:', err);
      setLastResult({ success: false, error: 'Помилка підключення' });
      showToast('Помилка підключення', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleMigrate() {
    if (!confirm('Це скопіює ВСІ дані з Google Sheets у Supabase. Ви впевнені?')) return;
    setMigrating(true);
    try {
      const result = await runMigration();
      if (result.success) {
        showToast('Міграція завершена успішно!', 'success');
      } else {
        showToast(result.error || 'Помилка міграції', 'error');
      }
    } catch (err) {
      console.error('Migration error:', err);
      showToast('Критична помилка міграції', 'error');
    } finally {
      setMigrating(false);
    }
  }

  async function handleDownloadLocal() {
    setCreating(true);
    try {
      showToast('Збір даних з бази...', 'info');
      
      // Завантажуємо всі основні таблиці паралельно
      const [
        { data: products },
        { data: warehouses },
        { data: operations },
        { data: categories }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('operations').select('*'),
        supabase.from('categories').select('*')
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        tables: {
          products: products || [],
          warehouses: warehouses || [],
          operations: operations || [],
          categories: categories || []
        }
      };

      // Створюємо Blob і посилання для завантаження
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `warehouse_full_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Файл успішно завантажено на ваш ПК', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Помилка при зборі даних', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💾 Резервні копії</h1>
          <p className="page-subtitle">Управління резервним копіюванням даних</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <span>ℹ️</span>
            <div>
              <strong>Автоматичне копіювання:</strong> Щодня о 23:59 система створює резервну копію
              всіх залишків і операцій за день у форматі Excel (.xlsx) на Google Drive.
              Зберігаються останні 90 копій.
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleBackup}
            disabled={creating}
            loading={creating}
          >
            {creating ? 'Створення копії...' : '💾 Зберегти резервну копію зараз'}
          </Button>

          {lastResult && (
            <div className={`alert ${lastResult.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '16px' }}>
              <span>{lastResult.success ? '✅' : '❌'}</span>
              <div>
                {lastResult.success
                  ? `Копію створено: ${lastResult.fileName || 'backup.xlsx'}`
                  : `Помилка: ${lastResult.error || 'Невідома помилка'}`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px', border: '1px solid #10b981' }}>
        <div className="card-header" style={{ background: '#ecfdf5' }}>
          <h3>💻 Локальна копія (Пряме завантаження)</h3>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            Це завантажить ВСІ дані з Supabase (Товари, Склади, Операції) у один JSON-файл прямо на ваш комп'ютер. 
            Це найшвидший спосіб зробити бекап без використання Google Drive.
          </p>
          <Button
            variant="secondary"
            onClick={handleDownloadLocal}
            disabled={creating}
          >
            📥 Завантажити повну копію на ПК (.json)
          </Button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px', border: '1px solid #3b82f6' }}>
        <div className="card-header" style={{ background: '#f0f9ff' }}>
          <h3>🚀 Міграція на Supabase</h3>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            Це перенесе всі Товари, Склади та Історію операцій у базу даних Supabase для прискорення роботи модуля.
            <strong> Переконайтеся, що ви заповнили ключі в .env.local!</strong>
          </p>
          <Button
            variant="secondary"
            onClick={handleMigrate}
            disabled={migrating}
            loading={migrating}
          >
            {migrating ? 'Міграція триває...' : '📥 Запустити міграцію даних'}
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Інформація</h3>
        </div>
        <div className="card-body">
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '200px' }}>Час бекапу</td>
                <td>Щодня о 23:59</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Формат</td>
                <td>Excel (.xlsx)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Вміст</td>
                <td>Залишки на кінець дня + Журнал операцій за день по кожному складу</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Зберігання</td>
                <td>Google Drive (останні 90 копій)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Назва файлу</td>
                <td><code>backup_ДД.ММ.РРРР.xlsx</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
