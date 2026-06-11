import { useState } from 'react';
import { toast } from 'sonner';
import { useProposalStore } from '../../store';
import type { Proposal, SellerId } from '../../types';
import {
  selectProposal,
  selectSelectedSeller,
  selectSettings,
  selectActiveCurrency,
  selectHistory,
} from '../../store/selectors';
import { useCurrencyConverter, useProposalCalculations } from '../../hooks/useCurrency';
import { sendToTelegram, sendToViber } from '../../utils/messaging';
import { SELLERS } from '../../config';

import { ClientInfoForm } from './ClientInfoForm';
import { SettingsPanel } from './SettingsPanel';
import { ProposalItemsTable } from './ProposalItemsTable';
import { ProposalSummary } from './ProposalSummary';
import { ProposalActions } from './ProposalActions';
import { TelegramModal } from '../TelegramModal';
import { ViberModal } from '../ViberModal';
import { SolarWizard } from '../SolarWizard';
import { DocumentGeneratorModal } from '../DocumentGeneratorModal';
import { PrintProposalTemplate } from './PrintProposalTemplate';

export function ProposalBuilderTable() {
  const proposal = useProposalStore(selectProposal);
  const selectedSeller = useProposalStore(selectSelectedSeller);
  const settings = useProposalStore(selectSettings);
  const activeCurrency = useProposalStore(selectActiveCurrency);
  const history = useProposalStore(selectHistory);

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

  // Порівнюємо поточну пропозицію зі збереженою в історії для виявлення незбережених змін
  const savedVersion = history.find((p) => p.id === proposal.id);
  const hasUnsavedChanges = (() => {
    if (proposal.status === 'draft') return false;
    if (!savedVersion) return true;

    if (proposal.clientName !== savedVersion.clientName) return true;
    if ((proposal.clientPhone || '') !== (savedVersion.clientPhone || '')) return true;
    if ((proposal.clientAddress || '') !== (savedVersion.clientAddress || '')) return true;
    if ((proposal.clientEmail || '') !== (savedVersion.clientEmail || '')) return true;
    if (proposal.vatMode !== savedVersion.vatMode) return true;
    if (proposal.markup !== savedVersion.markup) return true;
    if ((proposal.adjustment || 0) !== (savedVersion.adjustment || 0)) return true;
    if ((proposal.notes || '') !== (savedVersion.notes || '')) return true;
    if ((proposal.seller?.id || proposal.sellerId || '') !== (savedVersion.seller?.id || savedVersion.sellerId || '')) return true;
    if (proposal.currency !== savedVersion.currency) return true;

    if (proposal.rates?.usdToUah !== savedVersion.rates?.usdToUah) return true;
    if (proposal.rates?.eurToUah !== savedVersion.rates?.eurToUah) return true;

    const activeItems = proposal.items || [];
    const savedItems = savedVersion.items || [];
    if (activeItems.length !== savedItems.length) return true;

    for (let i = 0; i < activeItems.length; i++) {
      const a = activeItems[i];
      const s = savedItems[i];
      if (a.productId !== s.productId) return true;
      if (a.quantity !== s.quantity) return true;
      if (a.price !== s.price) return true;
      if (a.costPrice !== s.costPrice) return true;
      if (a.name !== s.name) return true;
      if ((a.description || '') !== (s.description || '')) return true;
      if (a.unit !== s.unit) return true;
    }

    return false;
  })();

  // Конвертовані товари для відображення
  const convertedItems = proposal.items.map((item: any) => {
    const displayCost = Math.round(convert(item.costPrice, 'USD', activeCurrency) * 100) / 100;
    const displayPrice = Math.round(convert(item.price, 'USD', activeCurrency) * 100) / 100;
    const quantity = item.quantity ?? 1;
    const displayCostSum = Math.round(displayCost * quantity * 100) / 100;
    const displayPriceSum = Math.round(displayPrice * quantity * 100) / 100;
    return {
      ...item,
      displayCost,
      displayPrice,
      displayCostSum,
      displayPriceSum,
    };
  });

  const displayCostSubtotal = convertedItems.reduce((sum, item) => sum + item.displayCostSum, 0);
  const displaySaleSubtotal = convertedItems.reduce((sum, item) => sum + item.displayPriceSum, 0);

  let displayVat = 0;
  let displayTotal = displaySaleSubtotal;

  if (proposal.vatMode === 'add') {
    displayVat = Math.round(displaySaleSubtotal * 0.2 * 100) / 100;
    displayTotal = displaySaleSubtotal + displayVat;
  } else if (proposal.vatMode === 'extract') {
    displayVat = Math.round((displaySaleSubtotal - (displaySaleSubtotal / 1.2)) * 100) / 100;
    displayTotal = displaySaleSubtotal;
  }

  const displayProfit = displaySaleSubtotal - displayCostSubtotal;
  const displayProfitPercent = displaySaleSubtotal > 0 ? (displayProfit / displaySaleSubtotal) * 100 : 0;

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      await refreshRates(true);
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
      
      {/* 1. Інтерактивний редактор комерційної пропозиції (ховається при друці) */}
      <div id="proposal-editor-container" className="no-print space-y-4 pb-24">
        <ClientInfoForm
          clientName={proposal.clientName}
          clientPhone={proposal.clientPhone || ''}
          clientAddress={proposal.clientAddress || ''}
          selectedSeller={selectedSeller}
          onUpdateField={(field, value) => updateProposalField(field as keyof Proposal, value)}
          onSetSeller={setSelectedSeller}
          proposalNumber={proposal.number || ''}
          status={proposal.status || 'draft'}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <SettingsPanel
          rates={proposal.rates || { usdToUah: settings.usdRate, eurToUah: settings.eurRate }}
          activeCurrency={activeCurrency}
          markup={proposal.markup}
          adjustment={proposal.adjustment || 0}
          isRefreshingRates={isRefreshingRates}
          onUpdateRates={(newRates) => updateProposalField('rates', newRates)}
          onSetActiveCurrency={setActiveCurrency}
          onUpdateMarkup={(markup) => updateProposalField('markup', markup)}
          onUpdateAdjustment={(adjustment) => updateProposalField('adjustment', adjustment)}
          onRefreshRates={handleRefreshRates}
          onApplyMarkup={applyProposalMarkupToItems}
          vatMode={proposal.vatMode || 'none'}
          onUpdateVatMode={(mode) => updateProposalField('vatMode', mode)}
          showCostPrices={settings.showCostPrices !== false}
          onToggleCostPrices={() => updateSettings({ showCostPrices: settings.showCostPrices === false })}
          useVatPrices={proposal.useVatPrices || false}
          onToggleUseVatPrices={() => updateProposalField('useVatPrices', !proposal.useVatPrices)}
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
          showCostPrices={settings.showCostPrices !== false}
        />

        <ProposalSummary
          itemsCount={proposal.items.length}
          costSubtotal={displayCostSubtotal}
          vatMode={proposal.vatMode || 'none'}
          vatAmount={displayVat}
          total={displayTotal}
          profit={displayProfit}
          profitPercent={displayProfitPercent}
          activeCurrency={activeCurrency}
          usdRate={proposal.rates?.usdToUah || settings.usdRate}
          eurRate={proposal.rates?.eurToUah || settings.eurRate}
          notes={proposal.notes || ''}
          onUpdateNotes={(notes) => updateProposalField('notes', notes)}
          showCostPrices={settings.showCostPrices !== false}
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
      </div>

      {/* 2. Преміальний та сучасний шаблон комерційної пропозиції для друку/PDF */}
      <PrintProposalTemplate
        proposal={proposal}
        selectedSeller={selectedSeller}
        activeCurrency={activeCurrency}
        convert={convert}
        saleSubtotal={saleSubtotal}
        vatAmount={proposal.vatAmount || 0}
        total={proposal.total}
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
