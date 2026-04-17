import { useState } from 'react';
import { toast } from 'sonner';
import { useProposalStore } from '../../store';
import type { Proposal, SellerId } from '../../types';
import {
  selectProposal,
  selectSelectedSeller,
  selectSettings,
  selectActiveCurrency,
} from '../../store/selectors';
import { useCurrencyConverter, useProposalCalculations } from '../../hooks/useCurrency';
import { sendToTelegram, sendToViber } from '../../utils/messaging';

import { ClientInfoForm } from './ClientInfoForm';
import { SettingsPanel } from './SettingsPanel';
import { ProposalItemsTable } from './ProposalItemsTable';
import { ProposalSummary } from './ProposalSummary';
import { ProposalActions } from './ProposalActions';
import { TelegramModal } from '../TelegramModal';
import { ViberModal } from '../ViberModal';
import { SolarWizard } from '../SolarWizard';
import { DocumentGeneratorModal } from '../DocumentGeneratorModal';

export function ProposalBuilderTable() {
  const proposal = useProposalStore(selectProposal);
  const selectedSeller = useProposalStore(selectSelectedSeller);
  const settings = useProposalStore(selectSettings);
  const activeCurrency = useProposalStore(selectActiveCurrency);

  // Actions
  const updateQuantity = useProposalStore((state) => state.updateQuantity);
  const updateItemCostPrice = useProposalStore((state) => state.updateItemCostPrice);
  const updateItemSalePrice = useProposalStore((state) => state.updateItemSalePrice);
  const updateItemField = useProposalStore((state) => state.updateItemField);
  const moveItemUp = useProposalStore((state) => state.moveItemUp);
  const moveItemDown = useProposalStore((state) => state.moveItemDown);
  const removeFromProposal = useProposalStore((state) => state.removeFromProposal);
  const updateProposalField = useProposalStore((state) => state.updateProposalField);
  const saveProposal = useProposalStore((state) => state.saveProposal);
  const clearProposal = useProposalStore((state) => state.clearProposal);
  const setSelectedSeller = useProposalStore((state) => state.setSelectedSeller);
  const updateSettings = useProposalStore((state) => state.updateSettings);
  const refreshRates = useProposalStore((state) => state.refreshRates);
  const applyProposalMarkupToItems = useProposalStore((state) => state.applyProposalMarkupToItems);
  const setActiveCurrency = useProposalStore((state) => state.setActiveCurrency);

  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showViberModal, setShowViberModal] = useState(false);
  const [showSolarWizard, setShowSolarWizard] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  const { convert, rates } = useCurrencyConverter(
    proposal.rates?.usdToUah || settings.usdRate,
    proposal.rates?.eurToUah || settings.eurRate
  );
  const { costSubtotal, saleSubtotal, profit, profitPercent } = useProposalCalculations(proposal.items);

  // Конвертовані товари для відображення
  const convertedItems = proposal.items.map((item: any) => ({
    ...item,
    displayCost: convert(item.costPrice, 'USD', activeCurrency),
    displayPrice: convert(item.price, 'USD', activeCurrency),
  }));

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      await refreshRates();
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleSave = async () => {
    const savePromise = saveProposal();
    
    toast.promise(savePromise, {
      loading: 'Синхронізація з Google Таблицею...',
      success: (success) => {
        if (success) return 'Пропозицію збережено та синхронізовано!';
        return 'Збережено локально, але сталася помилка хмарної синхронізації';
      },
      error: 'Помилка хмарної синхронізації (але збережено у журналі)',
    });
  };

  const handleClear = () => {
    if (confirm('Очистити поточну пропозицію?')) {
      clearProposal();
    }
  };

  const handleTelegramSend = async (format: 'text' | 'photo' | 'pdf') => {
    try {
      await sendToTelegram(proposal, format);
      toast.success('Відправлено в Telegram!');
    } catch (error) {
      console.error('Telegram send error:', error);
      toast.error(`Помилка: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    }
  };

  const handleViberSend = async (format: 'link' | 'photo' | 'pdf') => {
    try {
      await sendToViber(proposal, format);
      toast.success('Відправлено в Viber!');
    } catch (error) {
      console.error('Viber send error:', error);
      toast.error(`Помилка: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    }
  };

  // Обробники для конвертації цін назад в USD
  const handleUpdateCostPrice = (itemId: string, displayPrice: number) => {
    const usdPrice = convert(displayPrice, activeCurrency, 'USD');
    updateItemCostPrice(itemId, usdPrice);
  };

  const handleUpdateSalePrice = (itemId: string, displayPrice: number) => {
    const usdPrice = convert(displayPrice, activeCurrency, 'USD');
    updateItemSalePrice(itemId, usdPrice);
  };

  return (
    <div className="space-y-4" id="proposal-container">
      {/* Print-only header */}
      <div className="print-header" style={{ display: 'none' }}>
        <div className="print-logo-row">
          <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar" className="print-logo" />
          <div className="print-company">
            <p>Комерційна пропозиція</p>
            <div className="print-contact-info">
              <div>{proposal.seller?.office || ''}</div>
              <div>{proposal.seller?.phone || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <ClientInfoForm
        clientName={proposal.clientName}
        clientPhone={proposal.clientPhone || ''}
        clientEmail={proposal.clientEmail || ''}
        selectedSeller={selectedSeller}
        onUpdateField={(field, value) => updateProposalField(field as keyof Proposal, value)}
        onSetSeller={setSelectedSeller}
      />

      <SettingsPanel
        rates={proposal.rates || { usdToUah: settings.usdRate, eurToUah: settings.eurRate }}
        activeCurrency={activeCurrency}
        markup={proposal.markup}
        isRefreshingRates={isRefreshingRates}
        onUpdateRates={(newRates) => updateProposalField('rates', newRates)}
        onSetActiveCurrency={setActiveCurrency}
        onUpdateMarkup={(markup) => updateProposalField('markup', markup)}
        onRefreshRates={handleRefreshRates}
        onApplyMarkup={applyProposalMarkupToItems}
      />

      <ProposalItemsTable
        items={convertedItems}
        activeCurrency={activeCurrency}
        onUpdateQuantity={updateQuantity}
        onUpdateCostPrice={handleUpdateCostPrice}
        onUpdateSalePrice={handleUpdateSalePrice}
        onUpdateField={(itemId, field, value) => updateItemField(itemId, field as any, value)}
        onMoveUp={moveItemUp}
        onMoveDown={moveItemDown}
        onRemove={removeFromProposal}
        onAddManualItem={() => useProposalStore.getState().addManualItem()}
      />

      <ProposalSummary
        itemsCount={proposal.items.length}
        costSubtotal={costSubtotal}
        saleSubtotal={saleSubtotal}
        vatMode={proposal.vatMode || 'none'}
        vatAmount={proposal.vatAmount || 0}
        total={proposal.total}
        profit={profit}
        profitPercent={profitPercent}
        activeCurrency={activeCurrency}
        usdRate={settings.usdRate}
        eurRate={settings.eurRate}
        notes={proposal.notes || ''}
        onUpdateNotes={(notes) => updateProposalField('notes', notes)}
        onUpdateVatMode={(mode) => updateProposalField('vatMode', mode)}
        convert={convert}
      />

      <ProposalActions
        hasItems={proposal.items.length > 0}
        onSave={handleSave}
        onShowDocModal={() => setShowDocModal(true)}
        onShowTelegram={() => setShowTelegramModal(true)}
        onShowViber={() => setShowViberModal(true)}
        onShowSolarWizard={() => setShowSolarWizard(true)}
        onClear={handleClear}
      />

      {/* Модальні вікна */}
      <TelegramModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        onSend={handleTelegramSend}
      />
      <ViberModal
        isOpen={showViberModal}
        onClose={() => setShowViberModal(false)}
        onSend={handleViberSend}
      />
      <SolarWizard
        isOpen={showSolarWizard}
        onClose={() => setShowSolarWizard(false)}
      />
      <DocumentGeneratorModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        proposal={{
          ...proposal,
          currency: activeCurrency
        }}
      />
    </div>
  );
}
