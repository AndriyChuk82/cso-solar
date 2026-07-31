import React, { useState } from 'react';
import { X, FileText, Receipt, Package, Truck, Shield, Printer } from 'lucide-react';
import { TTNModal } from './TTNModal';
import { WarrantyModal } from './WarrantyModal';
import { InvoiceModal } from './InvoiceModal';
import { printDeliveryNote, printTTNWithData, printWarrantyWithData, printInvoiceWithData } from '../utils/documents';

const documentTypes = [
  { type: 'warranty', label: 'Гарантійний талон', icon: Shield, description: 'Гарантія на обладнання (з серійними номерами)' },
  { type: 'expense', label: 'Видаткова накладна', icon: Package, description: 'Офіційний бланк видачі товару з печаткою' },
  { type: 'ttn', label: 'ТТН', icon: Truck, description: 'Товарно-транспортна накладна для доставки' },
  { type: 'invoice', label: 'Рахунок', icon: Receipt, description: 'Рахунок на оплату' },
];

export function DocumentGeneratorModal({ isOpen, onClose, onComplete, issueData }) {
  const [selectedDoc, setSelectedDoc] = useState('warranty');
  const [showTTNModal, setShowTTNModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    try {
      if (selectedDoc === 'invoice') {
        setShowInvoiceModal(true);
        return;
      }
      if (selectedDoc === 'ttn') {
        setShowTTNModal(true);
        return;
      }
      if (selectedDoc === 'warranty') {
        setShowWarrantyModal(true);
        return;
      }
      if (selectedDoc === 'expense') {
        printDeliveryNote(issueData);
        if (onComplete) onComplete();
        else onClose();
        return;
      }
    } catch (error) {
      console.error('Document generation error:', error);
      alert('Помилка при формуванні документа');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 text-white p-3.5 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5" />
              <h2 className="text-base font-bold">Сформувати документ (Склад)</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-2.5">
              {documentTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedDoc(type)}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedDoc === type
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-100 dark:border-slate-800 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedDoc === type ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-slate-100 leading-tight">{label}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-2.5 text-center">
              <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                Документ відкриється у новому вікні для друку або збереження в PDF
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition font-medium"
            >
              Скасувати
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-1.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              ДРУК
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          issueData={issueData}
          onPrint={(data) => printInvoiceWithData(issueData, data)}
          onComplete={() => {
            setShowInvoiceModal(false);
            if (onComplete) onComplete();
            else onClose();
          }}
        />
      )}

      {/* TTN Modal */}
      {showTTNModal && (
        <TTNModal
          isOpen={showTTNModal}
          onClose={() => setShowTTNModal(false)}
          issueData={issueData}
          onPrint={(data) => printTTNWithData(issueData, data)}
          onComplete={() => {
            setShowTTNModal(false);
            if (onComplete) onComplete();
            else onClose();
          }}
        />
      )}

      {/* Warranty Modal */}
      {showWarrantyModal && (
        <WarrantyModal
          isOpen={showWarrantyModal}
          onClose={() => setShowWarrantyModal(false)}
          issueData={issueData}
          onPrint={(data) => printWarrantyWithData(issueData, data)}
          onComplete={() => {
            setShowWarrantyModal(false);
            if (onComplete) onComplete();
            else onClose();
          }}
        />
      )}
    </>
  );
}
