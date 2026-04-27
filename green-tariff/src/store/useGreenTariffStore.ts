// ===== CSO Solar — Green Tariff Zustand Store =====

import { create } from 'zustand';
import type { GreenTariffState, GreenTariffProject, FileAttachment } from '../types';
import { gtApi } from '../services/api';

const EMPTY_PROJECT: GreenTariffProject = {
  field1: 'В процесі',
  field2: '',
  field3: '',
  field4: '',
  field5: '',
  field6: '',
  field7: '',
  field8: '',
  field9: '',
  field10: '',
  field11: '',
  field12: '',
  field13: '',
  field14: '',
  field15: '',
  field16: '',
  field17: '',
  field18: '',
  field19: '',
  field20: '',
  field21: '',
  field22: '',
  field23: '',
  field24: '',
  field25: '',
  field26: '',
  field27: '',
  field28: '',
  field29: '',
  field30: '',
  field31: '',
  field32: '',
  field33: '',
  field34: '',
  field35: '',
  field36: '',
  field37: '',
  field38: '',
  field39: '',
  field40: '',
  field41: '',
  field42: '',
  stationType: '',
};

// Mapping для пошуку полів у відповідях від GAS
const FIELD_MAPPING: Record<string, string[]> = {
  field1: ['Стан проєкту', 'Статус', 'Стан'],
  field2: ['Розрахунок', 'Оплата'],
  field3: ['№ проекту'],
  field4: ['ПІБ фізичної особи', 'ПІБ', 'Прізвище'],
  field5: ['ІПН', 'ІПН/ЄДРПОУ'],
  field6: [
    'реєстраційний номер об’єкта нерухомого майна',
    'Реєстраційний номер об\'єкта',
    'реєстраційний номер об’єкта', // curly variant
    'реєстраційний номер об\'єкта',
    'Реєстр. номер',
    'Реєстраційний номер об’єкта майна'
  ],
  field7: [
    'Номер запису про право власності',
    'Номер запису на право власності', // variant from audio
    'Запис про право власності',
    'Номер запису про право'
  ],
  field8: ['Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)', 'Унікальний номер', 'УНЗР'],
  field9: ['№ Договору', 'Номер договору', '№ договору', 'Договір №'],
  field10: ['Дата договору'],
  field11: ['Час тестування'],
  field12: ['EIC-код точки розподілу', 'EIC-код'],
  field13: ['Дозволена потужність', 'Дозволена потужність, кВт'],
  field14: ['Підстанція'],
  field15: ['Лінія'],
  field16: ['Опора'],
  field17: ['Лічильник'],
  field18: ['Напруга'],
  field19: ['Вхідний автомат'],
  field20: ['Відсікач'],
  field21: ['Місце розташування генеруючої установки', 'Адреса об\'єкта'],
  field22: ['Потужність генеруючих установок споживача, кВт', 'Сумарна потужність, кВт', 'Сумарна потужність'],
  field23: ['К-сть панелей', 'Кількість панелей'],
  field24: ['Місце встановлення панелей'],
  field25: ['електронною поштою', 'Email', 'Електронна пошта'],
  field26: ['конт телефон', 'Телефон', 'Контактний телефон'],
  field27: ['Інвертор', 'Модель інвертора'],
  field28: ['Потужність інвертора, кВт'],
  field29: ['с/н інвертора', 'Серійний номер інвертора'],
  field30: ['Виробник Інвертора'],
  field31: ['Прошивка інвертора', 'Прошивка'],
  field32: ['Гарантія на інвертор, р.'],
  field33: ['Виробник сонячних панелей'],
  field34: ['Сонячна панель', 'Модель панелі'],
  field35: ['Гарантія на панелі, років'],
  field36: ['Акумуляторна батарея', 'Модель АКБ', 'АКБ'],
  field37: ['Номінальна потужність, кВт*год', 'Номінальна потужність АКБ', 'Номінальна потужність батарей'],
  field38: ['Вартість робіт'],
  field39: ['Сума прописом'],
  field40: ['Паспортні дані'],
  field41: ['Аванс, USD'],
  field42: ['Залишок, USD'],
  field44: ['Коментар', 'Внутрішній коментар'],
  stationType: ['Тип станції', 'Модель станції'],
};

function getProp(obj: Record<string, unknown>, keys: string[]): string {
  if (!obj) return '';

  const normalize = (s: string) =>
    (s || '')
      .toString()
      .toLowerCase()
      .replace(/[\n\r"]/g, '')
      .replace(/[’'‘`]/g, "'") // Unify all apostrophe types
      .replace(/\s+/g, '')
      .trim();

  const objKeys = Object.keys(obj);

  // Прямий пошук
  for (const k of keys) {
    if (obj[k] !== undefined) return String(obj[k]);
    const normalizedK = normalize(k);
    const exactKey = objKeys.find((ak) => normalize(ak) === normalizedK);
    if (exactKey) return String(obj[exactKey]);
  }

  // М'який пошук для довгих назв
  for (const k of keys) {
    const normalizedK = normalize(k);
    if (normalizedK.length < 10) continue;

    const foundKey = objKeys.find((ak) => {
      if (!ak) return false;
      const normActual = normalize(ak);
      return normActual.includes(normalizedK) || normalizedK.includes(normActual);
    });
    if (foundKey) return String(obj[foundKey]);
  }

  return '';
}

function generateProjectNumber(projectsCount: number): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const count = (projectsCount + 1).toString().padStart(2, '0');
  return `${count}/${mm}-${yyyy}-ЦСО`;
}

export const useGreenTariffStore = create<GreenTariffState>((set, get) => ({
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

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await gtApi.fetchProjects();
      if (res.success) {
        const projects = (res.projects || []).map((p) => ({
          ...p,
          isStarred: p.field45 === '1',
        }));
        set({ projects, isLoading: false });
      } else {
        set({ error: res.error || 'Unknown error', isLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  saveProject: async (project: GreenTariffProject) => {
    set({ isLoading: true, error: null });
    try {
      const { files, currentProject } = get();
      const id = currentProject?.id || null;
      const res = await gtApi.saveProject(project, files, id);

      if (res.success) {
        set({ files: [], isLoading: false });
        await get().fetchProjects();
      } else {
        set({ error: res.error || 'Unknown error', isLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  loadProject: (id: string) => {
    const { projects } = get();
    let project: Record<string, unknown> | undefined;

    if (id.startsWith('idx_')) {
      const idx = parseInt(id.replace('idx_', ''));
      project = projects[idx] as unknown as Record<string, unknown>;
    } else {
      project = projects.find((p) => getProp(p as unknown as Record<string, unknown>, ['id', 'ID']) === id) as unknown as Record<string, unknown>;
    }

    if (!project) {
      console.warn('Project not found:', id);
      return;
    }

    const loadedProject: GreenTariffProject = { ...EMPTY_PROJECT };

    // Заповнюємо поля за мапінгом
    for (const fieldId in FIELD_MAPPING) {
      let value = project[fieldId];
      if (value === undefined || value === '') {
        value = getProp(project, FIELD_MAPPING[fieldId]);
      }

      // Форматування дат
      if (value && fieldId === 'field10') {
        const valStr = String(value);
        const dmyMatch = valStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (dmyMatch) {
          value = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        } else if (valStr.includes('T')) {
          value = valStr.split('T')[0];
        }
      }

      // Форматування чисел
      if (value && ['field13', 'field22', 'field23', 'field28', 'field37', 'field38'].includes(fieldId)) {
        value = String(value).replace(',', '.').replace(/[^\d.]/g, '');
      }

      (loadedProject as unknown as Record<string, string>)[fieldId] = String(value || '');
    }

    loadedProject.id = getProp(project, ['id', 'ID']);
    loadedProject.isStarred = loadedProject.field45 === '1';
    set({ currentProject: loadedProject });
  },

  resetForm: () => {
    const { projects } = get();
    const newProject = { ...EMPTY_PROJECT };
    newProject.field3 = generateProjectNumber(projects.length);
    set({ currentProject: newProject, files: [] });
  },

  setStatusFilter: (status: string) => {
    set({ activeStatusFilter: status });
  },

  addFile: (file: FileAttachment) => {
    set((state) => ({ files: [...state.files, file] }));
  },

  removeFile: (index: number) => {
    set((state) => ({ files: state.files.filter((_, i) => i !== index) }));
  },

  loadEquipment: async () => {
    const GT_CACHE_KEY = 'cso_gt_equipment_v1';
    const KP_CACHE_KEY = 'cso_products_cache_v48';

    // Extract brand from model name when manufacturer field is empty
    const extractBrand = (model: string): string => {
      const brands = ['Huawei', 'Deye', 'Solis', 'Growatt', 'SolaX', 'GoodWe', 'Fronius',
                      'Longi', 'LONGi', 'Jinko', 'JA Solar', 'Trina', 'Risen'];
      for (const b of brands) {
        if (model.toLowerCase().includes(b.toLowerCase())) return b;
      }
      return '';
    };

    // Classify product from KP cache into a GT category
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

    // Build final equipment state from a list of products with mainCategory field
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

      console.log('✅ GT equipment loaded:', { inverters: inverters.length, panels: panels.length, batteries: batteries.length });
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
      // ── Tier 1: Green-Tariff specific cache ──────────────────────────
      const gtRaw = localStorage.getItem(GT_CACHE_KEY);
      if (gtRaw) {
        const data = JSON.parse(gtRaw);
        const products = data.products || [];
        console.log('📦 GT cache found:', products.length, 'items');
        if (products.length > 0 && buildAndSet(products) > 0) return;
      }

      // ── Tier 2: KP cache (different format — remap) ──────────────────
      const kpRaw = localStorage.getItem(KP_CACHE_KEY);
      if (kpRaw) {
        const kpData = JSON.parse(kpRaw);
        const kpProducts: any[] = kpData.products || [];
        console.log('📦 KP cache found:', kpProducts.length, 'items — remapping...');
        if (kpProducts.length > 0) {
          const remapped = kpProducts
            .map(p => ({ ...p, mainCategory: p.mainCategory || classifyKp(p) }))
            .filter(p => p.mainCategory);
          if (remapped.length > 0 && buildAndSet(remapped) > 0) {
            // Save to GT cache for future fast access
            localStorage.setItem(GT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products: remapped }));
            return;
          }
        }
      }

      // ── Tier 3: Fetch from GAS (reads unique equipment from projects sheet) ──
      console.log('📡 GT: Fetching equipment via GAS...');
      try {
        const res = await gtApi.fetchEquipment();
        if (res.success && res.equipment) {
          const eq = res.equipment as { inverters: any[]; panels: any[]; batteries: any[] };
          // Add mainCategory for buildAndSet compatibility
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
        console.warn('GT: GAS fetchEquipment failed:', e);
      }

      console.warn('GT: All equipment sources exhausted');
    } catch (e) {
      console.error('GT: loadEquipment error:', e);
    }
  },
  toggleStar: async (id: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const updatedProject = {
      ...project,
      isStarred: !project.isStarred,
      field45: !project.isStarred ? '1' : ''
    };

    // Optimistically update local state
    set(state => ({
      projects: state.projects.map(p => p.id === id ? updatedProject : p),
      currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject
    }));

    try {
      const res = await gtApi.saveProject(updatedProject, [], id);
      if (!res.success) {
        console.error('Failed to toggle star in GAS:', res.error);
        // Rollback on failure? Maybe later.
      }
    } catch (e) {
      console.error('Error toggling star:', e);
    }
  },
}));
