import { useState } from 'react';
import { Settings as SettingsIcon, X, Save, RefreshCw } from 'lucide-react';
import { useProposalStore } from '../store';
import { CONFIG } from '../config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, loadProducts, loading, refreshRates } = useProposalStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  const handleFetchRates = async () => {
    setIsUpdatingRates(true);
    try {
      await refreshRates();
      // Оновлюємо локальні налаштування з нових курсів зі store
      const newSettings = useProposalStore.getState().settings;
      setLocalSettings(newSettings);
      alert('✅ Курси валют успішно оновлено з Goverla!');
    } catch (e) {
      alert('❌ Помилка при оновленні курсів');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      await loadProducts();
      alert('✅ Каталог товарів та ціни успішно оновлено!');
    } catch (e) {
      alert('❌ Помилка при оновленні каталогу');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Налаштування</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Курси валют */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Курси валют</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USD → UAH
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.usdRate}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      usdRate: parseFloat(e.target.value) || CONFIG.DEFAULT_USD_UAH,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EUR → UAH
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.eurRate}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      eurRate: parseFloat(e.target.value) || CONFIG.DEFAULT_EUR_UAH,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleFetchRates}
              disabled={isUpdatingRates}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isUpdatingRates ? 'animate-spin' : ''}`} />
              {isUpdatingRates ? 'Оновлення курсів...' : 'Оновити курси з Goverla'}
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Автоматично завантажує актуальні курси валют з обмінника Goverla
            </p>
          </div>

          {/* Націнка за замовчуванням */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Націнка</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Націнка за замовчуванням (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localSettings.defaultMarkup}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    defaultMarkup: parseFloat(e.target.value) || CONFIG.DEFAULT_MARKUP,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Відображення */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Відображення</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.showPrices}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      showPrices: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">Показувати ціни в каталозі</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      autoSave: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-gray-700">Автоматичне збереження</span>
              </label>
            </div>
          </div>

          {/* Telegram */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Telegram</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={localSettings.telegramBotToken || ''}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      telegramBotToken: e.target.value,
                    })
                  }
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={localSettings.telegramChatId || ''}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      telegramChatId: e.target.value,
                    })
                  }
                  placeholder="123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 Для отримання Chat ID напишіть боту <span className="font-mono">@userinfobot</span> в Telegram
                </p>
              </div>
            </div>
          </div>

          {/* Інформація */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Інформація</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Курси валют використовуються для конвертації цін</li>
              <li>• Націнка додається до підсумкової суми пропозиції</li>
              <li>• Налаштування зберігаються локально в браузері</li>
            </ul>
          </div>

          {/* Системні дії */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 text-red-600">Системні дії</h3>
            <button
              onClick={handleForceUpdate}
              disabled={isUpdating || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isUpdating || loading ? 'animate-spin' : ''}`} />
              {isUpdating || loading ? 'Оновлення даних...' : 'Примусово оновити прайс із Google Sheets'}
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Це оновить список всіх товарів та актуальні ліміти/ціни з основного прайсу
            </p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-700">База товарів</div>
                <div className="text-xs text-gray-500">Примусове оновлення каталогу з Google Sheets</div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('cso-products-cache');
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <RefreshCw size={14} />
                Оновити каталог
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold"
          >
            <Save className="w-5 h-5" />
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        title="Налаштування"
      >
        <SettingsIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Налаштування</span>
      </button>
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
