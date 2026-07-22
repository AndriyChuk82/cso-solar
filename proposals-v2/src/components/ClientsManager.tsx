import { useState, useEffect, useMemo } from 'react';
import { X, Users, Star, StarOff, Search, ChevronLeft, Edit2, Trash2, CheckCircle, Circle, Loader2, Plus, Download } from 'lucide-react';
import { useProposalStore } from '../store';
import type { RegularClient, ClientPriceEntry } from '../types';

interface ClientsManagerProps {
  onClose: () => void;
}

type View = 'list' | 'detail';

export function ClientsManager({ onClose }: ClientsManagerProps) {
  const {
    regularClients,
    allBuyers,
    clientPricesMap,
    clientsLoading,
    loadKpClients,
    loadAllBuyers,
    loadClientPrices,
    setClientKpFlag,
    saveClientPrice,
    removeClientPrice,
    addNewClient,
    syncAllHistory,
    history,
  } = useProposalStore();

  const [view, setView] = useState<View>('list');
  const [selectedClient, setSelectedClient] = useState<RegularClient | null>(null);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New Client modal state
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [syncingHistory, setSyncingHistory] = useState(false);

  useEffect(() => {
    loadAllBuyers();
  }, []);

  const displayList = useMemo(() => {
    const base = showAll ? allBuyers : regularClients;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q));
  }, [showAll, allBuyers, regularClients, search]);

  const clientPrices = selectedClient ? (clientPricesMap[selectedClient.id] || []) : [];

  const handleOpenClient = async (client: RegularClient) => {
    setSelectedClient(client);
    setView('detail');
    if (!clientPricesMap[client.id]) {
      await loadClientPrices(client.id);
    }
  };

  const handleToggleKpFlag = async (client: RegularClient) => {
    setTogglingId(client.id);
    await setClientKpFlag(client.id, !client.isKpClient);
    setTogglingId(null);
  };

  const handleStartEditPrice = (entry: ClientPriceEntry) => {
    setEditingPriceId(entry.id);
    setEditingValue(entry.price.toFixed(2));
  };

  const handleSavePrice = async (entry: ClientPriceEntry) => {
    const newPrice = parseFloat(editingValue.replace(',', '.'));
    if (isNaN(newPrice) || newPrice <= 0) return;
    setSavingPrice(true);
    await saveClientPrice(
      entry.buyerId,
      entry.productId,
      entry.productName,
      newPrice,
      entry.costPrice,
      'manual',
      undefined,
      undefined
    );
    setSavingPrice(false);
    setEditingPriceId(null);
  };

  const handleDeletePrice = async (entry: ClientPriceEntry) => {
    if (!window.confirm(`Видалити ціну для "${entry.productName.substring(0, 40)}"?`)) return;
    await removeClientPrice(entry.id, entry.buyerId);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    const created = await addNewClient(newClientName.trim(), newClientPhone.trim());
    setCreatingClient(false);
    if (created) {
      setNewClientName('');
      setNewClientPhone('');
      setIsAddingClient(false);
    } else {
      alert('Помилка створення клієнта');
    }
  };

  const handleSyncHistory = async () => {
    setSyncingHistory(true);
    try {
      const res = await syncAllHistory();
      if (res.clientsMatched === 0) {
        alert(
          '🔍 Проскановано історію КП.\n\nНе знайдено збігів між іменами клієнтів у КП та списком покупців з бази.\n\nПорада: Перевірте чи імена клієнтів у КП збігаються з іменами у списку "Всі клієнти".'
        );
      } else {
        alert(
          `✅ Успішна синхронізація!\n\n• Проскановано КП: ${res.proposalsProcessed}\n• Знайдено клієнтів: ${res.clientsMatched}\n• Оновлено/збережено цін: ${res.pricesSaved}`
        );
      }
    } catch (e: any) {
      alert(`Помилка синхронізації: ${e.message}`);
    } finally {
      setSyncingHistory(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-neutral-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-700 shrink-0">
          <div className="flex items-center gap-3">
            {view === 'detail' && (
              <button
                onClick={() => { setView('list'); setSelectedClient(null); setEditingPriceId(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Users className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {view === 'list' ? 'Постійні клієнти' : selectedClient?.name}
              </h2>
              {view === 'detail' && selectedClient?.phone && (
                <p className="text-xs text-gray-500 dark:text-neutral-400">{selectedClient.phone}</p>
              )}
              {view === 'list' && (
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {regularClients.length} КП-клієнтів
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-neutral-800 shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук клієнта..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowAll((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  showAll
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {showAll ? <Users className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                {showAll ? 'Всі клієнти' : 'КП-клієнти'}
              </button>
              <button
                onClick={() => setIsAddingClient(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Новий клієнт</span>
              </button>
              <button
                onClick={handleSyncHistory}
                disabled={syncingHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm disabled:opacity-50"
                title="Зімпортувати персональні ціни з усіх збережених КП в історії"
              >
                {syncingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Імпорт з КП</span>
              </button>
            </div>

            {/* Modal for adding a new client */}
            {isAddingClient && (
              <form onSubmit={handleCreateClient} className="flex flex-wrap items-center gap-3 px-6 py-3 bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/50">
                <input
                  autoFocus
                  type="text"
                  placeholder="Назва / ПІБ клієнта *"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="flex-1 min-w-[180px] px-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-neutral-900 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Телефон (необов'язково)"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-44 px-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-neutral-900 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={creatingClient || !newClientName.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  {creatingClient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Зберегти
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingClient(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Table */}
            <div className="overflow-y-auto flex-1">
              {clientsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
              ) : displayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Users className="w-10 h-10 opacity-30" />
                  <p className="text-sm">{showAll ? 'Клієнтів не знайдено' : 'Немає КП-клієнтів. Увімкніть "Всі клієнти" щоб додати.'}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-neutral-800/80 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Клієнт</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Телефон</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Цін</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">КП</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {displayList.map((client) => {
                      const priceCount = (clientPricesMap[client.id] || []).length;
                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer group"
                          onClick={() => handleOpenClient(client)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="font-semibold text-gray-800 dark:text-white">{client.name}</div>
                            {client.notes && (
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">{client.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 dark:text-neutral-400 hidden sm:table-cell">
                            {client.phone || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {priceCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                {priceCount}
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-neutral-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleKpFlag(client)}
                              disabled={togglingId === client.id}
                              className={`p-1.5 rounded-lg transition-all ${
                                client.isKpClient
                                  ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                  : 'text-gray-300 dark:text-neutral-600 hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                              }`}
                              title={client.isKpClient ? 'Прибрати з КП-клієнтів' : 'Додати до КП-клієнтів'}
                            >
                              {togglingId === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : client.isKpClient ? (
                                <Star className="w-4 h-4 fill-current" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenClient(client); }}
                              className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-all"
                            >
                              Ціни →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedClient && (
          <div className="overflow-y-auto flex-1">
            {!clientPricesMap[selectedClient.id] ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : clientPrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Circle className="w-10 h-10 opacity-30" />
                <p className="text-sm">Немає збережених цін</p>
                <p className="text-xs">Ціни збережуться автоматично після збереження КП для цього клієнта</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-neutral-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Товар</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Ціна</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Джерело</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider hidden md:table-cell">Оновлено</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {clientPrices.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-800 dark:text-white text-xs leading-snug">
                          {entry.productName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{entry.productId.substring(0, 20)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingPriceId === entry.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              autoFocus
                              type="number"
                              step="0.01"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSavePrice(entry);
                                if (e.key === 'Escape') setEditingPriceId(null);
                              }}
                              className="w-20 text-right px-2 py-1 text-sm border border-amber-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white dark:bg-neutral-900 text-gray-800 dark:text-white"
                            />
                            <button
                              onClick={() => handleSavePrice(entry)}
                              disabled={savingPrice}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            >
                              {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-800 dark:text-white tabular-nums">
                            ${entry.price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {entry.source === 'kp' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                            📄 КП {entry.sourceKpNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                            ✏️ Вручну
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-neutral-500 hidden md:table-cell">
                        {formatDate(entry.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEditPrice(entry)}
                            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Редагувати ціну"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(entry)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Видалити"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-neutral-800 shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-neutral-500">
            {view === 'list'
              ? '⭐ = КП-клієнт · Ціни зберігаються в хмарі (Supabase)'
              : `${clientPrices.length} цін · Оновлюються автоматично при збереженні КП`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
