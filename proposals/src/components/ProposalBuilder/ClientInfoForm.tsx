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
    <div className="bg-white rounded-lg border border-gray-200 p-3 client-info-block">
      <h3 className="font-semibold text-gray-900 mb-2 text-xs">Інформація про клієнта</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <input
          type="text"
          placeholder="Ім'я клієнта"
          value={clientName}
          onChange={(e) => onUpdateField('clientName', e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
        />
        <input
          type="tel"
          placeholder="Телефон"
          value={clientPhone || ''}
          onChange={(e) => onUpdateField('clientPhone', e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
        />
        <input
          type="email"
          placeholder="Email"
          value={clientEmail || ''}
          onChange={(e) => onUpdateField('clientEmail', e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
        />
        <select
          value={selectedSeller}
          onChange={(e) => onSetSeller(e.target.value as SellerId)}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
        >
          {Object.entries(SELLERS).map(([id, seller]) => (
            <option key={id} value={id}>
              {seller.shortName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
