import React, { useState, useEffect } from 'react';
import { X, Search, FileText, User, MapPin, Check, Plus, RefreshCw } from 'lucide-react';
import { projectService } from '../services/api';
import { cn, formatCurrency } from '../lib/utils';

export function AddProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [proposals, setProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    client_phone: '',
    address: '',
    proposal_id: '',
    notes: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProposals();
    }
  }, [isOpen]);

  const loadProposals = async () => {
    setIsLoadingProposals(true);
    try {
      console.log('Fetching proposals...');
      const data = await projectService.getProposals();
      console.log('Proposals received:', data);
      
      if (data && data.success) {
        setProposals(data.proposals || []);
      } else {
        console.error('Failed to load proposals:', data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  const selectProposal = (prop) => {
    console.log('Selected proposal data:', prop);
    setSelectedProposal(prop);
    const clientName = prop.clientName || prop.client || '';
    const clientPhone = prop.clientPhone || prop.contact || prop.phone || '';
    
    setFormData(prev => ({
      ...prev,
      name: prev.name || `Проект: ${clientName || 'Новий'}`,
      client_name: clientName,
      client_phone: clientPhone,
      proposal_id: prop.id,
      items_from_cp: prop.items || [], 
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert('Будь ласка, введіть назву проекту');
    
    setIsSaving(true);
    try {
      console.log('Saving project with items:', formData.items_from_cp?.length);
      const res = await projectService.saveProject(formData);
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

  const filteredProposals = proposals.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.clientName || p.client || '').toLowerCase().includes(term) ||
      (String(p.id) || '').toLowerCase().includes(term) ||
      (String(p.number) || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="modal-overlay">
      {/* Modal */}
      <div className="modal modal-wide">
        {/* Header */}
        <div className="modal-header">
          <div>
             <h3 className="text-lg font-bold text-slate-900 leading-tight">📦 Створення проекту</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Виберіть КП або заповніть дані вручну</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-body p-0 grid grid-cols-1 lg:grid-cols-5 min-h-[500px]">
          {/* Sidebar: Proposals List */}
          <div className="lg:col-span-2 border-r border-slate-100 bg-slate-50/30 flex flex-col overflow-hidden max-h-[30vh] lg:max-h-none">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Пошук клієнта / ID..."
                  className="form-input pl-8 text-[11px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {isLoadingProposals ? (
                 <div className="p-12 text-center text-slate-400">
                    <div className="spinner mx-auto mb-2"></div>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Завантаження...</p>
                 </div>
               ) : filteredProposals.length === 0 ? (
                 <div className="text-center py-12 px-2 opacity-50">
                   <p className="text-slate-400 font-bold uppercase text-[9px]">Нічого не знайдено</p>
                 </div>
               ) : (
                 filteredProposals.map(prop => (
                   <button 
                    key={prop.id}
                    onClick={() => selectProposal(prop)}
                    className={cn(
                      "w-full px-3 py-3 rounded-xl border transition-all text-left relative",
                      selectedProposal?.id === prop.id 
                        ? "bg-slate-900 border-slate-900 shadow-lg text-white" 
                        : "bg-white border-slate-100 hover:border-brand"
                    )}
                   >
                     <div className="space-y-0.5 relative z-10">
                        <p className={cn("text-[8px] font-black uppercase tracking-wider", selectedProposal?.id === prop.id ? "text-brand" : "text-slate-400")}>ID: {prop.id} {prop.number ? `| №${prop.number}` : ''}</p>
                        <p className="text-[11px] font-bold leading-tight">{prop.clientName || prop.client || 'Невідомий'}</p>
                        <p className={cn("text-[10px] font-medium", selectedProposal?.id === prop.id ? "text-slate-400" : "text-slate-500")}>
                           {formatCurrency(prop.totalAmount || 0)}
                        </p>
                     </div>
                     {selectedProposal?.id === prop.id && (
                       <Check className="h-4 w-4 text-brand absolute bottom-3 right-3" />
                     )}
                   </button>
                 ))
               )}
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSave} className="lg:col-span-3 p-5 space-y-4 flex flex-col h-full">
             <div className="flex-1 space-y-4">
                <div className="form-group">
                   <label>Назва проекту</label>
                   <input 
                      required
                      type="text" 
                      className="form-input font-bold"
                      placeholder="Напр: СЕС 30кВт (Петренко)"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="form-group">
                      <label>Клієнт</label>
                      <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                         <input 
                            type="text" 
                            className="form-input pl-9 font-bold"
                            placeholder="ПІБ"
                            value={formData.client_name}
                            onChange={e => setFormData({...formData, client_name: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="form-group">
                      <label>Телефон</label>
                      <div className="relative">
                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                         <input 
                            type="text" 
                            className="form-input pl-9 font-bold"
                            placeholder="+380..."
                            value={formData.client_phone}
                            onChange={e => setFormData({...formData, client_phone: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <div className="form-group">
                   <label>Адреса об'єкта</label>
                   <input 
                      type="text" 
                      className="form-input font-bold"
                      placeholder="Вулиця, будинок..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                </div>

                <div className="form-group">
                   <label>Примітки</label>
                   <textarea 
                      className="form-input min-h-[80px]"
                      placeholder="Додаткові деталі..."
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                   />
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="min-h-[20px]">
                   {selectedProposal && (
                     <div className="badge badge-success !text-[8px] animate-in slide-in-from-left-2">
                        <Check className="h-3 w-3" /> Товари будуть скопійовані з КП #{selectedProposal.id}
                     </div>
                   )}
                </div>
                <button 
                   type="submit"
                   disabled={isSaving}
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
