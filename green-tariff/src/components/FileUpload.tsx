// ===== CSO Solar — File Upload Component =====

import React, { useRef } from 'react';
import { useGreenTariffStore } from '../store/useGreenTariffStore';

export function FileUpload() {
  const { files, addFile, removeFile } = useGreenTariffStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

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
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-3 transition ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'
        }`}
      >
        <div className="flex gap-2 justify-center mb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
          >
            <span className="text-lg">💻</span>
            <span>З комп'ютера</span>
          </button>
          <button
            type="button"
            onClick={() => window.open('https://drive.google.com/drive/u/0/folders/1rAqPA1euecPf4Rb4ME6IgLQzeT0noiTq', '_blank')}
            className="flex-1 flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
          >
            <span className="text-lg">☁️</span>
            <span>Google Drive</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-500 text-center">
          Або перетягніть файли сюди (PDF, JPG, PNG)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md text-xs"
            >
              <span className="truncate flex-1 text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 text-gray-400 hover:text-red-500 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
