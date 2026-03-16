import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProposals, deleteProposal } from '../api/gasApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

/**
 * Сторінка списку комерційних пропозицій.
 */
export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      const result = await getProposals();
      if (result?.success) {
        setProposals(result.proposals || []);
      } else {
        showToast(result?.error || 'Помилка завантаження КП', 'error');
      }
    } catch (err) {
      console.error('Помилка завантаження КП:', err);
      showToast('Помилка підключення до сервера', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Ви впевнені, що хочете видалити цю КП?')) return;
    
    try {
      const result = await deleteProposal(id);
      if (result?.success) {
        showToast('КП видалено', 'success');
        setProposals(prev => prev.filter(p => p.id !== id));
      } else {
        showToast(result?.error || 'Помилка видалення', 'error');
      }
    } catch (err) {
      showToast('Помилка при видаленні', 'error');
    }
  }

  const filteredProposals = proposals.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.clientName || '').toLowerCase().includes(term) ||
      (p.id || '').toLowerCase().includes(term) ||
      (p.comment || '').toLowerCase().includes(term)
    );
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Чернетка': return 'badge-secondary';
      case 'Надіслано': return 'badge-info';
      case 'Прийнято': return 'badge-success';
      case 'Відхилено': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 Комерційні пропозиції</h1>
          <p className="page-subtitle">Перегляд та керування комерційними пропозиціями</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/proposals/new')}>
          ➕ Створити КП
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Пошук за клієнтом або ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', minWidth: '300px' }}
            />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Всього: {filteredProposals.length}
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p>Завантаження пропозицій...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
              <p>{searchTerm ? 'Нічого не знайдено за вашим запитом' : 'Список КП порожній'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Клієнт</th>
                    <th>Сума</th>
                    <th>Статус</th>
                    <th>Автор</th>
                    <th style={{ textAlign: 'right' }}>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((p) => (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{p.date}</td>
                      <td style={{ fontWeight: 600 }}>{p.clientName}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>
                          {new Intl.NumberFormat('uk-UA').format(p.totalAmount)} грн
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(p.status)}`}>
                          {p.status || 'Чернетка'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {p.userEmail?.split('@')[0] || p.user}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => window.open(`/proposals/view/${p.id}`, '_blank')}
                            title="Переглянути (друк)"
                          >
                            👁️
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => navigate(`/proposals/edit/${p.id}`)}
                            title="Редагувати"
                          >
                            ✏️
                          </button>
                          {(user?.isAdmin || p.userEmail === user?.email) && (
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => handleDelete(p.id)}
                              title="Видалити"
                              style={{ color: 'var(--danger)' }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
