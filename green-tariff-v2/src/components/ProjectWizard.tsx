// ===== CSO Solar — Green Tariff v2 Master Project Wizard =====

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGTStore } from '../store/useGTStore';
import { FileUpload } from './FileUpload';
import { DocumentGenerator } from './DocumentGenerator';
import type { SemanticProject } from '../types';
import { 
  ChevronDown, X, Check, ArrowRight, ArrowLeft, Save, Trash2, 
  User, Home, Layers, Cpu, CreditCard, Clipboard, Loader2, Download 
} from 'lucide-react';
import { fetchSpecsFileList } from '../services/api';
import { supabase } from '../services/supabaseClient';

const STATUS_OPTIONS = ['В процесі', 'Відкладено', 'Готовий'];
const PAYMENT_OPTIONS = ['Оплачено', 'Не оплачено'];
const VOLTAGE_OPTIONS = ['220 В', '380 В'];
const METER_OPTIONS = ['ISKRA AM 550 5(100)A', 'NIK 2303 АР1 5(100)А', 'NIK 2101 AP1', 'NIK 2303 АР1 5(100)А', 'NIK 2301 АР3 5(120)А', 'NIK 2104 AP2T'];
const BREAKER_OPTIONS = ['20А', '25А', '32А', '40А', '50А', '63А'];
const STATION_TYPE_OPTIONS = ['Мережева станція', 'Гібридна станція'];

const STEPS = [
  { id: 1, label: 'Загальна', icon: Clipboard },
  { id: 2, label: 'Замовник', icon: User },
  { id: 3, label: 'Об\'єкт', icon: Home },
  { id: 4, label: 'Мережа', icon: Layers },
  { id: 5, label: 'Обладнання', icon: Cpu },
  { id: 6, label: 'Кошторис / Друк', icon: CreditCard },
];

// Обов'язкові поля для кожного кроку (користувач може легко змінити цей список)
export const REQUIRED_FIELDS_BY_STEP: Record<number, (keyof SemanticProject)[]> = {
  1: ['status', 'projectNumber', 'stationType', 'testingTime'],
  2: ['fullName', 'phone', 'taxId'],
  3: ['propertyRegNumber', 'installationLocation', 'titleDeedNumber', 'contractDate', 'contractNumber'],
  4: ['eicCode', 'permittedPower', 'meterModel', 'substation', 'line', 'utilityPole', 'voltage', 'inputBreaker'],
  5: ['inverterModel', 'panelModel', 'panelCount', 'inverterPower', 'inverterSerialNumber', 'totalPanelPower', 'panelInstallationLocation', 'inverterFirmware'],
  6: [],
};

// Розрахунок оцінки відповідності імені файлу та назви моделі (від 0 до 100)
function calculateMatchScore(fileName: string, modelName: string): number {
  const normalizeText = (text: string) => {
    return text.toLowerCase()
      .replace(/bificial/g, 'bifacial')
      .replace(/bificual/g, 'bifacial')
      .replace(/bifacual/g, 'bifacial')
      .replace(/ghd/g, 'hgd') // Treat GHD and HGD as equivalent for matching certificates
      .replace(/[^a-z0-9]/g, '');
  };

  const normFile = normalizeText(fileName);
  const normModel = normalizeText(modelName);
  
  // 1. Повний збіг (без розділювачів)
  if (normFile.includes(normModel)) return 100;
  
  // Очищення назви бренду з початку моделі
  const cleanModel = modelName.replace(/^(huawei|longi|deye|solis|fronius|ja solar|jinko|risen|canadian|trina|akb|pylontech|dahua|must|victron|growatt|altek)\s+/i, '').trim();
  const cleanNormModel = normalizeText(cleanModel);
  if (normFile.includes(cleanNormModel)) return 90;
  
  // Розбиваємо модель на окремі слова/коди
  const words = cleanModel.split(/[\s\-_/\\+]+/i)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length >= 2);
    
  if (words.length === 0) return 0;
  
  let matchCount = 0;
  let hasSpecificCode = false; // Наявність специфічного буквено-цифрового коду (як-от 'sg05lp3' або 'sg02hp3')
  
  for (const word of words) {
    const cleanWord = normalizeText(word);
    if (cleanWord.length === 0) continue;
    
    if (normFile.includes(cleanWord)) {
      matchCount++;
      // Якщо слово містить і букви, і цифри, або є унікальним кодом моделі
      const originalWordClean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if ((/[a-z]/.test(originalWordClean) && /[0-9]/.test(originalWordClean) && originalWordClean.length >= 4) || originalWordClean.length >= 6) {
        hasSpecificCode = true;
      }
    }
  }
  
  // Розрахунок відсотка збігів по словах
  const wordMatchRatio = matchCount / words.length;
  let score = wordMatchRatio * 50;
  
  if (hasSpecificCode) {
    score += 35; // Бонус за збіг унікального коду моделі
  }
  
  // Бонус за збіг бренду
  const brands = ['deye', 'huawei', 'longi', 'solis', 'growatt', 'victron', 'must', 'pylontech', 'fronius', 'altek'];
  const brandMatch = brands.find(b => {
    return modelName.toLowerCase().includes(b) && fileName.toLowerCase().includes(b);
  });
  if (brandMatch) {
    score += 15;
  }
  
  return score;
}

// Пошук найкращого збігу серед наявних файлів у бакеті Supabase
function findBestMatchingFile(modelName: string | undefined, files: string[]): { name: string; url: string } | null {
  if (!modelName || files.length === 0) return null;
  
  let bestMatchName = '';
  let bestScore = 0;
  
  for (const file of files) {
    const score = calculateMatchScore(file, modelName);
    if (score > bestScore) {
      bestScore = score;
      bestMatchName = file;
    }
  }
  
  // Поріг відповідності 55 балів для запобігання випадковим збігам
  if (supabase && bestMatchName && bestScore >= 55) {
    const { data } = supabase.storage.from('equipment-specs').getPublicUrl(bestMatchName);
    return {
      name: bestMatchName,
      url: data.publicUrl
    };
  }
  
  return null;
}

export function ProjectWizard() {
  const { 
    currentProject, 
    saveProject, 
    deleteProject,
    resetForm, 
    equipment, 
    isLoading, 
    setUnsavedChanges,
    loadEquipment,
    projects
  } = useGTStore();

  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState<SemanticProject | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Collect unique inverter firmware versions from all projects for suggestions
  const firmwareOptions = useMemo(() => {
    const uniqueFirmwares = new Set<string>();
    projects.forEach((p) => {
      if (p.inverterFirmware) {
        const val = p.inverterFirmware.trim();
        if (val) {
          uniqueFirmwares.add(val);
        }
      }
    });
    return Array.from(uniqueFirmwares).sort();
  }, [projects]);

  const [specsFiles, setSpecsFiles] = useState<string[]>([]);
  const [isSpecsLoading, setIsSpecsLoading] = useState(false);

  // Динамічний підбір сертифікатів на основі завантаженого списку файлів
  const matchedCerts = useMemo(() => {
    return {
      inverterCert: findBestMatchingFile(formData?.inverterModel, specsFiles),
      panelCert: findBestMatchingFile(formData?.panelModel, specsFiles)
    };
  }, [formData?.inverterModel, formData?.panelModel, specsFiles]);

  // Load equipment catalog once on mount
  useEffect(() => {
    loadEquipment();
    
    // Fetch files list from Supabase Storage bucket 'equipment-specs'
    const loadSpecs = async () => {
      setIsSpecsLoading(true);
      try {
        const files = await fetchSpecsFileList();
        setSpecsFiles(files);
      } catch (e) {
        console.error('Error loading specs files list:', e);
      } finally {
        setIsSpecsLoading(false);
      }
    };
    loadSpecs();
  }, []);

  // Update local formData when store's currentProject changes
  useEffect(() => {
    if (currentProject) {
      setFormData({ ...currentProject });
    } else {
      setFormData(null);
    }
  }, [currentProject]);

  // Form modification handler
  const handleChange = (field: keyof SemanticProject, value: string) => {
    if (!formData) return;

    setUnsavedChanges(true);

    setFormData((prev) => {
      if (!prev) return null;
      const newData = { ...prev, [field]: value };
      
      // 1. Auto-convert work cost to words
      if (field === 'workCost' && value) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          newData.workCostInWords = numberToWordsUA(num);
        } else {
          newData.workCostInWords = '';
        }
      }

      // 2. Inverter model change -> Autofill
      if (field === 'inverterModel') {
        const inv = equipment.inverters.find(i => i.model === value);
        if (inv) {
          if (inv.manufacturer) newData.inverterManufacturer = inv.manufacturer;
          if (inv.power) newData.inverterPower = inv.power;
          if (inv.warranty) newData.inverterWarranty = inv.warranty;
        }
      }

      // 3. Panel model change -> Autofill & Recalculate
      if (field === 'panelModel') {
        const p = equipment.panels.find(p => p.model === value);
        if (p) {
          if (p.manufacturer) newData.panelManufacturer = p.manufacturer;
          if (p.warranty) newData.panelWarranty = p.warranty;
        }
      }

      // 4. Recalculate Total Panel Power if Panel Model or Count changed
      if (field === 'panelModel' || field === 'panelCount') {
        const targetModel = field === 'panelModel' ? value : newData.panelModel;
        const targetCount = field === 'panelCount' ? value : newData.panelCount;
        
        const p = equipment.panels.find(p => p.model === targetModel);
        if (p && p.power) {
          const perPanelPower = parseFloat(p.power.replace(/[^\d.]/g, '')) / 1000; // W to kW
          const count = parseInt(targetCount);
          if (!isNaN(perPanelPower) && !isNaN(count)) {
            newData.totalPanelPower = (perPanelPower * count).toFixed(3);
          }
        }
      }

      return newData;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await saveProject(formData);
    }
  };

  const handleClear = () => {
    if (window.confirm('Ви впевнені, що хочете очистити форму? Всі незбережені зміни буде втрачено.')) {
      resetForm();
      setActiveStep(1);
    }
  };

  // Determine if a step is structurally "complete" (for checklist tracker green checks)
  const isStepComplete = (stepId: number): boolean => {
    if (!formData) return false;
    const reqFields = REQUIRED_FIELDS_BY_STEP[stepId] || [];
    return reqFields.every(field => !!formData[field]?.trim());
  };

  if (!formData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 bg-white/40 dark:bg-slate-900/10 transition-all">
        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-3xl text-gray-400 dark:text-slate-500">
          <Clipboard className="w-10 h-10 text-[#f59e0b] animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">Оберіть проєкт зі списку</h3>
          <p className="text-xs text-gray-500 dark:text-slate-500 max-w-xs">Або створіть новий проєкт натиснувши кнопку "+ Новий" у бічній панелі</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#fbfaf5] dark:bg-[#0f172a] transition-colors duration-300">
      
      {/* 1. Header Horizontal Stepper Tracker */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 px-6 py-4 flex-shrink-0 transition-all">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = isStepComplete(step.id);
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className="flex items-center gap-2 group outline-none select-none text-left flex-shrink-0"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                      isActive
                        ? isCompleted
                          ? 'bg-[#f59e0b] text-white shadow-md shadow-[#f59e0b]/20 scale-105'
                          : 'bg-[#f59e0b] text-white shadow-md shadow-[#f59e0b]/20 scale-105 ring-2 ring-red-500/50 ring-offset-2 dark:ring-offset-slate-900'
                        : isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/35'
                          : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100/50 dark:hover:bg-red-950/50'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="hidden sm:block">
                      <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isActive 
                          ? 'text-[#f59e0b]' 
                          : isCompleted 
                            ? 'text-gray-400 dark:text-slate-500' 
                            : 'text-red-500 dark:text-red-400/80'
                      }`}>
                        Крок {step.id}
                        {!isCompleted && <span className="text-[10px] text-red-500 font-extrabold animate-pulse">!</span>}
                      </div>
                      <div className={`text-xs font-bold ${
                        isActive 
                          ? 'text-gray-900 dark:text-white' 
                          : isCompleted 
                            ? 'text-gray-600 dark:text-slate-400 group-hover:text-[#f59e0b]' 
                            : 'text-red-700/80 dark:text-red-400/80 group-hover:text-red-600'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="hidden sm:block flex-1 h-[2px] bg-gray-200 dark:bg-slate-800 max-w-[48px] rounded" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2">
            {formData && formData.id && !formData.id.startsWith('temp_') && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 hover:text-white border border-red-200 dark:border-red-900/50 hover:bg-red-500 hover:border-red-500 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Видалити
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#f59e0b] hover:bg-[#d97706] rounded-xl shadow-md shadow-[#f59e0b]/15 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Збереження...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Зберегти в Sheets
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Wizard Body Forms */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm min-h-[380px] transition-all">
          
          {/* Step 1: General Info */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-slide-in">
              <div className="border-b border-gray-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">📝 Загальна інформація про проєкт</h3>
                <p className="text-[11px] text-gray-500">Основні статуси, нумерація та супроводжуючі коментарі</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Стан проєкту" required>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(v) => handleChange('status', v)}
                    options={STATUS_OPTIONS}
                  />
                </FormField>
                
                <FormField label="Розрахунок">
                  <SearchableSelect
                    value={formData.paymentStatus}
                    onChange={(v) => handleChange('paymentStatus', v)}
                    options={PAYMENT_OPTIONS}
                  />
                </FormField>

                <FormField label="№ проекту (Договірний)" required>
                  <Input 
                    value={formData.projectNumber} 
                    onChange={(v) => handleChange('projectNumber', v)} 
                    placeholder="Напр. 05/09-2026-ЦСО" 
                  />
                </FormField>

                <FormField label="Час тестування" required>
                  <Input 
                    type="date" 
                    value={formData.testingTime} 
                    onChange={(v) => handleChange('testingTime', v)} 
                  />
                </FormField>

                <FormField label="Тип станції" required>
                  <SearchableSelect
                    value={formData.stationType}
                    onChange={(v) => handleChange('stationType', v)}
                    options={STATION_TYPE_OPTIONS}
                  />
                </FormField>

                <FormField label="Коментар (внутрішній для себе)">
                  <Input 
                    value={formData.internalComment} 
                    onChange={(v) => handleChange('internalComment', v)} 
                    placeholder="Наприклад: 'Терміново доробити'" 
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Customer Data */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-slide-in">
              <div className="border-b border-gray-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">👤 Особисті дані замовника</h3>
                <p className="text-[11px] text-gray-500">Паспортні реквізити, ідентифікаційні коди та контакти клієнта</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="ПІБ замовника (фізичної особи)" required>
                  <Input 
                    value={formData.fullName} 
                    onChange={(v) => handleChange('fullName', v)} 
                    placeholder="Прізвище Ім'я По батькові" 
                  />
                </FormField>

                <FormField label="Паспортні дані">
                  <Input 
                    value={formData.passportData} 
                    onChange={(v) => handleChange('passportData', v)} 
                    placeholder="Серія, Номер, ким і коли виданий" 
                  />
                </FormField>

                <FormField label="Ідентифікаційний код (РНОКПП / ІПН)" required>
                  <Input 
                    value={formData.taxId} 
                    onChange={(v) => handleChange('taxId', v)} 
                    placeholder="10-значний числовий код" 
                  />
                </FormField>

                <FormField label="УНЗР в демографічному реєстрі (за наявності)">
                  <Input 
                    value={formData.unzr} 
                    onChange={(v) => handleChange('unzr', v)} 
                    placeholder="ХХХХХХХХ-ХХХХХ" 
                  />
                </FormField>

                <FormField label="Контактна електронна пошта">
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={(v) => handleChange('email', v)} 
                    placeholder="client@mail.com" 
                  />
                </FormField>

                <FormField label="Контактний номер телефону" required>
                  <Input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(v) => handleChange('phone', v)} 
                    placeholder="+380..." 
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 3: Property & Contract */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-slide-in">
              <div className="border-b border-gray-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">🏠 Об'єкт нерухомості та договори</h3>
                <p className="text-[11px] text-gray-500">Реєстраційні номери майна, право власності та адреси</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Реєстраційний номер нерухомого майна" required>
                  <Input 
                    value={formData.propertyRegNumber} 
                    onChange={(v) => handleChange('propertyRegNumber', v)} 
                    placeholder="Напр: 254879658012"
                  />
                </FormField>

                <FormField label="Номер запису про право власності" required>
                  <Input 
                    value={formData.titleDeedNumber} 
                    onChange={(v) => handleChange('titleDeedNumber', v)} 
                    placeholder="Напр: 4587965"
                  />
                </FormField>

                <FormField label="Місце розташування установки (Адреса)" fullWidth required>
                  <Textarea 
                    value={formData.installationLocation} 
                    onChange={(v) => handleChange('installationLocation', v)} 
                    placeholder="Повна адреса розташування об'єкта"
                    rows={2}
                  />
                </FormField>

                <FormField label="Номер договору обленерго" required>
                  <Input 
                    value={formData.contractNumber} 
                    onChange={(v) => handleChange('contractNumber', v)} 
                    placeholder="№ Договору"
                  />
                </FormField>

                <FormField label="Дата підписання договору" required>
                  <Input 
                    type="date" 
                    value={formData.contractDate} 
                    onChange={(v) => handleChange('contractDate', v)} 
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 4: Grid & Substation */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-slide-in">
              <div className="border-b border-gray-100 dark:border-slate-800/80 pb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">🔌 Технічні умови підключення та мережа</h3>
                <p className="text-[11px] text-gray-500">Параметри дозволених потужностей, точки приєднання та лічильники</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="EIC-код точки розподілу" required>
                  <Input 
                    value={formData.eicCode} 
                    onChange={(v) => handleChange('eicCode', v)} 
                    placeholder="32Z..."
                  />
                </FormField>

                <FormField label="Дозволена потужність приєднання, кВт" required>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={formData.permittedPower} 
                    onChange={(v) => handleChange('permittedPower', v)} 
                  />
                </FormField>

                <FormField label="Договірна напруга приєднання" required>
                  <SearchableSelect 
                    value={formData.voltage} 
                    onChange={(v) => handleChange('voltage', v)} 
                    options={VOLTAGE_OPTIONS} 
                  />
                </FormField>

                <FormField label="Вхідний захисний автомат" required>
                  <SearchableSelect 
                    value={formData.inputBreaker} 
                    onChange={(v) => handleChange('inputBreaker', v)} 
                    options={BREAKER_OPTIONS} 
                  />
                </FormField>

                <FormField label="Модель лічильника метрології" required>
                  <SearchableSelect 
                    value={formData.meterModel} 
                    onChange={(v) => handleChange('meterModel', v)} 
                    options={METER_OPTIONS} 
                  />
                </FormField>

                <FormField label="Параметри відсікача / обмежувача">
                  <Input 
                    value={formData.voltageProtector} 
                    onChange={(v) => handleChange('voltageProtector', v)} 
                    placeholder="Напр. Зубр 40А"
                  />
                </FormField>

                <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3">
                  <FormField label="Назва підстанції (ТП/КТП)" required>
                    <Input 
                      value={formData.substation} 
                      onChange={(v) => handleChange('substation', v)} 
                      placeholder="Напр. ТП-452"
                    />
                  </FormField>

                  <FormField label="Назва лінії (ЛЕД / ПЛ)" required>
                    <Input 
                      value={formData.line} 
                      onChange={(v) => handleChange('line', v)} 
                      placeholder="Напр. ПЛ-10кВ"
                    />
                  </FormField>

                  <FormField label="Опора №" required>
                    <Input 
                      value={formData.utilityPole} 
                      onChange={(v) => handleChange('utilityPole', v)} 
                      placeholder="Опора №"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Equipment */}
          {activeStep === 5 && (
            <div className="space-y-6 animate-slide-in">
              {/* Inverter Box */}
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800/80 pb-1">
                  <h3 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">📠 Інверторне обладнання</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Виробник інвертора">
                    <SearchableSelect
                      value={formData.inverterManufacturer}
                      onChange={(v) => handleChange('inverterManufacturer', v)}
                      options={equipment.inverterManufacturers}
                    />
                  </FormField>

                   <FormField label="Модель інвертора (Каталог)" required>
                    <SearchableSelect
                      value={formData.inverterModel}
                      placeholder="Оберіть модель..."
                      onChange={(v) => handleChange('inverterModel', v)}
                      options={equipment.inverters.map(i => ({
                        value: i.model,
                        label: i.model,
                        search: `${i.manufacturer || ''} ${i.model}`
                      }))}
                    />
                    {isSpecsLoading ? (
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Пошук сертифіката інвертора...
                      </div>
                    ) : matchedCerts.inverterCert ? (
                      <div className="mt-1 flex">
                        <a 
                          href={matchedCerts.inverterCert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Завантажити сертифікат інвертора
                        </a>
                      </div>
                    ) : formData.inverterModel ? (
                      <div className="text-[10px] text-gray-400 mt-1 italic">
                        Сертифікат не знайдено в сховищі
                      </div>
                    ) : null}
                  </FormField>

                  <FormField label="Потужність інвертора, кВт" required>
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={formData.inverterPower} 
                      onChange={(v) => handleChange('inverterPower', v)} 
                    />
                  </FormField>

                  <FormField label="Серійний номер інвертора" required>
                    <Input 
                      value={formData.inverterSerialNumber} 
                      onChange={(v) => handleChange('inverterSerialNumber', v)} 
                      placeholder="S/N інвертора"
                    />
                  </FormField>

                  <FormField label="Версія прошивки інвертора" required>
                    <SearchableSelect 
                      value={formData.inverterFirmware} 
                      onChange={(v) => handleChange('inverterFirmware', v)} 
                      options={firmwareOptions}
                      placeholder="Виберіть із раніше збережених або введіть нову..."
                    />
                  </FormField>

                  <FormField label="Гарантія на інвертор (років)">
                    <Input 
                      type="number" 
                      value={formData.inverterWarranty} 
                      onChange={(v) => handleChange('inverterWarranty', v)} 
                    />
                  </FormField>
                </div>
              </div>

              {/* Panel Box */}
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800/80 pb-1">
                  <h3 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">☀️ Сонячні панелі</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Виробник сонячних панелей">
                    <SearchableSelect
                      value={formData.panelManufacturer}
                      onChange={(v) => handleChange('panelManufacturer', v)}
                      options={equipment.panelManufacturers}
                    />
                  </FormField>

                   <FormField label="Модель сонячної панелі (Каталог)" required>
                    <SearchableSelect
                      value={formData.panelModel}
                      placeholder="Оберіть модель..."
                      onChange={(v) => handleChange('panelModel', v)}
                      options={equipment.panels.map(p => ({
                        value: p.model,
                        label: p.model,
                        search: `${p.manufacturer || ''} ${p.model}`
                      }))}
                    />
                    {isSpecsLoading ? (
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Пошук сертифіката панелі...
                      </div>
                    ) : matchedCerts.panelCert ? (
                      <div className="mt-1 flex">
                        <a 
                          href={matchedCerts.panelCert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Завантажити сертифікат панелі
                        </a>
                      </div>
                    ) : formData.panelModel ? (
                      <div className="text-[10px] text-gray-400 mt-1 italic">
                        Сертифікат не знайдено в сховищі
                      </div>
                    ) : null}
                  </FormField>

                  <FormField label="Кількість сонячних панелей, шт" required>
                    <Input 
                      type="number" 
                      value={formData.panelCount} 
                      onChange={(v) => handleChange('panelCount', v)} 
                    />
                  </FormField>

                  <FormField label="Розрахункова сумарна потужність панелей, кВт" required>
                    <Input 
                      type="number" 
                      step="any" 
                      value={formData.totalPanelPower} 
                      onChange={(v) => handleChange('totalPanelPower', v)} 
                    />
                  </FormField>

                  <FormField label="Місце встановлення панелей" required>
                    <Input 
                      value={formData.panelInstallationLocation} 
                      onChange={(v) => handleChange('panelInstallationLocation', v)} 
                      placeholder="Дах будинку / Наземна металоконструкція"
                    />
                  </FormField>

                  <FormField label="Гарантія на панелі (років)">
                    <Input 
                      type="number" 
                      value={formData.panelWarranty} 
                      onChange={(v) => handleChange('panelWarranty', v)} 
                    />
                  </FormField>
                </div>
              </div>

              {/* Battery Box */}
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800/80 pb-1">
                  <h3 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider">🔋 Системи накопичення енергії (АКБ)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Модель акумуляторної батареї">
                    <SearchableSelect
                      value={formData.batteryModel}
                      placeholder="Оберіть модель АКБ..."
                      onChange={(v) => handleChange('batteryModel', v)}
                      options={equipment.batteries.map((b) => ({
                        value: b.model,
                        label: b.model,
                        search: `${b.manufacturer || ''} ${b.model}`
                      }))}
                    />
                  </FormField>

                  <FormField label="Номінальна потужність батарей, кВт*год">
                    <Input 
                      type="number" 
                      step="any" 
                      value={formData.batteryPower} 
                      onChange={(v) => handleChange('batteryPower', v)} 
                    />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Finances & Prints */}
          {activeStep === 6 && (
            <div className="space-y-6 animate-slide-in">
              <div className="space-y-4">
                <div className="border-b border-gray-100 dark:border-slate-800/80 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">💰 Фінансова сторона підряду</h3>
                  <p className="text-[11px] text-gray-500">Дата договору, кошториси, аванси та залишкові суми</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Дата договору підряду">
                    <Input 
                      type="date" 
                      value={formData.serviceContractDate || ''} 
                      onChange={(v) => handleChange('serviceContractDate', v)} 
                    />
                  </FormField>

                  <FormField label="Повна вартість робіт, грн">
                    <Input 
                      type="number" 
                      value={formData.workCost} 
                      onChange={(v) => handleChange('workCost', v)} 
                      placeholder="Напр. 750000"
                    />
                  </FormField>

                  <FormField label="Вартість прописом (Гривень) — генерується автоматично">
                    <Input 
                      value={formData.workCostInWords} 
                      onChange={(v) => handleChange('workCostInWords', v)} 
                      placeholder="Сімсот п'ятдесят тисяч"
                    />
                  </FormField>

                  <FormField label="Отриманий аванс, USD">
                    <Input 
                      type="number" 
                      value={formData.advanceUsd} 
                      onChange={(v) => handleChange('advanceUsd', v)} 
                    />
                  </FormField>

                  <FormField label="Кінцевий залишок, USD">
                    <Input 
                      type="number" 
                      value={formData.balanceUsd} 
                      onChange={(v) => handleChange('balanceUsd', v)} 
                    />
                  </FormField>
                </div>
              </div>

              {/* Document Generator Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80">
                <DocumentGenerator formData={formData} matchedCerts={matchedCerts} />
              </div>
            </div>
          )}

        </div>
      </form>

      {/* 3. Sticky Bottom Actions panel */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-slate-800/50 px-6 py-4 flex-shrink-0 flex items-center justify-between transition-all">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
          Очистити форму
        </button>

        <div className="flex items-center gap-3">
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => setActiveStep(prev => prev - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          )}

          {activeStep < STEPS.length && (
            <button
              type="button"
              onClick={() => setActiveStep(prev => prev + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gray-800 dark:bg-slate-700 hover:bg-gray-700 dark:hover:bg-slate-600 rounded-xl hover:scale-[1.02] transition"
            >
              Далі
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-800/80 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Видалити цей проєкт?</h4>
                <p className="text-[10px] text-gray-500">Дія безповоротна та видалить проєкт з бази</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
              Ви впевнені, що хочете видалити проєкт замовника <strong className="text-gray-900 dark:text-white font-bold">{formData?.fullName || 'Без імені'}</strong>? Цю операцію неможливо скасувати.
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700/60 rounded-xl transition"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (formData?.id) {
                    await deleteProject(formData.id);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md shadow-red-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Видалення...
                  </>
                ) : (
                  'Так, видалити'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==== Internal Local Helper Components ====

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  required?: boolean;
}

function FormField({ label, children, fullWidth, required }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pl-0.5 flex items-center gap-1">
        <span>{label}</span>
        {required && (
          <span className="text-red-500 font-extrabold text-[11px] animate-pulse" title="Обов'язкове поле">*</span>
        )}
      </label>
      {children}
    </div>
  );
}

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
}

function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  step,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      className="w-full px-4 py-2.5 text-xs font-medium border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:border-[#f59e0b] transition-all"
    />
  );
}

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows,
}: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 text-xs font-medium border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:border-[#f59e0b] transition-all"
    />
  );
}

interface SelectOption {
  value: string;
  label: string;
  search?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = useMemo(() => {
    return options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt, search: opt } : { ...opt, search: opt.search || opt.label }
    );
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!value) return normalizedOptions;
    const searchStr = value.toLowerCase();
    
    const exactMatch = normalizedOptions.find(opt => opt.value === value);
    if (exactMatch && !isOpen) return normalizedOptions;

    return normalizedOptions.filter(opt =>
      opt.search?.toLowerCase().includes(searchStr) || 
      opt.label.toLowerCase().includes(searchStr) ||
      opt.value.toLowerCase().includes(searchStr)
    );
  }, [normalizedOptions, value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (isOpen ? "Пошук..." : "Виберіть або введіть...")}
          className="w-full pl-4 pr-10 py-2.5 text-xs font-medium border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:border-[#f59e0b] text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900/40 transition-all"
          autoComplete="off"
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1.5 bg-white dark:bg-slate-850 border border-gray-200/60 dark:border-slate-850 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 animate-slide-in">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 dark:text-slate-500 italic text-center">
              Варіантів не знайдено
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={`${opt.value}-${idx}`}
                className={`px-4 py-2 text-xs cursor-pointer transition-colors ${
                  opt.value === value 
                    ? 'bg-[#f59e0b]/10 text-[#f59e0b] font-bold' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-850/60 text-gray-700 dark:text-slate-300'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="font-bold">{opt.label}</div>
                {opt.search && opt.search !== opt.label && (
                   <div className="text-[9px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{opt.search}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ==== Modern Ukrainian Number to Words convertor ====
function numberToWordsUA(num: number): string {
  const ones = ['', 'одна', 'дві', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять"];
  const teens = ['десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', "п'ятнадцять", 'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев'ятнадцять"];
  const tens = ['', '', 'двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто"];
  const hundreds = ['', 'сто', 'двісті', 'триста', 'чотириста', "п'ятсот", 'шістсот', 'сімсот', 'вісімсот', "дев'ятсот"];

  const intPart = Math.floor(num);
  if (intPart === 0) return 'нуль';

  function convertGroup(n: number, gender = 0): string {
    if (n === 0) return '';
    let res = '';
    if (n >= 100) {
      res += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      res += teens[n - 10] + ' ';
    } else {
      if (n >= 20) {
        res += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        if (gender === 1) {
          if (n === 1) res += 'одна ';
          else if (n === 2) res += 'дві ';
          else res += ones[n] + ' ';
        } else {
          res += ones[n] + ' ';
        }
      }
    }
    return res;
  }

  let result = '';
  let n = intPart;

  const millions = Math.floor(n / 1000000);
  if (millions > 0) {
    result += convertGroup(millions, 0);
    const m = millions % 10;
    if (m === 1 && millions % 100 !== 11) result += 'мільйон ';
    else if (m >= 2 && m <= 4 && (millions % 100 < 10 || millions % 100 > 20)) result += 'мільйони ';
    else result += 'мільйонів ';
    n %= 1000000;
  }

  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    result += convertGroup(thousands, 1);
    const t = thousands % 10;
    if (t === 1 && thousands % 100 !== 11) result += 'тисяча ';
    else if (t >= 2 && t <= 4 && (thousands % 100 < 10 || thousands % 100 > 20)) result += 'тисячі ';
    else result += 'тисяч ';
    n %= 1000;
  }

  result += convertGroup(n, 0);
  return result.trim() + ' гривень';
}
