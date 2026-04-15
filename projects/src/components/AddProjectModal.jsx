import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Check, Plus, RefreshCw, Phone, Edit2 } from 'lucide-react';
import { projectService } from '../services/api';
import { cn } from '../lib/utils';

export function AddProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    client_phone: '',
    address: '',
    notes: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        client_name: '',
        client_phone: '',
        address: '',
        notes: '',
      });
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    let finalName = formData.name.trim();
    if (!finalName) {
      if (formData.client_name.trim()) {
        const today = new Date().toLocaleDateString('uk-UA');
        finalName = `${formData.client_name.trim()} (${today})`;
      } else {
        return alert('Будь ласка, введіть назву проекту або ім\'я клієнта');
      }
    }
    
    setIsSaving(true);
    try {
      const res = await projectService.saveProject({ ...formData, name: finalName });
      if (res.success) {
        onProjectCreated(res.id);
        onClose();
      } else {
        alert('Помилка збереження: ' + (res.error || 'Невідома помилка'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Помилка підключення до сервера');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="sheet-handle" />
        
        {/* Header */}
        <div className="modal-header pb-4 border-b border-gray-200 dark:border-neutral-700">
          <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">📦 Створення проекту</h3>
             <p className="text-[10px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">Новий проект з нуля</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-body p-0">
          <form onSubmit={handleSave} className="p-5 space-y-4 flex flex-col h-full">
             <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="form-group">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                        <User size={12} /> Клієнт *
                      </label>
                      <input
                         type="text"
                         className="form-input"
                         placeholder="ПІБ клієнта"
                         value={formData.client_name}
                         onChange={e => setFormData({...formData, client_name: e.target.value})}
                         required
                      />
                   </div>
                   <div className="form-group">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                        <Phone size={12} /> Телефон
                      </label>
                      <input
                         type="text"
                         className="form-input"
                         placeholder="+380..."
                         value={formData.client_phone}
                         onChange={e => setFormData({...formData, client_phone: e.target.value})}
                      />
                   </div>
                </div>

                <div className="form-group">
                   <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                     <MapPin size={12} /> Адреса об'єкта
                   </label>
                   <input
                      type="text"
                      className="form-input"
                      placeholder="Місто, вулиця..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                </div>

                <div className="form-group">
                   <label className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">
                     Коментар / Примітки
                   </label>
                   <textarea
                      className="form-input min-h-[80px]"
                      placeholder="Додаткові деталі..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                   />
                </div>
             </div>

             <div className="pt-4 mt-2 flex items-center justify-end">
                <button 
                   type="button"
                   onClick={onClose}
                   className="btn btn-ghost mr-2"
                >
                   Скасувати
                </button>
                <button 
                   type="submit"
                   disabled={isSaving || !formData.client_name.trim()}
                   className="btn btn-brand !px-8"
                >
                   {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                   Створити
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
}
