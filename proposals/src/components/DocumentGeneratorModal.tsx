import { useState } from 'react';
import { X, FileText, Receipt, Package, Truck, Shield, Download, Printer } from 'lucide-react';
import { Proposal } from '../types';
import { printInvoice, printDeliveryNote } from '../utils/documents';
import { TTNModal } from './TTNModal';
import { WarrantyModal } from './WarrantyModal';
import { printTTNWithData, printWarrantyWithData } from '../utils/documents';

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  proposal: Proposal;
}

type DocumentType = 'proposal' | 'invoice' | 'expense' | 'waybill' | 'ttn' | 'warranty';

const documentTypes: { type: DocumentType; label: string; icon: any; description: string }[] = [
  { type: 'proposal', label: 'Комерційна пропозиція', icon: FileText, description: 'Офіційний бланк з логотипом' },
  { type: 'invoice', label: 'Рахунок', icon: Receipt, description: 'Рахунок на оплату' },
  { type: 'expense', label: 'Видаткова накладна', icon: Package, description: 'Документ видачі товару' },
  { type: 'ttn', label: 'ТТН', icon: Truck, description: 'Товарно-транспортна накладна' },
  { type: 'warranty', label: 'Гарантійний талон', icon: Shield, description: 'Гарантія на обладнання' },
];

export function DocumentGeneratorModal({ isOpen, onClose, onComplete, proposal }: DocumentGeneratorModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('proposal');
  const [showTTNModal, setShowTTNModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  const handleGenerate = async () => {
    try {
      // TTN та Warranty потребують додаткових даних
      if (selectedDoc === 'ttn') {
        setShowTTNModal(true);
        return;
      }

      if (selectedDoc === 'warranty') {
        setShowWarrantyModal(true);
        return;
      }

      // Інші документи - завжди ДРУК
      switch (selectedDoc) {
        case 'proposal':
          setTimeout(() => window.print(), 100);
          break;
        case 'invoice':
          printInvoice(proposal);
          break;
        case 'expense':
          printDeliveryNote(proposal);
          break;
      }
      
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Document generation error:', error);
      alert('Помилка при формуванні документа');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 text-white p-3.5 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5" />
              <h2 className="text-lg font-bold">Сформувати документ</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Document Type Selection */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                {documentTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedDoc(type)}
                    className={`p-2.5 rounded-lg border-2 transition text-left ${
                      selectedDoc === type
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-100 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${selectedDoc === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-gray-900 leading-tight">{label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-center">
              <p className="text-[10px] text-amber-800">
                Документ відкриється у новому вікні
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition font-medium"
            >
              Скасувати
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-1.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-xs font-bold shadow-md shadow-primary/20"
            >
              <Printer className="w-4 h-4" />
              ДРУК
            </button>
          </div>
        </div>
      </div>

      {/* TTN Modal */}
      {showTTNModal && (
        <TTNModal
          isOpen={showTTNModal}
          onClose={() => setShowTTNModal(false)}
          proposal={proposal}
          onPrint={(data) => printTTNWithData(proposal, data)}
          onComplete={() => {
            setShowTTNModal(false);
            onClose();
          }}
        />
      )}

      {/* Warranty Modal */}
      {showWarrantyModal && (
        <WarrantyModal
          isOpen={showWarrantyModal}
          onClose={() => setShowWarrantyModal(false)}
          proposal={proposal}
          onPrint={(data) => printWarrantyWithData(proposal, data)}
          onComplete={() => {
            setShowWarrantyModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
