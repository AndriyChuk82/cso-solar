import { useState } from 'react';
import { createBackup } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { Button } from '@cso/design-system';

/**
 * Управління резервними копіями. Лише для адміністратора.
 */
export default function Backups() {
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
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
