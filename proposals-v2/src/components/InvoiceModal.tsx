import { useState, useEffect } from 'react';
import { X, Printer, Building2, CreditCard, MapPin, Phone, Mail, FileText, Calendar } from 'lucide-react';
import { Proposal } from '../types';
import { useProposalStore } from '../store';

export interface InvoiceData {
  buyerName: string;
  buyerTaxId: string;
  buyerIban: string;
  buyerBank: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  includeStamp: boolean;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  onPrint: (data: InvoiceData) => void;
  onComplete?: () => void;
}

export function InvoiceModal({ isOpen, onClose, proposal, onPrint, onComplete }: InvoiceModalProps) {
  const updateProposalField = useProposalStore((state) => state.updateProposalField);

  const defaultInvoiceNum = (proposal.number || '').replace('КП-', 'РФ-') || `РФ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`;

  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxId, setBuyerTaxId] = useState('');
  const [buyerIban, setBuyerIban] = useState('');
  const [buyerBank, setBuyerBank] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [includeStamp, setIncludeStamp] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setBuyerName(proposal.clientName || '');
      setBuyerTaxId((proposal as any).clientTaxId || '');
      setBuyerIban((proposal as any).clientIban || '');
      setBuyerBank((proposal as any).clientBank || '');
      setBuyerAddress(proposal.clientAddress || '');
      setBuyerPhone(proposal.clientPhone || '');
      setBuyerEmail(proposal.clientEmail || '');
      setInvoiceNumber(defaultInvoiceNum);
      setInvoiceDate(proposal.date ? proposal.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setIncludeStamp(true);
    }
  }, [isOpen, proposal]);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Зберігаємо внесені реквізити в активну КП
    if (buyerName !== proposal.clientName) updateProposalField('clientName', buyerName);
    if (buyerPhone !== proposal.clientPhone) updateProposalField('clientPhone', buyerPhone);
    if (buyerEmail !== proposal.clientEmail) updateProposalField('clientEmail', buyerEmail);
    if (buyerAddress !== proposal.clientAddress) updateProposalField('clientAddress', buyerAddress);
    updateProposalField('clientTaxId' as any, buyerTaxId);
    updateProposalField('clientIban' as any, buyerIban);
    updateProposalField('clientBank' as any, buyerBank);

    const data: InvoiceData = {
      buyerName: buyerName.trim() || '____________________',
      buyerTaxId: buyerTaxId.trim(),
      buyerIban: buyerIban.trim(),
      buyerBank: buyerBank.trim(),
      buyerAddress: buyerAddress.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail.trim(),
      invoiceNumber: invoiceNumber.trim() || defaultInvoiceNum,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-100 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-snug">Реквізити контрагента для Рахунку</h2>
              <p className="text-[11px] text-amber-100 font-medium">Заповніть дані покупця для відображення у бланку</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Контрагент (Назва / ПІБ) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              Назва контрагента (Покупець) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="ТОВ 'Сонячні Системи' або ФОП Коваль І.І."
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Grid: ЄДРПОУ / ІПН + IBAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Код ЄДРПОУ / ІПН
              </label>
              <input
                type="text"
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(e.target.value)}
                placeholder="41234567 або 1234567890"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                Розрахунковий рахунок (IBAN)
              </label>
              <input
                type="text"
                value={buyerIban}
                onChange={(e) => setBuyerIban(e.target.value)}
                placeholder="UA123456789000000260012345678"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Банк покупця */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              Обслуговуючий банк покупця
            </label>
            <input
              type="text"
              value={buyerBank}
              onChange={(e) => setBuyerBank(e.target.value)}
              placeholder="АТ КБ 'ПриватБанк' або АТ 'Укргазбанк'"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Юридична / фактична адреса */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              Юридична / Фактична адреса
            </label>
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="м. Київ, вул. Хрещатик, буд. 10"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Grid: Телефон + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                Телефон покупця
              </label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="+380..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                Email покупця
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Grid: Номер рахунку + Дата */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Номер рахунку-фактури
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="РФ-001"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Дата виписки рахунку
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Checkbox: Додати печатку та підпис */}
          <div className="flex items-center gap-2.5 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl">
            <input
              type="checkbox"
              id="invoiceIncludeStamp"
              checked={includeStamp}
              onChange={(e) => setIncludeStamp(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer accent-amber-600"
            />
            <label htmlFor="invoiceIncludeStamp" className="text-xs font-semibold text-amber-950 dark:text-amber-200 cursor-pointer select-none">
              Додати печатку та підпис продавця у рахунок
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition text-xs font-bold shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            ДРУК РАХУНКУ
          </button>
        </div>
      </div>
    </div>
  );
}
