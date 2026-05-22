// ===== CSO Solar — File Upload Component (v2) =====

import React, { useRef, useState } from 'react';
import { useGTStore } from '../store/useGTStore';
import { UploadCloud, Laptop, Cloud, CheckCircle, Trash2 } from 'lucide-react';

export function FileUpload() {
  const { files, addFile, removeFile } = useGTStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const reader = new FileReader();

      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        addFile({
          name: file.name,
          type: file.type,
          base64,
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-3.5 transition-all duration-200 text-center flex flex-col sm:flex-row items-center justify-between gap-3 relative cursor-pointer group ${
          isDragging 
            ? 'border-[#f59e0b] bg-[#f59e0b]/5 dark:bg-[#f59e0b]/10' 
            : 'border-gray-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30 hover:border-[#f59e0b]/60 dark:hover:border-[#f59e0b]/60'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-500 dark:text-slate-400 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
            <UploadCloud className="w-5 h-5 text-[#f59e0b]" />
          </div>
          
          <div className="text-left min-w-0">
            <p className="text-xs font-bold text-gray-700 dark:text-slate-200">Завантажте необхідні копії або протоколи</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">Перетягніть файли сюди</p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-[#f59e0b]/40 rounded-xl transition-all"
          >
            <Laptop className="w-3.5 h-3.5" />
            Комп'ютер
          </button>
          
          <button
            type="button"
            onClick={() => window.open('https://drive.google.com/drive/u/0/folders/1rAqPA1euecPf4Rb4ME6IgLQzeT0noiTq', '_blank')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-[#f59e0b]/40 rounded-xl transition-all"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            Drive
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* File lists cards style */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800 rounded-xl text-[11px] shadow-sm hover:scale-[1.01] transition-transform duration-150 animate-slide-in"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate font-medium text-gray-700 dark:text-slate-200">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 rounded-lg transition"
                title="Видалити"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
