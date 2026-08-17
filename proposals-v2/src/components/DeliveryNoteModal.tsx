import { useState, useEffect } from 'react';
import { X, Printer, Package, User, Calendar, DollarSign } from 'lucide-react';
import { Proposal } from '../types';
import { useProposalStore } from '../store';
import { DeliveryNoteData } from '../utils/documents';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onPrint: (data: DeliveryNoteData) => void;
  onComplete?: () => void;
}

export function DeliveryNoteModal({ isOpen, onClose, proposal, onPrint, onComplete }: DeliveryNoteModalProps) {
  const updateProposalField = useProposalStore((state) => state.updateProposalField);

  const defaultDnNum = (proposal.number || '').replace('КП-', 'ВН-') || `ВН-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;

  const [buyerName, setBuyerName] = useState('');
  const [dnNumber, setDnNumber] = useState('');
  const [dnDate, setDnDate] = useState('');
  const [showPrices, setShowPrices] = useState(true);
  const [includeStamp, setIncludeStamp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBuyerName(proposal.clientName || '');
      setDnNumber(defaultDnNum);
      setDnDate(proposal.date ? proposal.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setShowPrices(true);
      setIncludeStamp(false);
    }
  }, [isOpen, proposal]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const safeTrim = (val: any) => String(val || '').trim();
    const nameStr = safeTrim(buyerName);
    const numStr = safeTrim(dnNumber);

    if (nameStr !== proposal.clientName) {
      updateProposalField('clientName', nameStr);
    }

    const data: DeliveryNoteData = {
      buyerName: nameStr || '____________________',
      dnNumber: numStr || defaultDnNum,
      dnDate: dnDate || new Date().toISOString().split('T')[0],
      showPrices,
      includeStamp,
    };

    onPrint(data);
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Видаткова накладна</h3>
              <p className="text-xs text-amber-100">Налаштування друку видаткової накладної</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition text-amber-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                Номер накладної
              </label>
              <input
                type="text"
                value={dnNumber}
                onChange={(e) => setDnNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-800 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Дата
              </label>
              <input
                type="date"
                value={dnDate}
                onChange={(e) => setDnDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-800 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Buyer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              Покупець (Клієнт)
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="ФОП / Назва ТОВ / ПІБ Клієнта"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-slate-800 dark:text-white font-medium"
            />
          </div>

          {/* Print Options */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Параметри друку</h4>

            {/* Show Prices Toggle */}
            <div
              className="flex items-center justify-between p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl cursor-pointer hover:bg-amber-50 transition"
              onClick={() => setShowPrices(!showPrices)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Друкувати ціни та суми на товар</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Відображати колонки "Ціна", "Сума" та загальний підсумок</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-amber-600 rounded-md focus:ring-amber-500 border-gray-300 cursor-pointer"
              />
            </div>

            {/* Include Stamp Toggle */}
            <div
              className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200/60 dark:border-slate-700/60 rounded-xl cursor-pointer hover:bg-gray-100/60 transition"
              onClick={() => setIncludeStamp(!includeStamp)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Додати печатку та підпис продавця</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Автоматично підставити факсиміле та печатку</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeStamp}
                onChange={(e) => setIncludeStamp(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 text-amber-600 rounded-md focus:ring-amber-500 border-gray-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            Скасувати
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition text-sm"
          >
            <Printer className="w-4 h-4" />
            ДРУК
          </button>
        </div>
      </div>
    </div>
  );
}
