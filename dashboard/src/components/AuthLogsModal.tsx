import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Search, 
  RefreshCw, 
  X, 
  Laptop, 
  Globe 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export interface AuthLogItem {
  id: string;
  username: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  ip_address: string;
  user_agent: string;
  failure_reason?: string;
  created_at: string;
}

interface AuthLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseUserAgent(ua: string): string {
  if (!ua || ua === 'unknown') return 'Невідомий пристрій';
  let os = 'Пристрій';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = '';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return `${os}${browser ? ' • ' + browser : ''}`;
}

export function AuthLogsModal({ isOpen, onClose }: AuthLogsModalProps) {
  const [logs, setLogs] = useState<AuthLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'FAILED' | 'SUCCESS' | 'BLOCKED'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching auth logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch auth logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchUsername = log.username.toLowerCase().includes(term);
      const matchIp = (log.ip_address || '').toLowerCase().includes(term);
      const matchReason = (log.failure_reason || '').toLowerCase().includes(term);
      if (!matchUsername && !matchIp && !matchReason) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Журнал авторизацій (Аудит безпеки)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Лог спроб входу в систему (успішних, неуспішних та заблокованих)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              title="Оновити логи"
              className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Пошук за логіном або IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Всі ({logs.length})
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'FAILED'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-red-500'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Невірні ({logs.filter(l => l.status === 'FAILED').length})
            </button>
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'BLOCKED'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Заблоковані ({logs.filter(l => l.status === 'BLOCKED').length})
            </button>
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Успішні ({logs.filter(l => l.status === 'SUCCESS').length})
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="font-semibold text-sm">Записів логів не знайдено</p>
              <p className="text-xs mt-1 text-slate-500">Спробуйте змінити пошуковий фільтр.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Дата та час</th>
                    <th className="pb-3 px-3">Статус</th>
                    <th className="pb-3 px-3">Користувач / Логін</th>
                    <th className="pb-3 px-3">IP-адреса</th>
                    <th className="pb-3 px-3">Пристрій</th>
                    <th className="pb-3 px-3">Причина відмови</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredLogs.map(log => {
                    const isSuccess = log.status === 'SUCCESS';
                    const isBlocked = log.status === 'BLOCKED';
                    
                    return (
                      <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Time */}
                        <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {new Date(log.created_at).toLocaleString('uk-UA')}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Успішно
                            </span>
                          ) : isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                              <AlertOctagon className="w-3 h-3" /> Заблоковано
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold">
                              <XCircle className="w-3 h-3" /> Помилка входу
                            </span>
                          )}
                        </td>

                        {/* Username */}
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {log.username}
                        </td>

                        {/* IP Address */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {log.ip_address || '—'}
                          </span>
                        </td>

                        {/* User Agent */}
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-slate-400" />
                            {parseUserAgent(log.user_agent)}
                          </span>
                        </td>

                        {/* Failure Reason */}
                        <td className="py-3 px-3 text-slate-400 italic">
                          {log.failure_reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs text-slate-500">
          <span>Відображено {filteredLogs.length} записів</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Закрити
          </button>
        </div>

      </div>
    </div>
  );
}
