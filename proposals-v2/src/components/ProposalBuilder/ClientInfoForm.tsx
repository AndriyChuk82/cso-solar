import { SELLERS } from '../../config';
import type { SellerId } from '../../types/index';

interface ClientInfoFormProps {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  selectedSeller: SellerId;
  onUpdateField: (field: string, value: string) => void;
  onSetSeller: (seller: SellerId) => void;
}

export function ClientInfoForm({
  clientName,
  clientPhone,
  clientEmail,
  selectedSeller,
  onUpdateField,
  onSetSeller,
}: ClientInfoFormProps) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-900 p-4 client-info-block transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
      <h3 className="font-semibold text-slate-400 dark:text-slate-500 mb-3 text-[10px] uppercase tracking-wider font-mono">
        Інформація про клієнта
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative group">
          <input
            type="text"
            placeholder="Ім'я клієнта"
            value={clientName}
            onChange={(e) => onUpdateField('clientName', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="relative group">
          <input
            type="tel"
            placeholder="Телефон"
            value={clientPhone || ''}
            onChange={(e) => onUpdateField('clientPhone', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="relative group">
          <input
            type="email"
            placeholder="Email"
            value={clientEmail || ''}
            onChange={(e) => onUpdateField('clientEmail', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
        </div>
        <div className="relative group">
          <select
            value={selectedSeller}
            onChange={(e) => onSetSeller(e.target.value as SellerId)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-900 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 transition-all appearance-none cursor-pointer"
          >
            {Object.entries(SELLERS).map(([id, seller]) => (
              <option key={id} value={id} className="dark:bg-slate-900">
                {seller.shortName}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-600">
            <span className="text-[8px]">▼</span>
          </div>
        </div>
      </div>
    </div>
  );
}

