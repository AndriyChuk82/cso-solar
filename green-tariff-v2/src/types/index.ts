// ===== CSO Solar — Green Tariff v2 TypeScript Types =====

export interface SemanticProject {
  id?: string;
  status: string;                 // field1
  paymentStatus: string;          // field2
  projectNumber: string;          // field3
  fullName: string;               // field4
  taxId: string;                  // field5
  propertyRegNumber: string;      // field6
  titleDeedNumber: string;        // field7
  unzr: string;                   // field8
  contractNumber: string;         // field9
  contractDate: string;           // field10
  testingTime: string;            // field11
  eicCode: string;                // field12
  permittedPower: string;         // field13
  substation: string;             // field14
  line: string;                   // field15
  utilityPole: string;            // field16
  meterModel: string;             // field17
  voltage: string;                // field18
  inputBreaker: string;           // field19
  voltageProtector: string;       // field20
  installationLocation: string;   // field21
  totalPanelPower: string;        // field22
  panelCount: string;             // field23
  panelInstallationLocation: string; // field24
  email: string;                  // field25
  phone: string;                  // field26
  inverterModel: string;          // field27
  inverterPower: string;          // field28
  inverterSerialNumber: string;   // field29
  inverterManufacturer: string;   // field30
  inverterFirmware: string;       // field31
  inverterWarranty: string;       // field32
  panelManufacturer: string;      // field33
  panelModel: string;             // field34
  panelWarranty: string;          // field35
  batteryModel: string;           // field36
  batteryPower: string;           // field37
  workCost: string;               // field38
  workCostInWords: string;        // field39
  passportData: string;           // field40
  advanceUsd: string;             // field41
  balanceUsd: string;             // field42
  stationType: string;            // field43
  internalComment: string;        // field44
  reserve: string;                // field45
  folderUrl?: string;
  createdAt?: string;
}

// Low-level raw GAS project representation
export interface RawGASProject {
  id?: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  field5: string;
  field6: string;
  field7: string;
  field8: string;
  field9: string;
  field10: string;
  field11: string;
  field12: string;
  field13: string;
  field14: string;
  field15: string;
  field16: string;
  field17: string;
  field18: string;
  field19: string;
  field20: string;
  field21: string;
  field22: string;
  field23: string;
  field24: string;
  field25: string;
  field26: string;
  field27: string;
  field28: string;
  field29: string;
  field30: string;
  field31: string;
  field32: string;
  field33: string;
  field34: string;
  field35: string;
  field36: string;
  field37: string;
  field38: string;
  field39: string;
  field40: string;
  field41: string;
  field42: string;
  field43?: string; // Type of station
  field44?: string; // Internal comment
  field45?: string; // Reserve
  folderurl?: string;
  createdat?: string;
  [key: string]: any;
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

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface GTStoreState {
  projects: SemanticProject[];
  currentProject: SemanticProject | null;
  activeStatusFilter: string;
  files: FileAttachment[];
  equipment: Equipment;
  isLoading: boolean;
  error: string | null;
  toasts: ToastMessage[];
  unsavedChanges: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  saveProject: (project: SemanticProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  loadProject: (id: string) => void;
  resetForm: () => void;
  setStatusFilter: (status: string) => void;
  addFile: (file: FileAttachment) => void;
  removeFile: (index: number) => void;
  loadEquipment: () => Promise<void>;
  setUnsavedChanges: (hasChanges: boolean) => void;
  showToast: (text: string, type: 'info' | 'success' | 'error' | 'warning', duration?: number) => void;
  removeToast: (id: string) => void;
  retrySync: (project: SemanticProject) => Promise<void>;
}

export interface GASResponse {
  success: boolean;
  id?: string;
  error?: string;
  warning?: string;
  stack?: string;
  projects?: RawGASProject[];
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
  formData: SemanticProject & { currentDate: string; useSign: boolean };
  photos: {
    photo1: string;
    photo2: string;
    photo3: string;
  };
}
