import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, MapPin, Check, Plus, RefreshCw, Phone } from 'lucide-react';
import { projectService } from '../services/api';

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
        return alert('Будь ласка, введіть назву проєкту або ім\'я клієнта');
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

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="sheet-handle" />
        
        {/* Header */}
        <div className="modal-header">
          <div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">📦 Створення проєкту</h3>
             <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider mt-1">Заповніть дані для нової угоди</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-transform active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSave} className="p-6 space-y-5 flex flex-col">
             <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="form-group">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                        <User size={13} className="text-primary" /> Клієнт *
                      </label>
                      <input
                         type="text"
                         className="form-input"
                         placeholder="ПІБ клієнта"
                         value={formData.client_name}
                         onChange={e => setFormData({...formData, client_name: e.target.value})}
                         required
                         style={{ height: 46, fontSize: '0.95rem', fontWeight: 600 }}
                      />
                   </div>
                   <div className="form-group">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                        <Phone size={13} className="text-primary" /> Телефон
                      </label>
                      <input
                         type="text"
                         className="form-input"
                         placeholder="+380..."
                         value={formData.client_phone}
                         onChange={e => setFormData({...formData, client_phone: e.target.value})}
                         style={{ height: 46, fontSize: '0.95rem', fontWeight: 600 }}
                      />
                   </div>
                </div>

                <div className="form-group">
                   <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                     <MapPin size={13} className="text-primary" /> Адреса об'єкта
                   </label>
                   <input
                      type="text"
                      className="form-input"
                      placeholder="Місто, вулиця, номер будинку..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      style={{ height: 46, fontSize: '0.95rem', fontWeight: 500 }}
                   />
                </div>

                <div className="form-group">
                   <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">
                     Коментар / Примітки
                   </label>
                   <textarea
                      className="form-input min-h-[100px]"
                      placeholder="Будь-які додаткові деталі по проєкту..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      style={{ padding: '12px', fontSize: '0.9rem', lineHeight: 1.5 }}
                   />
                </div>
             </div>

             <div className="pt-6 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-end gap-3">
                <button 
                   type="button"
                   onClick={onClose}
                   className="btn btn-ghost !px-6 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                   Скасувати
                </button>
                <button 
                   type="submit"
                   disabled={isSaving || !formData.client_name.trim()}
                   className="btn btn-primary !px-10 !py-3 shadow-lg shadow-primary/20"
                   style={{ height: 48, minWidth: 160 }}
                >
                   {isSaving ? (
                     <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                   ) : (
                     <Plus className="h-5 w-5 mr-2" />
                   )}
                   <span className="font-bold text-base">Створити проєкт</span>
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
