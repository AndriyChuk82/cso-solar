// ===== CSO Solar — Green Tariff Project Form =====

import React from 'react';
import { useGreenTariffStore } from '../store/useGreenTariffStore';
import { FileUpload } from './FileUpload';
import { DocumentGenerator } from './DocumentGenerator';
import { ChevronDown, Search, X } from 'lucide-react';
import type { GreenTariffProject } from '../types';

const STATUS_OPTIONS = ['В процесі', 'Відкладено', 'Готовий'];
const PAYMENT_OPTIONS = ['Оплачено', 'Не оплачено'];
const VOLTAGE_OPTIONS = ['220 В', '380 В'];
const METER_OPTIONS = ['ISKRA AM 550 5(100)A', 'NIK 2303 АР1 5(100)А', 'NIK 2101 AP1', 'NIK 2303 АР1 5(100)А', 'NIK 2301 АР3 5(120)А', 'NIK 2104 AP2T'];
const BREAKER_OPTIONS = ['20А', '25А', '32А', '40А', '50А', '63А'];
const STATION_TYPE_OPTIONS = ['Мережева станція', 'Гібридна станція'];

export function ProjectForm() {
  const { currentProject, saveProject, resetForm, equipment, isLoading } = useGreenTariffStore();
  const [formData, setFormData] = React.useState<GreenTariffProject>(
    currentProject || {
      field1: 'В процесі',
      field2: '', field3: '', field4: '', field5: '', field6: '', field7: '', field8: '',
      field9: '', field10: '', field11: '', field12: '', field13: '', field14: '', field15: '',
      field16: '', field17: '', field18: '', field19: '', field20: '', field21: '', field22: '',
      field23: '', field24: '', field25: '', field26: '', field27: '', field28: '', field29: '',
      field30: '', field31: '', field32: '', field33: '', field34: '', field35: '', field36: '',
      field37: '', field38: '', field39: '', field40: '', field41: '', field42: '',
      field44: '',
      field45: '',
      stationType: '',
      isStarred: false,
    }
  );

  React.useEffect(() => {
    if (currentProject) {
      setFormData(currentProject);
    }
  }, [currentProject]);

  const handleChange = (field: keyof GreenTariffProject, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Auto-convert field38 to words
      if (field === 'field38' && value) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          newData.field39 = numberToWordsUA(num);
        }
      }

      // Inverter Model changed -> Auto-fill
      if (field === 'field27') {
        const inv = equipment.inverters.find(i => i.model === value);
        if (inv) {
          if (inv.manufacturer) newData.field30 = inv.manufacturer;
          if (inv.power) newData.field28 = inv.power;
          if (inv.warranty) newData.field32 = inv.warranty;
        }
      }

      // Panel Model changed -> Auto-fill & Recalculate
      if (field === 'field34') {
        const p = equipment.panels.find(p => p.model === value);
        if (p) {
          if (p.manufacturer) newData.field33 = p.manufacturer;
          if (p.warranty) newData.field35 = p.warranty;
        }
      }

      // Auto-calculate Total Panel Power (field22) if Model (field34) or Count (field23) changed
      if (field === 'field34' || field === 'field23') {
        const p = equipment.panels.find(p => p.model === newData.field34);
        if (p && p.power) {
          // Parse power (e.g. "550Вт" -> 550)
          const perPanelPower = parseFloat(p.power.replace(/[^\d.]/g, '')) / 1000; // W to kW
          const count = parseInt(newData.field23);
          if (!isNaN(perPanelPower) && !isNaN(count)) {
            newData.field22 = (perPanelPower * count).toFixed(3);
          }
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProject(formData);
  };

  const handleReset = () => {
    resetForm();
    setFormData({
      field1: 'В процесі',
      field2: '', field3: '', field4: '', field5: '', field6: '', field7: '', field8: '',
      field9: '', field10: '', field11: '', field12: '', field13: '', field14: '', field15: '',
      field16: '', field17: '', field18: '', field19: '', field20: '', field21: '', field22: '',
      field23: '', field24: '', field25: '', field26: '', field27: '', field28: '', field29: '',
      field30: '', field31: '', field32: '', field33: '', field34: '', field35: '', field36: '',
      field37: '', field38: '', field39: '', field40: '', field41: '', field42: '',
      field44: '',
      field45: '',
      stationType: '',
      isStarred: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 relative">
      {/* Minimalistic Sticky Top Actions */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 flex items-center justify-end gap-3 shadow-sm transition-all duration-300">
        <button
          type="button"
          onClick={() => {
            const newState = !formData.isStarred;
            setFormData(prev => ({ 
              ...prev, 
              isStarred: newState,
              field45: newState ? '1' : '' 
            }));
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
            formData.isStarred 
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
          title={formData.isStarred ? 'Видалити з виняткових' : 'Позначити як винятковий'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${formData.isStarred ? 'fill-current' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {formData.isStarred ? 'Винятковий' : 'Винятковий?'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all duration-200 flex items-center gap-1.5"
        >
          🗑️ Очистити
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-full shadow-md shadow-primary/20 hover:shadow-primary/30 dark:shadow-blue-900/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Збереження...
            </>
          ) : (
            <>💾 Зберегти</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Секція 1: Загальна інформація */}
        <Section title="📝 Загальна інформація">
          <FormField label="Стан проєкту">
            <SearchableSelect
              value={formData.field1}
              onChange={(v) => handleChange('field1', v)}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <FormField label="Розрахунок">
            <SearchableSelect
              value={formData.field2}
              onChange={(v) => handleChange('field2', v)}
              options={PAYMENT_OPTIONS}
            />
          </FormField>
          <FormField label="№ проекту">
            <Input value={formData.field3} onChange={(v) => handleChange('field3', v)} placeholder="Автоматично" />
          </FormField>
          <FormField label="Час тестування">
            <Input value={formData.field11} onChange={(v) => handleChange('field11', v)} placeholder="напр. 10:00 - 12:00" />
          </FormField>
          <FormField label="Тип станції">
            <SearchableSelect
              value={formData.stationType}
              onChange={(v) => handleChange('stationType', v)}
              options={STATION_TYPE_OPTIONS}
            />
          </FormField>
          <FormField label="Коментар (для себе)">
            <Input 
              value={formData.field44 || ''} 
              onChange={(v) => handleChange('field44', v)} 
              placeholder="Коротко (2-3 слова)" 
            />
          </FormField>
        </Section>

        {/* Секція 2: Данні замовника */}
        <Section title="👤 Данні замовника">
          <FormField label="ПІБ фізичної особи">
            <Input value={formData.field4} onChange={(v) => handleChange('field4', v)} placeholder="Прізвище Ім'я По батькові" />
          </FormField>
          <FormField label="Паспортні дані">
            <Input value={formData.field40} onChange={(v) => handleChange('field40', v)} />
          </FormField>
          <FormField label="Код РНОКПП (ІПН)">
            <Input value={formData.field5} onChange={(v) => handleChange('field5', v)} />
          </FormField>
          <FormField label="УНЗР (за наявності)">
            <Input value={formData.field8} onChange={(v) => handleChange('field8', v)} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={formData.field25} onChange={(v) => handleChange('field25', v)} />
          </FormField>
          <FormField label="Контактний телефон">
            <Input type="tel" value={formData.field26} onChange={(v) => handleChange('field26', v)} />
          </FormField>
        </Section>

        {/* Секція 3: Об'єкт нерухомості */}
        <Section title="🏠 Об'єкт нерухомості">
          <FormField label="Реєстраційний номер об'єкта">
            <Input value={formData.field6} onChange={(v) => handleChange('field6', v)} />
          </FormField>
          <FormField label="Номер запису про право власності">
            <Input value={formData.field7} onChange={(v) => handleChange('field7', v)} />
          </FormField>
          <FormField label="Місце розташування установки" fullWidth>
            <Textarea value={formData.field21} onChange={(v) => handleChange('field21', v)} placeholder="Адреса об'єкта" rows={2} />
          </FormField>
        </Section>

        {/* Секція 4: Договір та Мережа */}
        <Section title="🔌 Договір та Мережа">
          <FormField label="№ Договору">
            <Input value={formData.field9} onChange={(v) => handleChange('field9', v)} />
          </FormField>
          <FormField label="Дата договору">
            <Input type="date" value={formData.field10} onChange={(v) => handleChange('field10', v)} />
          </FormField>
          <FormField label="№ EIC-код точки розподілу">
            <Input value={formData.field12} onChange={(v) => handleChange('field12', v)} />
          </FormField>
          <FormField label="Дозволена потужність, кВт">
            <Input type="number" step="0.1" value={formData.field13} onChange={(v) => handleChange('field13', v)} />
          </FormField>
          <FormField label="Напруга">
            <SearchableSelect value={formData.field18} onChange={(v) => handleChange('field18', v)} options={VOLTAGE_OPTIONS} />
          </FormField>
        </Section>

        {/* Секція 5: Підстанція та Обладнання */}
        <Section title="🏗️ Підстанція та Обладнання">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Підстанція">
              <Input value={formData.field14} onChange={(v) => handleChange('field14', v)} />
            </FormField>
            <FormField label="Лінія">
              <Input value={formData.field15} onChange={(v) => handleChange('field15', v)} />
            </FormField>
          </div>
          <FormField label="Опора №">
            <Input value={formData.field16} onChange={(v) => handleChange('field16', v)} />
          </FormField>
          <FormField label="Лічильник">
            <SearchableSelect value={formData.field17} onChange={(v) => handleChange('field17', v)} options={METER_OPTIONS} />
          </FormField>
          <FormField label="Вхідний автомат">
            <SearchableSelect value={formData.field19} onChange={(v) => handleChange('field19', v)} options={BREAKER_OPTIONS} />
          </FormField>
          <FormField label="Відсікач">
            <Input value={formData.field20} onChange={(v) => handleChange('field20', v)} />
          </FormField>
        </Section>

        {/* Секція 6: Інвертор */}
        <Section title="📠 Інвертор">
          <FormField label="Виробник Інвертора">
            <SearchableSelect
              value={formData.field30}
              onChange={(v) => handleChange('field30', v)}
              options={equipment.inverterManufacturers}
            />
          </FormField>
          <FormField label="Інвертор (Модель)">
            <SearchableSelect
              value={formData.field27}
              placeholder="Виберіть модель..."
              onChange={(v) => handleChange('field27', v)}
              options={equipment.inverters.map(i => ({
                value: i.model,
                label: i.model,
                search: `${i.manufacturer} ${i.model}`
              }))}
            />
          </FormField>
          <FormField label="Потужність інвертора, кВт">
            <Input type="number" step="0.1" value={formData.field28} onChange={(v) => handleChange('field28', v)} />
          </FormField>
          <FormField label="Серійний номер (с/н)">
            <Input value={formData.field29} onChange={(v) => handleChange('field29', v)} />
          </FormField>
          <FormField label="Прошивка">
            <Input value={formData.field31} onChange={(v) => handleChange('field31', v)} />
          </FormField>
          <FormField label="Гарантія на інвертор, р.">
            <Input type="number" value={formData.field32} onChange={(v) => handleChange('field32', v)} />
          </FormField>
        </Section>

        {/* Секція 7: Сонячні панелі */}
        <Section title="☀️ Сонячні панелі">
          <FormField label="Виробник сонячних панелей">
            <SearchableSelect
              value={formData.field33}
              onChange={(v) => handleChange('field33', v)}
              options={equipment.panelManufacturers}
            />
          </FormField>
          <FormField label="Панель (Модель)">
            <SearchableSelect
              value={formData.field34}
              placeholder="Виберіть модель..."
              onChange={(v) => handleChange('field34', v)}
              options={equipment.panels.map(p => ({
                value: p.model,
                label: p.model,
                search: `${p.manufacturer} ${p.model}`
              }))}
            />
          </FormField>
          <FormField label="Сумарна потужність, кВт">
            <Input type="number" step="any" value={formData.field22} onChange={(v) => handleChange('field22', v)} />
          </FormField>
          <FormField label="К-сть панелей">
            <Input type="number" value={formData.field23} onChange={(v) => handleChange('field23', v)} />
          </FormField>
          <FormField label="Місце встановлення панелей">
            <Input value={formData.field24} onChange={(v) => handleChange('field24', v)} placeholder="Дах / Земля" />
          </FormField>
          <FormField label="Гарантія на панелі, років">
            <Input type="number" value={formData.field35} onChange={(v) => handleChange('field35', v)} />
          </FormField>
        </Section>

        {/* Секція 8: Акумуляторна батарея */}
        <Section title="🔋 Акумуляторна батарея">
          <FormField label="Модель АКБ">
            <SearchableSelect
              value={formData.field36}
              onChange={(v) => handleChange('field36', v)}
              options={equipment.batteries.map((b) => ({
                value: b.model,
                label: b.model,
                search: `${b.manufacturer || ''} ${b.model}`
              }))}
            />
          </FormField>
          <FormField label="Номінальна потужність, кВт*год">
            <Input type="number" step="any" value={formData.field37} onChange={(v) => handleChange('field37', v)} />
          </FormField>
        </Section>

        {/* Секція 9: Фінансова сторона */}
        <Section title="💰 Фінансова сторона договору">
          <FormField label="Вартість робіт, грн">
            <Input type="number" value={formData.field38} onChange={(v) => handleChange('field38', v)} placeholder="напр. 750000" />
          </FormField>
          <FormField label="Сума прописом (грн)">
            <Input value={formData.field39} onChange={(v) => handleChange('field39', v)} />
          </FormField>
          <FormField label="Аванс, USD">
            <Input type="number" value={formData.field41} onChange={(v) => handleChange('field41', v)} />
          </FormField>
          <FormField label="Залишок, USD">
            <Input type="number" value={formData.field42} onChange={(v) => handleChange('field42', v)} />
          </FormField>
        </Section>

        {/* Секція 10: Додатки */}
        <Section title="📎 Додатки">
          <FileUpload />
        </Section>

        {/* Секція 11: Генерація документів */}
        <DocumentGenerator formData={formData} />
      </div>
    </form>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, children, fullWidth }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-700 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  step,
}: {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
    />
  );
}

interface SelectOption {
  value: string;
  label: string;
  search?: string;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt, search: opt } : { ...opt, search: opt.search || opt.label }
    );
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!value) return normalizedOptions;
    const searchStr = value.toLowerCase();
    
    // Check if current value matches a value exactly (to show everything on focus if already set)
    const exactMatch = normalizedOptions.find(opt => opt.value === value);
    if (exactMatch && !isOpen) return normalizedOptions;

    return normalizedOptions.filter(opt =>
      opt.search?.toLowerCase().includes(searchStr) || 
      opt.label.toLowerCase().includes(searchStr) ||
      opt.value.toLowerCase().includes(searchStr)
    );
  }, [normalizedOptions, value, isOpen]);

  React.useEffect(() => {
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
          className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 transition-all"
          autoComplete="off"
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute inset-y-0 right-7 flex items-center pr-1 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-slate-400 italic text-center">
              Схожих варіантів не знайдено
            </div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={`${opt.value}-${idx}`}
                className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  opt.value === value 
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-medium' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium">{opt.label}</div>
                {opt.search && opt.search !== opt.label && (
                   <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{opt.search}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Number to words (Ukrainian)
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
  return result.trim();
}
