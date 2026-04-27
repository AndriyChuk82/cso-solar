// ===== CSO Solar — Document Generator Component =====
// Mirrors the generateSelectedDocuments() logic from the legacy green-tariff.js

import React, { useRef, useState } from 'react';
import { useGreenTariffStore } from '../store/useGreenTariffStore';
import type { GreenTariffProject } from '../types';

// ---- constants ----
const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/u/0/folders/1rAqPA1euecPf4Rb4ME6IgLQzeT0noiTq';
/** Max base64 length before we compress (≈1.1 MB of real file data). */
const PHOTO_LIMIT = 1_500_000;

const DOC_OPTIONS = [
  { value: '1', label: '1. Заява на встановлення' },
  { value: '2', label: '2. Протокол відповідності (+фото)' },
  { value: '3', label: '3. Однолінійна схема' },
  { value: '4', label: '4. Акт приймання-передачі' },
  { value: '5', label: '5. Договір про встановлення' },
];

// ---- helpers ----

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

/**
 * Compresses an image via canvas to reduce localStorage footprint.
 * Returns the original DataURL if compression fails.
 */
function compressImage(dataUrl: string, quality = 0.75, maxWidth = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
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

// ---- sub-components ----

interface PhotoInputProps {
  id: string;
  label: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
}

function PhotoInput({ id, label, fileRef }: PhotoInputProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="text-[11px] text-gray-600">
          {label}
        </label>
        <a
          href={DRIVE_FOLDER_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-accent hover:underline"
        >
          ☁️ Drive
        </a>
      </div>
      <input
        ref={fileRef}
        id={id}
        type="file"
        accept="image/*"
        className="w-full text-[11px] border border-gray-300 rounded-md px-2 py-1 file:mr-2 file:text-[11px] file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-0.5 cursor-pointer"
      />
    </div>
  );
}

// ---- main component ----

export function DocumentGenerator({ formData }: { formData: GreenTariffProject }) {
  const { currentProject } = useGreenTariffStore();

  const [selected, setSelected] = useState<string[]>([]);
  const [signMode, setSignMode] = useState<'none' | 'stamp' | 'only'>('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);

  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const photo3Ref = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'info' | 'success' | 'error' | 'warning') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

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

    // Check if GT_TEMPLATES is available from the legacy bundle
    // (loaded via /green-tariff-templates.js on the print page)
    setIsGenerating(true);
    showToast('Готуємо документи...', 'info');

    try {
      // Build the merged form data object (same structure as legacy)
      const mergedData: Record<string, unknown> = {};
      for (let i = 1; i <= 45; i++) {
        const key = `field${i}` as keyof GreenTariffProject;
        mergedData[key] = formData[key] ?? '';
      }
      mergedData.currentDate = new Date().toLocaleDateString('uk-UA');
      mergedData.stationType = formData.stationType || '';
      mergedData.signMode = signMode;

      // Prepare photos
      const [photo1Base64, photo2Base64, photo3Base64] = await Promise.all([
        preparePhotoBase64(photo1Ref.current?.files?.[0]),
        preparePhotoBase64(photo2Ref.current?.files?.[0]),
        preparePhotoBase64(photo3Ref.current?.files?.[0]),
      ]);

      const printData = {
        selected,
        formData: mergedData,
        photos: { photo1: photo1Base64, photo2: photo2Base64, photo3: photo3Base64 },
      };

      // Write to localStorage with a unique key (same approach as legacy to avoid
      // sessionStorage cross-tab issues in Firefox/Safari).
      const printKey = 'gt_print_' + Date.now();
      localStorage.setItem(printKey, JSON.stringify(printData));

      // Micro-pause to guarantee localStorage.setItem committed before the new tab reads.
      await new Promise((r) => setTimeout(r, 50));

      window.open(`green-tariff-print.html?key=${printKey}`, '_blank');
      showToast('Документи відкрито у новій вкладці', 'success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        showToast('Помилка: фото занадто великі. Зменшіть розмір і спробуйте знову.', 'error');
      } else {
        console.error('Document generation error:', err);
        showToast('Помилка при підготовці документів: ' + (err as Error).message, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toastColors: Record<string, string> = {
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    error: 'bg-red-50 border-red-300 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">📄 Генерація документів</h3>

      {/* Toast */}
      {toastMsg && (
        <div className={`text-xs px-3 py-2 rounded-md border ${toastColors[toastMsg.type]}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Document checklist */}
      <div className="space-y-1.5">
        {DOC_OPTIONS.map((doc) => (
          <label
            key={doc.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selected.includes(doc.value)}
              onChange={() => toggleDoc(doc.value)}
              className="w-3.5 h-3.5 accent-primary rounded"
            />
            <span className="text-xs text-gray-700 group-hover:text-gray-900 transition">
              {doc.label}
            </span>
          </label>
        ))}

        <div className="pt-2 mt-1 border-t border-gray-100 space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Параметри підпису:</p>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="signMode"
                checked={signMode === 'none'}
                onChange={() => setSignMode('none')}
                className="w-3 h-3 accent-gray-500"
              />
              <span className="text-xs text-gray-600">Без підпису</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="signMode"
                checked={signMode === 'stamp'}
                onChange={() => setSignMode('stamp')}
                className="w-3 h-3 accent-accent"
              />
              <span className="text-xs font-semibold text-accent">🔏 Печатка + підпис</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="signMode"
                checked={signMode === 'only'}
                onChange={() => setSignMode('only')}
                className="w-3 h-3 accent-blue-600"
              />
              <span className="text-xs font-semibold text-blue-600">✍️ Лише підпис</span>
            </label>
          </div>
        </div>
      </div>

      {/* Protocol photos */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-700">
          Фото для Протоколу (Додаток №1):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PhotoInput id="protoPhoto1" label="1. Фото інвертора:" fileRef={photo1Ref} />
          <PhotoInput id="protoPhoto2" label="2. С/н інвертора:" fileRef={photo2Ref} />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="protoPhoto3" className="text-[11px] font-semibold text-gray-700">
              Скріншот налаштувань (Додаток №2):
            </label>
            <a
              href={DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-accent hover:underline"
            >
              ☁️ Google Drive ↗
            </a>
          </div>
          <input
            ref={photo3Ref}
            id="protoPhoto3"
            type="file"
            accept="image/*"
            className="w-full text-[11px] border border-gray-300 rounded-md px-2 py-1 file:mr-2 file:text-[11px] file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-0.5 cursor-pointer"
          />
        </div>
      </div>



      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || selected.length === 0}
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Готуємо...
          </>
        ) : (
          '📝 Сформувати документи'
        )}
      </button>
    </div>
  );
}
