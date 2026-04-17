import { useState, useEffect } from 'react';
import { History as HistoryIcon, X, Eye, Trash2, FileText, RefreshCw } from 'lucide-react';
import { useProposalStore } from '../store';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/calculations';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { history, loadProposal, deleteProposal, syncHistory } = useProposalStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Автоматична синхронізація при відкритті модального вікна
  useEffect(() => {
    if (isOpen) {
      handleSync();
    }
  }, [isOpen]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncHistory();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoad = (id: string) => {
    loadProposal(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm('Видалити цю пропозицію?')) {
      deleteProposal(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
    }
  };

  const selectedProposal = history.find(p => p.id === selectedId);

  // Сортуємо історію від новіших до старих
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    return dateB - dateA; // Від новіших до старих
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">
              Історія пропозицій ({history.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
                isSyncing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title="Синхронізувати з Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Синхронізація...' : 'Синхронізувати'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Список */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            {sortedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Історія порожня
                </h3>
                <p className="text-gray-600">
                  Збережені пропозиції з'являться тут
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {sortedHistory.map((proposal) => (
                  <div
                    key={proposal.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedId === proposal.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedId(proposal.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {proposal.number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {proposal.clientName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {formatCurrency(proposal.total, proposal.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {proposal.items.length} товарів
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(proposal.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Деталі */}
          <div className="w-1/2 overflow-y-auto">
            {selectedProposal ? (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                    {selectedProposal.number}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    <div>Клієнт: {selectedProposal.clientName}</div>
                    {selectedProposal.clientPhone && (
                      <div>Телефон: {selectedProposal.clientPhone}</div>
                    )}
                    {selectedProposal.clientEmail && (
                      <div>Email: {selectedProposal.clientEmail}</div>
                    )}
                    <div>Дата: {formatDateTime(selectedProposal.date)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-200 mb-2">Товари</h4>
                  <div className="space-y-2">
                    {selectedProposal.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-slate-800/50 rounded border border-transparent dark:border-slate-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-slate-200">{item.product.name}</div>
                          <div className="text-gray-500 dark:text-slate-500 text-xs">
                            {item.quantity} {item.product.unit} ×{' '}
                            {formatCurrency(item.price, selectedProposal.currency)}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-slate-100">
                          {formatCurrency(item.total, selectedProposal.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-400">Підсумок:</span>
                      <span className="font-medium text-gray-900 dark:text-slate-200">
                        {formatCurrency(selectedProposal.subtotal, selectedProposal.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-400">
                        Націнка ({selectedProposal.markup}%):
                      </span>
                      <span className="font-medium text-gray-900 dark:text-slate-200">
                        {formatCurrency(
                          (selectedProposal.subtotal * selectedProposal.markup) / 100,
                          selectedProposal.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-800">
                      <span className="font-semibold text-gray-900 dark:text-slate-200">Всього:</span>
                      <span className="font-bold text-lg text-primary dark:text-blue-400">
                        {formatCurrency(selectedProposal.total, selectedProposal.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedProposal.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Примітки</h4>
                    <p className="text-sm text-gray-600">{selectedProposal.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleLoad(selectedProposal.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    Відкрити
                  </button>
                  <button
                    onClick={() => handleDelete(selectedProposal.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    title="Видалити"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Виберіть пропозицію для перегляду</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Історія"
      >
        <HistoryIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Історія</span>
      </button>
      <HistoryModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
