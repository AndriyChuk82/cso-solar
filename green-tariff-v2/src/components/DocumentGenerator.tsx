// ===== CSO Solar — Document Generator Component (v2) =====

import React, { useRef, useState } from 'react';
import { useGTStore } from '../store/useGTStore';
import type { SemanticProject } from '../types';
import { FileText, Camera, Printer, Image, Loader2, AlertCircle } from 'lucide-react';

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/u/0/folders/1rAqPA1euecPf4Rb4ME6IgLQzeT0noiTq';
const PHOTO_LIMIT = 1_500_000;

const LEFT_DOC_OPTIONS = [
  { value: '1', label: '1. Заява на встановлення' },
  { value: '2', label: '2. Протокол відповідності (+фото)' },
  { value: '3', label: '3. Однолінійна схема' },
  { value: 'inverter_cert', label: '📄 Паспорт інвертора (зі сховища)' },
  { value: 'panel_cert', label: '📄 Паспорт сонячної панелі (зі сховища)' },
];

const RIGHT_DOC_OPTIONS = [
  { value: '4', label: '4. Акт приймання-передачі' },
  { value: '5', label: '5. Договір про встановлення' },
  { value: '6', label: '6. Акт тех. вимог (п. 4.12.2)' },
  { value: '7', label: '7. Технічні паспорти обладнання (QR-коди)' },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function compressImage(dataUrl: string, quality = 0.75, maxWidth = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function preparePhotoBase64(file: File | undefined): Promise<string> {
  if (!file) return '';
  let b64 = await fileToBase64(file);
  if (b64.length > PHOTO_LIMIT) {
    b64 = await compressImage(b64, 0.75);
  }
  return b64;
}

interface PhotoInputProps {
  id: string;
  label: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
}

function PhotoInput({ id, label, fileRef }: PhotoInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
          {label}
        </label>
        <a
          href={DRIVE_FOLDER_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-[#f59e0b] hover:underline"
        >
          ☁️ Drive
        </a>
      </div>
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/*"
        className="w-full text-[10px] border border-gray-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/30 rounded-lg px-2 py-1 file:mr-2 file:text-[9px] file:font-bold file:border-0 file:bg-[#f59e0b]/10 file:text-[#f59e0b] file:rounded-md file:px-2 file:py-0.5 cursor-pointer hover:border-[#f59e0b]/40"
      />
    </div>
  );
}

interface DocumentGeneratorProps {
  formData: SemanticProject;
  matchedCerts?: {
    inverterCert: { name: string; url: string } | null;
    panelCert: { name: string; url: string } | null;
  } | null;
}

export function DocumentGenerator({ formData, matchedCerts }: DocumentGeneratorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [signMode, setSignMode] = useState<'none' | 'stamp' | 'only'>('none');
  const [isGenerating, setIsGenerating] = useState(false);

  const { showToast } = useGTStore();

  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const photo3Ref = useRef<HTMLInputElement>(null);

  const toggleDoc = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (selected.length === 0) {
      showToast('Оберіть хоча б один документ', 'warning');
      return;
    }

    setIsGenerating(true);
    showToast('Готуємо друковані форми...', 'info', 3000);

    try {
      // Build the merged form data object mapping Semantic -> index names for printing template compatibility
      const mergedData: Record<string, unknown> = {};
      
      // Let's loop 1 to 45 to fill field1..field45
      // Wait, let's import getFieldIndexFromSemanticName or use toRawGASProject
      const mapping: Record<string, string> = {
        status: 'field1', paymentStatus: 'field2', projectNumber: 'field3', fullName: 'field4',
        taxId: 'field5', propertyRegNumber: 'field6', titleDeedNumber: 'field7', unzr: 'field8',
        contractNumber: 'field9', contractDate: 'field10', testingTime: 'field11', eicCode: 'field12',
        permittedPower: 'field13', substation: 'field14', line: 'field15', utilityPole: 'field16',
        meterModel: 'field17', voltage: 'field18', inputBreaker: 'field19', voltageProtector: 'field20',
        installationLocation: 'field21', totalPanelPower: 'field22', panelCount: 'field23',
        panelInstallationLocation: 'field24', email: 'field25', phone: 'field26', inverterModel: 'field27',
        inverterPower: 'field28', inverterSerialNumber: 'field29', inverterManufacturer: 'field30',
        inverterFirmware: 'field31', inverterWarranty: 'field32', panelManufacturer: 'field33',
        panelModel: 'field34', panelWarranty: 'field35', batteryModel: 'field36', batteryPower: 'field37',
        workCost: 'field38', workCostInWords: 'field39', passportData: 'field40', advanceUsd: 'field41',
        balanceUsd: 'field42', stationType: 'field43', internalComment: 'field44', reserve: 'field45',
      };

      Object.entries(mapping).forEach(([semanticKey, rawField]) => {
        const val = formData[semanticKey as keyof SemanticProject];
        mergedData[rawField] = val ?? '';
        
        // Let's also set semantic attributes if template uses them
        mergedData[semanticKey] = val ?? '';
      });

      mergedData.serviceContractDate = formData.serviceContractDate || '';

      // Special formatted fields
      mergedData.currentDate = new Date().toLocaleDateString('uk-UA');
      mergedData.stationType = formData.stationType || '';
      mergedData.signMode = signMode;
      
      // Inject matched certificate URLs and filenames for printing
      mergedData.inverterCertUrl = matchedCerts?.inverterCert?.url || '';
      mergedData.inverterCertName = matchedCerts?.inverterCert?.name || '';
      mergedData.panelCertUrl = matchedCerts?.panelCert?.url || '';
      mergedData.panelCertName = matchedCerts?.panelCert?.name || '';

      // Prepare photo files
      const [photo1Base64, photo2Base64, photo3Base64] = await Promise.all([
        preparePhotoBase64(photo1Ref.current?.files?.[0]),
        preparePhotoBase64(photo2Ref.current?.files?.[0]),
        preparePhotoBase64(photo3Ref.current?.files?.[0]),
      ]);

      // Автоматичне відкриття підібраних PDF-файлів у нових вкладках
      if (selected.includes('inverter_cert')) {
        if (matchedCerts?.inverterCert?.url) {
          window.open(matchedCerts.inverterCert.url, '_blank');
        } else {
          showToast('Технічний паспорт інвертора не знайдено в сховищі', 'warning');
        }
      }
      if (selected.includes('panel_cert')) {
        if (matchedCerts?.panelCert?.url) {
          window.open(matchedCerts.panelCert.url, '_blank');
        } else {
          showToast('Технічний паспорт сонячної панелі не знайдено в сховищі', 'warning');
        }
      }

      // Відфільтровуємо PDF-паспорти від HTML-шаблонів, які рендерить друкована сторінка
      const htmlDocIds = selected.filter(id => id !== 'inverter_cert' && id !== 'panel_cert');

      if (htmlDocIds.length > 0) {
        const printData = {
          selected: htmlDocIds,
          formData: mergedData,
          photos: { photo1: photo1Base64, photo2: photo2Base64, photo3: photo3Base64 },
        };

        const printKey = 'gt_print_' + Date.now();
        localStorage.setItem(printKey, JSON.stringify(printData));

        // Очікуємо повного запису
        await new Promise((r) => setTimeout(r, 60));

        const baseUrl = import.meta.env.BASE_URL || '/';
        window.open(`${baseUrl}green-tariff-print.html?key=${printKey}`, '_blank');
        showToast('Документи успішно відкриті у новій вкладці! 🖨️', 'success');
      } else {
        showToast('Паспорти обладнання відкрито у нових вкладках! 📄', 'success');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        showToast('Помилка: фото занадто великі для пам\'яті браузера. Зменшіть якість!', 'error');
      } else {
        console.error('Document generation error:', err);
        showToast('Помилка генерації документів: ' + (err as Error).message, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 transition-all">
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-3">
        <FileText className="w-5 h-5 text-[#f59e0b]" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Генерація Друк-Форм</h3>
      </div>

      {/* Checkboxes List */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Оберіть шаблони:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Колонка 1: 1, 2, 3 та паспорти */}
          <div className="flex flex-col gap-1.5">
            {LEFT_DOC_OPTIONS.map((doc) => (
              <label
                key={doc.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  selected.includes(doc.value)
                    ? 'border-[#f59e0b] bg-[#f59e0b]/5 dark:bg-[#f59e0b]/10 text-gray-900 dark:text-white font-semibold'
                    : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(doc.value)}
                  onChange={() => toggleDoc(doc.value)}
                  className="w-4 h-4 accent-[#f59e0b] rounded"
                />
                <span className="text-xs leading-normal">{doc.label}</span>
              </label>
            ))}
          </div>

          {/* Колонка 2: 4, 5, 6, 7 */}
          <div className="flex flex-col gap-1.5">
            {RIGHT_DOC_OPTIONS.map((doc) => (
              <label
                key={doc.value}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  selected.includes(doc.value)
                    ? 'border-[#f59e0b] bg-[#f59e0b]/5 dark:bg-[#f59e0b]/10 text-gray-900 dark:text-white font-semibold'
                    : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(doc.value)}
                  onChange={() => toggleDoc(doc.value)}
                  className="w-4 h-4 accent-[#f59e0b] rounded"
                />
                <span className="text-xs leading-normal">{doc.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Signature Selector */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Параметри автопідпису:</p>
        <div className="grid grid-cols-3 gap-1 bg-gray-50/70 dark:bg-slate-950/40 p-1 rounded-xl border border-gray-200/50 dark:border-slate-800 max-w-md">
          <button
            type="button"
            onClick={() => setSignMode('none')}
            className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[10px] font-bold ${
              signMode === 'none'
                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-slate-700/60'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-slate-300 border border-transparent'
            }`}
          >
            <span>❌</span>
            <span>Без підпису</span>
          </button>

          <button
            type="button"
            onClick={() => setSignMode('stamp')}
            className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[10px] font-bold ${
              signMode === 'stamp'
                ? 'bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/25 shadow-sm'
                : 'text-gray-500 hover:text-[#f59e0b] border border-transparent'
            }`}
          >
            <span>🔏</span>
            <span>Печатка + підпис</span>
          </button>

          <button
            type="button"
            onClick={() => setSignMode('only')}
            className={`py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[10px] font-bold ${
              signMode === 'only'
                ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 shadow-sm'
                : 'text-gray-500 hover:text-blue-500 border border-transparent'
            }`}
          >
            <span>✍️</span>
            <span>Лише підпис</span>
          </button>
        </div>
      </div>

      {/* Photos for Protocol */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-gray-400" />
          Вкладення для протоколу (Додатки):
        </p>
        <div className="flex flex-col gap-2 max-w-md">
          <PhotoInput id="protoPhoto1" label="1. Фото інвертора:" fileRef={photo1Ref} />
          <PhotoInput id="protoPhoto2" label="2. С/н інвертора:" fileRef={photo2Ref} />
          <PhotoInput id="protoPhoto3" label="3. Скріншот налаштувань (Додаток №2):" fileRef={photo3Ref} />
        </div>
      </div>

      {/* Generator Triggers */}
      <div className="pt-2 flex justify-start">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || selected.length === 0}
          className="w-fit inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#f59e0b] hover:bg-[#d97706] rounded-xl shadow-md shadow-[#f59e0b]/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Підготовка друку...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              Згенерувати обрані документи
            </>
          )}
        </button>
      </div>
    </div>
  );
}
