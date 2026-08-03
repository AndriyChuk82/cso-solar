import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Phone, MapPin, X, Trash2 } from "lucide-react";
import { useLandlordStore } from "../stores/landlordStore";
import { useFinanceStore } from "../stores/financeStore";
import { formatMoney, formatArea, getDebtStatus } from "../utils/formatters";
import { matchesSearch } from "../utils/searchUtils";
import type { LandlordBalance } from "../types";
import LandlordForm from "../components/LandlordForm";

export default function Landlords() {
  const { landlords, loading, searchQuery, fetchAll, setSearchQuery, remove: removeLandlord } =
    useLandlordStore();
  const { landlordBalances, fetchBalances } = useFinanceStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchBalances();
  }, []);

  const handleDeleteLandlord = async (id: string, name: string) => {
    if (
      window.confirm(
        `Ви дійсно бажаєте видалити орендодавця «${name}» та всі його ділянки?`,
      )
    ) {
      await removeLandlord(id);
      fetchBalances();
    }
  };

  const balanceMap = new Map<string, LandlordBalance>();
  landlordBalances.forEach((b) => balanceMap.set(b.landlord_id, b));

  const filtered = landlords.filter((l) =>
    matchesSearch(l.full_name, searchQuery),
  );

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Орендодавці</h1>
          <p className="page-subtitle">{landlords.length} осіб</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Додати
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
        />
        <input
          type="text"
          placeholder="Пошук за ПІБ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input input-with-icon-left !pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-neutral-500">
          {searchQuery
            ? "Нічого не знайдено"
            : "Список порожній. Додайте першого орендодавця."}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ПІБ</th>
                  <th>Телефон</th>
                  <th className="text-center">Ділянки</th>
                  <th className="text-center">Площа</th>
                  <th className="text-center">Борг</th>
                  <th className="text-center">Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((landlord) => {
                  const bal = balanceMap.get(landlord.id);
                  const debtMoney = Number(bal?.debt_money || 0);
                  const status = debtMoney > 0 ? "debt" : "paid";

                  return (
                    <tr
                      key={landlord.id}
                      onClick={() => navigate(`/landlords/${landlord.id}`)}
                    >
                      <td className="font-medium text-gray-900 dark:text-white">
                        {landlord.full_name}
                      </td>
                      <td>
                        {landlord.phone ? (
                          <span className="flex items-center justify-center gap-1 text-gray-600 dark:text-neutral-400">
                            <Phone size={14} />
                            {landlord.phone}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-neutral-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="text-center">{bal?.plot_count || 0}</td>
                      <td className="text-center">
                        {formatArea(Number(bal?.total_area || 0))}
                      </td>
                      <td className="text-center font-medium">
                        {debtMoney > 0 ? (
                          <span className="text-red-600 dark:text-red-400">
                            {formatMoney(debtMoney)}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            0 грн
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${status === "paid" ? "badge-success" : "badge-danger"}`}
                        >
                          {status === "paid" ? "✓ Оплачено" : "✕ Борг"}
                        </span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteLandlord(landlord.id, landlord.full_name)}
                          className="btn btn-ghost text-red-400 hover:text-red-600 p-1.5"
                          title="Видалити орендодавця"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Landlord Modal */}
      {showForm && <LandlordForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
