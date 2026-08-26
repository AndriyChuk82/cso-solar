// ===== CSO Solar — Public Files & Specs Catalog Page =====

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, ExternalLink, FileText, Check, Copy, 
  FolderOpen, ShieldCheck, Sun, Zap, RefreshCw, FileCode, ArrowLeft,
  Upload, Trash2, X, FileUp, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { fetchSpecsFileListDetails, uploadSpecFile, deleteSpecFile, type SpecFileItem } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
}

function cleanFileName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/_/g, ' ')       // underscore to space
    .trim();
}

const CATEGORY_FILTERS = [
  { id: 'all', label: '🌐 Всі файли', icon: FolderOpen },
  { id: 'inverter', label: '⚡ Інвертори', icon: Zap },
  { id: 'panel', label: '☀️ Сонячні панелі', icon: Sun },
  { id: 'battery', label: '🔋 Акумулятори', icon: ShieldCheck },
  { id: 'doc', label: '📑 Паспорти та сертифікати', icon: FileText },
];

function matchTermWithRanges(term: string, fileName: string, normalizedName: string): boolean {
  if (normalizedName.includes(term) || fileName.toLowerCase().includes(term)) {
    return true;
  }

  const termNumMatch = term.match(/^(\d+)(?:[a-z]*)$/i);
  if (termNumMatch) {
    const targetNum = parseInt(termNumMatch[1], 10);
    if (!isNaN(targetNum)) {
      const rangeRegex = /(\d{1,5})\s*[-–_]\s*(\d{1,5})/g;
      let match: RegExpExecArray | null;
      while ((match = rangeRegex.exec(fileName)) !== null) {
        const minVal = parseInt(match[1], 10);
        const maxVal = parseInt(match[2], 10);
        if (!isNaN(minVal) && !isNaN(maxVal) && minVal <= maxVal) {
          if ((maxVal - minVal) <= 200 && targetNum >= minVal && targetNum <= maxVal) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

interface PublicFilesPageProps {
  onBackToApp?: () => void;
}

export function PublicFilesPage({ onBackToApp }: PublicFilesPageProps) {
  const { authenticated } = useAuth();
  const [files, setFiles] = useState<SpecFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Upload modal & state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal & state
  const [fileToDelete, setFileToDelete] = useState<SpecFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFiles = async () => {
    setIsLoading(true);
    const data = await fetchSpecsFileListDetails();
    setFiles(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const nameLower = f.name.toLowerCase();

      // Category filtering
      if (activeCategory === 'inverter') {
        const isInverter = nameLower.includes('inverter') || nameLower.includes('інвертор') || nameLower.includes('deye') || nameLower.includes('solis') || nameLower.includes('fronius') || nameLower.includes('huawei') || nameLower.includes('kstar') || nameLower.includes('luxpower') || nameLower.includes('growatt') || nameLower.includes('sg') || nameLower.includes('sun');
        if (!isInverter) return false;
      } else if (activeCategory === 'panel') {
        const isPanel = nameLower.includes('panel') || nameLower.includes('панель') || nameLower.includes('longi') || nameLower.includes('ja_solar') || nameLower.includes('jinko') || nameLower.includes('trina') || nameLower.includes('canadian') || nameLower.includes('risen') || nameLower.includes('lr');
        if (!isPanel) return false;
      } else if (activeCategory === 'battery') {
        const isBattery = nameLower.includes('battery') || nameLower.includes('акб') || nameLower.includes('акумулятор') || nameLower.includes('pylontech') || nameLower.includes('dyness') || nameLower.includes('bms');
        if (!isBattery) return false;
      } else if (activeCategory === 'doc') {
        const isDoc = nameLower.includes('vde') || nameLower.includes('cert') || nameLower.includes('паспорт') || nameLower.includes('сертифікат') || nameLower.includes('manual') || nameLower.includes('інструкція');
        if (!isDoc) return false;
      }

      // Smart multi-term search filtering with range support (e.g. 650 in 640-670)
      if (searchQuery.trim()) {
        const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const normalizedName = `${nameLower} ${nameLower.replace(/[_.\-\/\\]+/g, ' ')}`;
        
        const matchesAllTerms = searchTerms.every(term => matchTermWithRanges(term, f.name, normalizedName));
        if (!matchesAllTerms) return false;
      }

      return true;
    });
  }, [files, activeCategory, searchQuery]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDownload = (file: SpecFileItem) => {
    const a = document.createElement('a');
    a.href = file.publicUrl;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadingFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (uploadingFiles.length === 0) return;
    setIsUploading(true);
    setUploadMessage(null);

    let successCount = 0;
    let errorCount = 0;

    for (const file of uploadingFiles) {
      const res = await uploadSpecFile(file);
      if (res.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);

    if (errorCount === 0) {
      setUploadMessage({ type: 'success', text: `Успішно завантажено файлів: ${successCount}` });
      setUploadingFiles([]);
      await loadFiles();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadMessage(null);
      }, 1500);
    } else {
      setUploadMessage({
        type: 'error',
        text: `Завантажено: ${successCount}, помилок: ${errorCount}`,
      });
      await loadFiles();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    const res = await deleteSpecFile(fileToDelete.name);
    setIsDeleting(false);
    setFileToDelete(null);
    if (res.success) {
      await loadFiles();
    } else {
      alert(`Помилка видалення: ${res.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf5] dark:bg-[#0f172a] text-gray-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#fbfaf5]/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-200/60 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/32JD4dc/logo.png"
              alt="CSO Solar Logo"
              className="h-9 w-auto flex-shrink-0"
            />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                CSO Solar <span className="text-[#f59e0b]">Файли та Паспорти</span>
              </h1>
              <p className="text-[10.5px] text-gray-500 dark:text-slate-400">
                Публічна бібліотека технічної документації
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authenticated && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
                title="Завантажити новий файл"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Завантажити файл</span>
              </button>
            )}

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#f59e0b]" />
                <span className="hidden sm:inline">Вхід для співробітників</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadFiles}
              disabled={isLoading}
              title="Оновити список"
              className="p-2 text-gray-500 hover:text-[#f59e0b] dark:text-slate-400 dark:hover:text-[#f59e0b] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#f59e0b]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-[#f59e0b]/20 dark:border-[#f59e0b]/30 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#f59e0b] text-white">
              📂 Сховище Supabase Storage
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Завантаження обладнання та сертифікатів
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
              Усі файли знаходяться у вільному доступі. Ви можете переглядати їх прямо у браузері, скачувати на пристрій або ділитися прямими посиланнями.
            </p>
          </div>

          {authenticated && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-[#f59e0b] hover:bg-amber-600 rounded-2xl shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Завантажити у сховище</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою інвертора, панелі, моделі чи сертифіката (напр. Deye, Longi, VDE)..."
              className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_FILTERS.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#f59e0b] text-white shadow-md shadow-[#f59e0b]/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-semibold px-1">
          <span>Знайдено файлів: <strong className="text-gray-900 dark:text-white font-bold">{filteredFiles.length}</strong> z {files.length}</span>
          {searchQuery && (
            <span className="text-[#f59e0b]">Пошук: «{searchQuery}»</span>
          )}
        </div>

        {/* File Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3 text-gray-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-[#f59e0b]" />
            <span className="text-sm font-semibold">Завантаження банку файлів із Supabase...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <FileCode className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">Файлів не знайдено</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Спробуйте змінити фільтр або запит у пошуку.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFiles.map((file) => {
              const ext = getFileExtension(file.name);
              const cleanName = cleanFileName(file.name);
              const sizeStr = formatFileSize(file.size);
              const isCopied = copiedUrl === file.publicUrl;

              return (
                <div
                  key={file.name}
                  className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#f59e0b]/40 dark:hover:border-[#f59e0b]/40 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    {/* Header line with extension badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${
                        ext === 'PDF' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50' 
                          : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                      }`}>
                        {ext}
                      </span>

                      <span className="text-[10.5px] font-bold text-gray-400 dark:text-slate-500">
                        {sizeStr}
                      </span>
                    </div>

                    {/* File title */}
                    <h3 
                      className="text-xs font-bold text-gray-800 dark:text-slate-100 group-hover:text-[#f59e0b] transition-colors leading-snug break-words"
                      title={file.name}
                    >
                      {cleanName}
                    </h3>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span>Переглянути</span>
                    </a>

                    <div className="flex items-center gap-1">
                      {authenticated && (
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          title="Видалити файл зі сховища"
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyLink(file.publicUrl)}
                        title="Скопіювати пряме посилання"
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#f59e0b] hover:bg-[#d97706] rounded-xl shadow-sm shadow-[#f59e0b]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачати</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Modal (Only accessible to authenticated users) */}
      {isUploadModalOpen && authenticated && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Завантаження файлів у Supabase Storage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadModalOpen(false);
                    setUploadingFiles([]);
                    setUploadMessage(null);
                  }
                }}
                disabled={isUploading}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-amber-400/60 dark:border-amber-500/40 rounded-2xl p-6 text-center bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all space-y-2 cursor-pointer relative"
            >
              <input
                type="file"
                multiple
                onChange={handleSelectFiles}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                Перетягніть файли сюди або <span className="text-amber-600 underline">оберіть на пристрої</span>
              </p>
              <p className="text-[10.5px] text-gray-400 dark:text-slate-400">
                Підтримуються PDF, PNG, JPG, ZIP та інші технічні файли
              </p>
            </div>

            {/* Selected files preview */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-xs font-bold text-gray-600 dark:text-slate-300">
                  Обрані файли ({uploadingFiles.length}):
                </p>
                {uploadingFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs"
                  >
                    <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[80%]" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">
                        {formatFileSize(file.size)}
                      </span>
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => removeUploadingFile(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message alert */}
            {uploadMessage && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
              }`}>
                {uploadMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadingFiles([]);
                  setUploadMessage(null);
                }}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading || uploadingFiles.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Завантаження...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Завантажити ({uploadingFiles.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && authenticated && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-extrabold">Підтвердження видалення</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Ви впевнені, що хочете видалити файл <strong className="text-gray-900 dark:text-white">{fileToDelete.name}</strong> із сховища Supabase Storage? Цю дію неможливо скасувати.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Видалення...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Видалити</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200/60 dark:border-slate-800/80 py-6 text-center text-xs text-gray-400 dark:text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} CSO Solar. Усі права захищено.</span>
          <span className="text-[11px]">База даних обладнання зеленого тарифу (Supabase Storage)</span>
        </div>
      </footer>
    </div>
  );
}
