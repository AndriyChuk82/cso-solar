// ===== CSO Solar — Green Tariff v2 Zustand Store =====

import { create } from 'zustand';
import type { GTStoreState, SemanticProject, FileAttachment, ToastMessage, GASResponse } from '../types';
import { gtApi } from '../services/api';
import { toSemanticProject, getProp } from '../utils/mapper';

const EMPTY_PROJECT: SemanticProject = {
  status: 'В процесі',
  paymentStatus: '',
  projectNumber: '',
  fullName: '',
  taxId: '',
  propertyRegNumber: '',
  titleDeedNumber: '',
  unzr: '',
  contractNumber: '',
  contractDate: '',
  testingTime: '',
  eicCode: '',
  permittedPower: '',
  substation: '',
  line: '',
  utilityPole: '',
  meterModel: '',
  voltage: '',
  inputBreaker: '',
  voltageProtector: '',
  installationLocation: '',
  totalPanelPower: '',
  panelCount: '',
  panelInstallationLocation: '',
  email: '',
  phone: '',
  inverterModel: '',
  inverterPower: '',
  inverterSerialNumber: '',
  inverterManufacturer: '',
  inverterFirmware: '',
  inverterWarranty: '',
  panelManufacturer: '',
  panelModel: '',
  panelWarranty: '',
  batteryModel: '',
  batteryPower: '',
  workCost: '',
  workCostInWords: '',
  passportData: '',
  advanceUsd: '',
  balanceUsd: '',
  stationType: '',
  internalComment: '',
  reserve: '',
};

function countProjectsInCurrentMonth(projects: SemanticProject[]): number {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const suffix = `/${mm}-${yyyy}-ЦСО`;
  
  return projects.filter(p => p.projectNumber && p.projectNumber.endsWith(suffix)).length;
}

function generateProjectNumber(projects: SemanticProject[]): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const countInMonth = countProjectsInCurrentMonth(projects);
  const count = (countInMonth + 1).toString().padStart(2, '0');
  return `${count}/${mm}-${yyyy}-ЦСО`;
}

export const useGTStore = create<GTStoreState>((set, get) => ({
  projects: [],
  currentProject: null,
  activeStatusFilter: 'В процесі',
  files: [],
  equipment: {
    inverters: [],
    panels: [],
    batteries: [],
    inverterManufacturers: ['Huawei', 'Deye', 'Growatt', 'Solis', 'SolaX'],
    panelManufacturers: ['Longi', 'Jinko', 'JA Solar', 'Trina', 'Risen'],
  },
  isLoading: false,
  error: null,
  toasts: [],
  unsavedChanges: false,

  showToast: (text: string, type: 'info' | 'success' | 'error' | 'warning', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, text, type, duration };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setStatusFilter: (status: string) => {
    set({ activeStatusFilter: status });
  },

  addFile: (file: FileAttachment) => {
    set((state) => ({ 
      files: [...state.files, file],
      unsavedChanges: true 
    }));
  },

  removeFile: (index: number) => {
    set((state) => ({ 
      files: state.files.filter((_, i) => i !== index),
      unsavedChanges: true
    }));
  },

  setUnsavedChanges: (hasChanges: boolean) => {
    set({ unsavedChanges: hasChanges });
  },

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await gtApi.fetchProjects();
      if (res.success && res.projects) {
        const mapped = res.projects.map((p) => toSemanticProject(p));
        set({ projects: mapped, isLoading: false });
      } else {
        const errMsg = res.error || 'Невідома помилка при отриманні проектів';
        set({ error: errMsg, isLoading: false });
        get().showToast(errMsg, 'error', 6000);
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      set({ error: errMsg, isLoading: false });
      get().showToast(`Помилка мережі: ${errMsg}`, 'error', 6000);
    }
  },

  retrySync: async (project: SemanticProject) => {
    get().showToast('Повторна фонова синхронізація...', 'info', 2000);
    await get().saveProject(project);
  },

  saveProject: async (project: SemanticProject) => {
    const { projects, currentProject, files } = get();
    
    // Determine the identifier to update or treat as new
    const id = project.id || currentProject?.id || null;
    const isNew = !id || id.startsWith('temp_');
    const actualId = isNew ? (id || `temp_${Date.now()}`) : id;

    // 1. Optimistic Update Local State immediately
    const optimisticProject = { ...project, id: actualId };
    let updatedProjects = [...projects];

    if (!isNew) {
      const idx = projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        updatedProjects[idx] = optimisticProject;
      }
    } else {
      const existingIdx = projects.findIndex(p => p.id === actualId);
      if (existingIdx !== -1) {
        updatedProjects[existingIdx] = optimisticProject;
      } else {
        updatedProjects = [optimisticProject, ...projects];
      }
    }

    set({ 
      projects: updatedProjects,
      currentProject: optimisticProject,
      isLoading: true,
      unsavedChanges: false, // Optimistically reset because we initiated sync
      error: null 
    });

    // 2. Background Synchronization
    try {
      const apiId = isNew ? null : id;
      const res = await gtApi.saveProject(project, files, apiId);

      if (res.success) {
        // Sync complete, apply real server ID
        const savedProject = { ...project, id: res.id || actualId };
        
        set({ 
          currentProject: savedProject,
          files: [],
          unsavedChanges: false
        });

        get().showToast('Проект успішно збережено та синхронізовано з Google Sheets! ⚡', 'success', 4000);

        // Silent refresh from server to keep database mirrors 100% aligned
        const refreshRes = await gtApi.fetchProjects();
        if (refreshRes.success && refreshRes.projects) {
          const mapped = refreshRes.projects.map((p) => toSemanticProject(p));
          set({ projects: mapped, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } else {
        // Server rejected or returned fail
        console.error('GAS Save Project Fail:', res.error);
        set({ 
          error: `Помилка збереження: ${res.error}`, 
          isLoading: false,
          unsavedChanges: true // Restore unsaved state on fail
        });

        get().showToast(
          `Помилка запису в Google Sheets! Зміни збережені локально. ❌`, 
          'error', 
          0 // Persistent Toast
        );
      }
    } catch (e) {
      // Network crash or parse crash
      console.error('GT Save Exception:', e);
      set({ 
        error: 'Помилка мережі при збереженні', 
        isLoading: false,
        unsavedChanges: true // Restore unsaved state on fail
      });

      get().showToast(
        `Збій з'єднання з Google Sheets! Зміни збережені локально. [Повторити 🔄]`, 
        'error', 
        0 // Keep active so user can click/retry
      );
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    
    const { projects, currentProject } = get();
    const updatedProjects = projects.filter((p) => p.id !== id);
    
    set({ 
      projects: updatedProjects,
      currentProject: currentProject?.id === id ? null : currentProject,
      isLoading: true,
      unsavedChanges: false
    });

    try {
      const res = await gtApi.deleteProject(id);
      if (res.success) {
        set({ isLoading: false });
        get().showToast('Проєкт успішно видалено! 🗑️', 'success', 4000);
      } else {
        const errMsg = res.error || 'Помилка видалення на сервері';
        set({ error: errMsg, isLoading: false });
        get().showToast(errMsg, 'error', 6000);
        get().fetchProjects();
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      set({ error: errMsg, isLoading: false });
      get().showToast(`Помилка видалення: ${errMsg}`, 'error', 6000);
      get().fetchProjects();
    }
  },

  loadProject: (id: string) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === id);

    if (!project) {
      console.warn('Project not found by ID:', id);
      return;
    }

    set({ 
      currentProject: { ...project },
      files: [],
      unsavedChanges: false
    });
  },

  resetForm: () => {
    const { projects } = get();
    const newProject = { ...EMPTY_PROJECT };
    newProject.projectNumber = generateProjectNumber(projects);
    
    set({ 
      currentProject: newProject, 
      files: [],
      unsavedChanges: false
    });
  },

  loadEquipment: async () => {
    const GT_CACHE_KEY = 'cso_gt_equipment_v1';
    const KP_CACHE_KEY = 'cso_products_cache_v48';

    const extractBrand = (model: string): string => {
      const brands = ['Huawei', 'Deye', 'Solis', 'Growatt', 'SolaX', 'GoodWe', 'Fronius',
                      'Longi', 'LONGi', 'Jinko', 'JA Solar', 'Trina', 'Risen'];
      for (const b of brands) {
        if (model.toLowerCase().includes(b.toLowerCase())) return b;
      }
      return '';
    };

    const classifyKp = (p: any): string => {
      const t = ((p.category || '') + ' ' + (p.name || '') + ' ' + (p.model || '')).toLowerCase();
      if (t.includes('інвертор') || t.includes('inverter') || t.includes('sun-') || t.includes('sih-') ||
          ['deye','huawei','solis','growatt','solax','goodwe','fronius'].some(b => t.includes(b))) return 'Інвертори';
      if ((t.includes('акб') || t.includes('bms') || t.includes('lifepo') || t.includes('lfp') || t.includes('батарея')) &&
           !t.includes('сонячна')) return 'АКБ та BMS';
      if (t.includes('панел') || t.includes('panel') || t.includes('сонячна батарея') ||
          ['longi','jinko','trina','risen','ja solar'].some(b => t.includes(b))) return 'Сонячні батареї';
      return '';
    };

    const buildAndSet = (allProducts: any[]) => {
      const getV = (p: any, keys: string[]) => {
        for (const k of keys) if (p[k] !== undefined && p[k] !== '') return String(p[k]);
        return '';
      };
      
      const cleanMfr = (s: string) => {
        if (!s) return '';
        let name = s.split('\n')[0].split('\r')[0].trim();
        const suffixes = ['Co., Ltd.', 'Ltd.', 'GmbH', 'Inc.', 'Corp.', 'Corporation', 'S.p.A.', 'LLC'];
        for (const f of suffixes) {
          const idx = name.toLowerCase().indexOf(f.toLowerCase());
          if (idx !== -1) return name.substring(0, idx + f.length).trim();
        }
        return name;
      };

      const mapCat = (cat: string) => allProducts
        .filter(p => p.mainCategory === cat)
        .map(p => {
          const rawMfr = getV(p, ['manufacturer', 'Виробник інвертора', 'Виробник сонячних панелей', 'Виробник', 'Бренд']);
          return {
            mainCategory: cat,
            model: getV(p, ['model', 'name', 'Модель', 'Інвертор', 'Сонячна панель', 'Модель АКБ']),
            manufacturer: cleanMfr(rawMfr) || extractBrand(getV(p, ['model', 'name', 'Модель', 'Інвертор'])),
            power: getV(p, ['power', 'Потужність', 'Короткий опис']),
            warranty: getV(p, ['warranty', 'Гарантія']),
          };
        })
        .filter(p => p.model && p.model.length > 2);

      const inverters = mapCat('Інвертори');
      const panels = mapCat('Сонячні батареї');
      const batteries = mapCat('АКБ та BMS');
      const inverterManufacturers = Array.from(new Set(inverters.map(i => i.manufacturer).filter(Boolean))) as string[];
      const panelManufacturers = Array.from(new Set(panels.map(p => p.manufacturer).filter(Boolean))) as string[];

      console.log('✅ GT v2 equipment loaded:', { inverters: inverters.length, panels: panels.length, batteries: batteries.length });
      
      set({
        equipment: {
          inverters, panels, batteries,
          inverterManufacturers: inverterManufacturers.length > 0 ? inverterManufacturers : ['Huawei', 'Deye', 'Growatt', 'Solis', 'SolaX'],
          panelManufacturers: panelManufacturers.length > 0 ? panelManufacturers : ['Longi', 'Jinko', 'JA Solar', 'Trina', 'Risen'],
        },
      });
      return inverters.length + panels.length;
    };

    try {
      // 1. Specific GT local cache
      const gtRaw = localStorage.getItem(GT_CACHE_KEY);
      if (gtRaw) {
        const data = JSON.parse(gtRaw);
        const products = data.products || [];
        if (products.length > 0 && buildAndSet(products) > 0) return;
      }

      // 2. Shared KP catalog cache
      const kpRaw = localStorage.getItem(KP_CACHE_KEY);
      if (kpRaw) {
        const kpData = JSON.parse(kpRaw);
        const kpProducts: any[] = kpData.products || [];
        if (kpProducts.length > 0) {
          const remapped = kpProducts
            .map(p => ({ ...p, mainCategory: p.mainCategory || classifyKp(p) }))
            .filter(p => p.mainCategory);
          if (remapped.length > 0 && buildAndSet(remapped) > 0) {
            localStorage.setItem(GT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: remapped }));
            return;
          }
        }
      }

      // 3. Fallback database endpoint
      try {
        const res = await gtApi.fetchEquipment();
        if (res.success && res.equipment) {
          const eq = res.equipment as { inverters: any[]; panels: any[]; batteries: any[] };
          const toProducts = (items: any[], cat: string) =>
            (items || []).map(i => ({ ...i, mainCategory: cat }));
          const allProducts = [
            ...toProducts(eq.inverters, 'Інвертори'),
            ...toProducts(eq.panels, 'Сонячні батареї'),
            ...toProducts(eq.batteries, 'АКБ та BMS'),
          ];
          if (allProducts.length > 0) {
            localStorage.setItem(GT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: allProducts }));
            buildAndSet(allProducts);
            return;
          }
        }
      } catch (e) {
        console.warn('GT v2: GAS fetchEquipment fallback failed:', e);
      }
    } catch (e) {
      console.error('GT v2: loadEquipment fail:', e);
    }
  },
}));
