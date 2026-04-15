import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ViberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onSend: (format: 'link' | 'photo' | 'pdf') => void;
}

export function ViberModal({ isOpen, onClose, onComplete, onSend }: ViberModalProps) {
  const [format, setFormat] = useState<'link' | 'photo' | 'pdf'>('pdf');

  if (!isOpen) return null;

  const handleSend = () => {
    onSend(format);
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Відправити в Viber</h2>
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
              style={{ borderColor: format === 'link' ? '#7360f2' : '#e5e7eb' }}>
              <input
                type="radio"
                name="vbFormat"
                value="link"
                checked={format === 'link'}
                onChange={(e) => setFormat(e.target.value as 'link')}
                className="w-4 h-4 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📱 Посилання</div>
                <div className="text-xs text-gray-600">Відкрити чат з готовим текстом</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              style={{ borderColor: format === 'photo' ? '#7360f2' : '#e5e7eb' }}>
              <input
                type="radio"
                name="vbFormat"
                value="photo"
                checked={format === 'photo'}
                onChange={(e) => setFormat(e.target.value as 'photo')}
                className="w-4 h-4 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📸 Фото</div>
                <div className="text-xs text-gray-600">Скопіювати скріншот у буфер обміну</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              style={{ borderColor: format === 'pdf' ? '#7360f2' : '#e5e7eb' }}>
              <input
                type="radio"
                name="vbFormat"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value as 'pdf')}
                className="w-4 h-4 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">📄 PDF</div>
                <div className="text-xs text-gray-600">Завантажити PDF для відправки</div>
              </div>
            </label>
          </div>

          {format === 'link' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
              📱 Відкриється прямий чат з клієнтом та готовим текстом
            </div>
          )}

          {format === 'photo' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
              📋 Скріншот КП буде скопійовано в буфер. Вставте його (Ctrl+V) у Viber
            </div>
          )}

          {format === 'pdf' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
              📥 PDF буде автоматично завантажено. Надішліть його клієнту
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
            style={{ background: '#7360f2' }}
          >
            <Send className="w-4 h-4" />
            Відправити
          </button>
        </div>
      </div>
    </div>
  );
}
