// ===== CSO Solar — Green Tariff Types =====

export interface GreenTariffProject {
  id?: string;
  field1: string;  // Стан проєкту
  field2: string;  // Розрахунок
  field3: string;  // № проекту
  field4: string;  // ПІБ фізичної особи
  field5: string;  // ІПН
  field6: string;  // Реєстраційний номер об'єкта нерухомості
  field7: string;  // Номер запису про право власності
  field8: string;  // УНЗР
  field9: string;  // № Договору
  field10: string; // Дата договору
  field11: string; // Час тестування
  field12: string; // EIC-код
  field13: string; // Дозволена потужність
  field14: string; // Підстанція
  field15: string; // Лінія
  field16: string; // Опора
  field17: string; // Лічильник
  field18: string; // Напруга
  field19: string; // Вхідний автомат
  field20: string; // Відсікач
  field21: string; // Місце розташування установки
  field22: string; // Потужність генеруючих установок
  field23: string; // К-сть панелей
  field24: string; // Місце встановлення панелей
  field25: string; // Email
  field26: string; // Телефон
  field27: string; // Інвертор (модель)
  field28: string; // Потужність інвертора
  field29: string; // С/н інвертора
  field30: string; // Виробник інвертора
  field31: string; // Прошивка інвертора
  field32: string; // Гарантія на інвертор
  field33: string; // Виробник сонячних панелей
  field34: string; // Сонячна панель (модель)
  field35: string; // Гарантія на панелі
  field36: string; // Акумуляторна батарея
  field37: string; // Номінальна потужність АКБ
  field38: string; // Вартість робіт
  field39: string; // Сума прописом
  field40: string; // Паспортні дані
  field41: string; // Аванс, USD
  field42: string; // Залишок, USD
  field43?: string; // Тип станції
  field44?: string; // Внутрішній коментар (не для друку)
  field45?: string; // Резерв
}

export interface EquipmentItem {
  model: string;
  mainCategory: string;
  manufacturer?: string;
  power?: string;
  warranty?: string;
}

export interface Equipment {
  inverters: EquipmentItem[];
  panels: EquipmentItem[];
  batteries: EquipmentItem[];
  inverterManufacturers: string[];
  panelManufacturers: string[];
}

export interface FileAttachment {
  name: string;
  type: string;
  base64: string;
}

export interface GreenTariffState {
  projects: GreenTariffProject[];
  currentProject: GreenTariffProject | null;
  activeStatusFilter: string;
  files: FileAttachment[];
  equipment: Equipment;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  saveProject: (project: GreenTariffProject) => Promise<void>;
  loadProject: (id: string) => void;
  resetForm: () => void;
  setStatusFilter: (status: string) => void;
  addFile: (file: FileAttachment) => void;
  removeFile: (index: number) => void;
  loadEquipment: () => void;
}

export interface GASResponse {
  success: boolean;
  id?: string;
  error?: string;
  warning?: string;
  stack?: string;
  projects?: GreenTariffProject[];
  filesUploaded?: number;
  errors?: string[];
  equipment?: {
    inverters: Array<{ model: string; manufacturer: string; power?: string; warranty?: string }>;
    panels: Array<{ model: string; manufacturer: string; warranty?: string }>;
    batteries: Array<{ model: string; power?: string }>;
  };
}

export interface DocumentGenerationData {
  selected: string[];
  formData: GreenTariffProject & { currentDate: string; useSign: boolean };
  photos: {
    photo1: string;
    photo2: string;
    photo3: string;
  };
}
