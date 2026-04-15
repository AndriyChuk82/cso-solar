import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (format: 'text' | 'photo' | 'pdf') => void;
}

export function TelegramModal({ isOpen, onClose, onSend }: TelegramModalProps) {
  const [format, setFormat] = useState<'text' | 'photo' | 'pdf'>('pdf');

  if (!isOpen) return null;

  const handleSend = () => {
    onSend(format);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Відправити в Telegram</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              style={{ borderColor: format === 'text' ? '#0088cc' : '#e5e7eb' }}>
              <input
                type="radio"
                name="tgFormat"
                value="text"
                checked={format === 'text'}
                onChange={(e) => setFormat(e.target.value as 'text')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📝 Текст</div>
                <div className="text-xs text-gray-600">Швидке повідомлення з переліком товарів</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              style={{ borderColor: format === 'photo' ? '#0088cc' : '#e5e7eb' }}>
              <input
                type="radio"
                name="tgFormat"
                value="photo"
                checked={format === 'photo'}
                onChange={(e) => setFormat(e.target.value as 'photo')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📸 Фото</div>
                <div className="text-xs text-gray-600">Скріншот пропозиції як зображення</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              style={{ borderColor: format === 'pdf' ? '#0088cc' : '#e5e7eb' }}>
              <input
                type="radio"
                name="tgFormat"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as 'pdf')}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📄 PDF</div>
                <div className="text-xs text-gray-600">Професійний документ для друку</div>
              </div>
            </label>
          </div>

          {format === 'photo' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              📋 Скріншот КП буде відправлено як зображення
            </div>
          )}

          {format === 'pdf' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              📥 PDF документ буде згенеровано та відправлено
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded hover:bg-opacity-90 transition"
            style={{ background: '#0088cc' }}
          >
            <Send className="w-4 h-4" />
            Відправити
          </button>
        </div>
      </div>
    </div>
  );
}
