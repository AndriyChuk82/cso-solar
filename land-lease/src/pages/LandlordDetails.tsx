import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import { useLandlordStore } from "../stores/landlordStore";
import { usePlotStore } from "../stores/plotStore";
import { useFinanceStore } from "../stores/financeStore";
import {
  formatDate,
  formatMoney,
  formatArea,
  getDebtStatus,
} from "../utils/formatters";
import { CHARGE_TYPE_LABELS, PAYMENT_TYPE_LABELS } from "../types";
import type { Landlord, LandPlot } from "../types";
import PlotForm from "../components/PlotForm";
import LandlordForm from "../components/LandlordForm";
import ChargeForm from "../components/ChargeForm";
import PaymentForm from "../components/PaymentForm";
import MapComponent from "../components/MapComponent";

export default function LandlordDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { landlords, fetchAll: fetchLandlords, remove: removeLandlord } = useLandlordStore();
  const { plots, fetchByLandlord, remove: removePlot } = usePlotStore();
  const { charges, payments, fetchCharges, fetchPayments, fetchBalances } = useFinanceStore();

  const [showEditLandlord, setShowEditLandlord] = useState(false);
  const [showAddPlot, setShowAddPlot] = useState(false);
  const [editPlot, setEditPlot] = useState<LandPlot | null>(null);
  const [showCharge, setShowCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<"plots" | "history">("plots");

  useEffect(() => {
    fetchLandlords();
    if (id) {
      fetchByLandlord(id);
      fetchCharges();
      fetchPayments();
    }
  }, [id]);

  const landlord = landlords.find((l) => l.id === id);

  const handleDeleteLandlord = async () => {
    if (!landlord) return;
    if (
      window.confirm(
        `Ви дійсно бажаєте видалити орендодавця «${landlord.full_name}» та всі його ділянки?`,
      )
    ) {
      await removeLandlord(landlord.id);
      navigate("/landlords");
    }
  };

  const handleDeletePlot = async (plot: LandPlot) => {
    if (window.confirm(`Ви дійсно бажаєте видалити ділянку «${plot.address}»?`)) {
      await removePlot(plot.id);
      if (id) fetchByLandlord(id);
      fetchBalances();
    }
  };
  const landlordPlots = plots.filter((p) => p.landlord_id === id && p.active);
  const plotIds = new Set(landlordPlots.map((p) => p.id));
  const landlordCharges = charges.filter((c) => plotIds.has(c.plot_id));
  const landlordPayments = payments.filter((p) => plotIds.has(p.plot_id));

  // Combined history sorted by date
  const history = [
    ...landlordCharges.map((c) => ({
      type: "charge" as const,
      date: c.charge_date,
      chargeType: c.charge_type,
      amount: c.amount,
      unit: c.unit,
      description: c.description,
      period: c.period,
      id: c.id,
      plotId: c.plot_id,
    })),
    ...landlordPayments.map((p) => ({
      type: "payment" as const,
      date: p.payment_date,
      chargeType: p.payment_type,
      amount: p.amount,
      unit: p.unit,
      description: p.description,
      period: null,
      id: p.id,
      plotId: p.plot_id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate balances
  const totalChargedMoney = landlordCharges
    .filter((c) => c.charge_type === "money")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalPaidMoney = landlordPayments
    .filter((p) => p.payment_type === "money")
    .reduce((s, p) => s + Number(p.amount), 0);
  const debtMoney = totalChargedMoney - totalPaidMoney;
  const totalChargedGrain = landlordCharges
    .filter((c) => c.charge_type === "grain")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalPaidGrain = landlordPayments
    .filter((p) => p.payment_type === "grain")
    .reduce((s, p) => s + Number(p.amount), 0);
  const debtGrain = totalChargedGrain - totalPaidGrain;
  const totalChargedOil = landlordCharges
    .filter((c) => c.charge_type === "oil")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalPaidOil = landlordPayments
    .filter((p) => p.payment_type === "oil")
    .reduce((s, p) => s + Number(p.amount), 0);
  const debtOil = totalChargedOil - totalPaidOil;
  const totalChargedSugar = landlordCharges
    .filter((c) => c.charge_type === "sugar")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalPaidSugar = landlordPayments
    .filter((p) => p.payment_type === "sugar")
    .reduce((s, p) => s + Number(p.amount), 0);
  const debtSugar = totalChargedSugar - totalPaidSugar;

  const plotsWithCoords = landlordPlots.filter(
    (p) => p.latitude && p.longitude,
  );

  if (!landlord) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Орендодавця не знайдено</p>
        <button
          onClick={() => navigate("/landlords")}
          className="btn btn-primary mt-4"
        >
          ← Назад
        </button>
      </div>
    );
  }

  const plotNameById = (plotId: string) => {
    const plot = landlordPlots.find((p) => p.id === plotId);
    return plot?.address || "Невідома ділянка";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/landlords")}
            className="btn btn-ghost p-2 mt-0.5 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{landlord.full_name}</h1>
            {landlord.phone && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
                <Phone size={14} /> {landlord.phone}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowEditLandlord(true)}
            className="btn btn-secondary flex-1 sm:flex-none"
          >
            <Edit2 size={16} /> Редагувати
          </button>
          <button
            onClick={handleDeleteLandlord}
            className="btn btn-danger flex-1 sm:flex-none"
          >
            <Trash2 size={16} /> Видалити
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="kpi-card text-center">
          <div className="kpi-label">Нараховано</div>
          <div className="kpi-value text-lg text-gray-900 dark:text-white">
            {formatMoney(totalChargedMoney)}
          </div>
        </div>
        <div className="kpi-card text-center">
          <div className="kpi-label">Сплачено</div>
          <div className="kpi-value text-lg text-green-600 dark:text-green-400">
            {formatMoney(totalPaidMoney)}
          </div>
        </div>
        <div className="kpi-card text-center">
          <div className="kpi-label">Борг</div>
          <div
            className={`kpi-value text-lg ${debtMoney > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
          >
            {formatMoney(debtMoney)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setShowCharge(true)} className="btn btn-danger">
          <Plus size={16} /> Нарахувати
        </button>
        <button
          onClick={() => setShowPayment(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Оплата
        </button>
        <button
          onClick={() => setShowAddPlot(true)}
          className="btn btn-secondary"
        >
          <Plus size={16} /> Додати ділянку
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab("plots")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "plots"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300"
          }`}
        >
          Ділянки ({landlordPlots.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300"
          }`}
        >
          Історія операцій ({history.length})
        </button>
      </div>

      {/* Plots Tab */}
      {activeTab === "plots" && (
        <div className="space-y-3 mb-6">
          {landlordPlots.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Немає ділянок. Натисніть «Додати ділянку» щоб додати.
            </div>
          ) : (
            landlordPlots.map((plot) => (
              <div
                key={plot.id}
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      {plot.address}
                    </h4>
                    {plot.settlement && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {plot.settlement}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600 dark:text-neutral-400">
                      <span>
                        Площа:{" "}
                        <strong>
                          {formatArea(Number(plot.area_hectares))}
                        </strong>
                      </span>
                      <span>
                        Тип оплати:{" "}
                        <strong>
                          {PAYMENT_TYPE_LABELS[plot.payment_type] ||
                            plot.payment_type}
                        </strong>
                      </span>
                      {plot.annual_rate_money > 0 && (
                        <span>
                          Ставка:{" "}
                          <strong>
                            {formatMoney(Number(plot.annual_rate_money))}/рік
                          </strong>
                        </span>
                      )}
                      {plot.annual_rate_natural && (
                        <span>
                          Натура: <strong>{plot.annual_rate_natural}</strong>
                        </span>
                      )}
                      {plot.lease_start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> з{" "}
                          {formatDate(plot.lease_start_date)}
                        </span>
                      )}
                    </div>
                    {plot.cadastral_number && (
                      <p className="text-xs text-gray-400 mt-1">
                        Кадастровий: {plot.cadastral_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditPlot(plot)}
                      className="btn btn-ghost p-2"
                      title="Редагувати ділянку"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePlot(plot)}
                      className="btn btn-ghost text-red-500 hover:text-red-700 dark:text-red-400 p-2"
                      title="Видалити ділянку"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden mb-6">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Операцій немає</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Категорія</th>
                    <th>Сума</th>
                    <th>Ділянка</th>
                    <th>Опис</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((op) => (
                    <tr key={op.id} className="cursor-default">
                      <td>{formatDate(op.date)}</td>
                      <td>
                        <span
                          className={`badge ${op.type === "charge" ? "badge-danger" : "badge-success"}`}
                        >
                          {op.type === "charge" ? "Нарахування" : "Оплата"}
                        </span>
                      </td>
                      <td>
                        {CHARGE_TYPE_LABELS[op.chargeType] || op.chargeType}
                      </td>
                      <td className="font-medium">
                        {op.amount.toLocaleString("uk-UA")} {op.unit}
                      </td>
                      <td className="text-xs text-gray-500">
                        {plotNameById(op.plotId)}
                      </td>
                      <td className="text-xs text-gray-400 max-w-[200px] truncate">
                        {op.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Map Card */}
      {plotsWithCoords.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin size={16} className="text-amber-500" /> Ділянки на карті
            </h3>
            <span className="text-xs text-gray-400">
              {plotsWithCoords.length} з {landlordPlots.length} ділянок із координатами
            </span>
          </div>
          <div className="h-[360px] sm:h-[440px] w-full">
            <MapComponent plots={plotsWithCoords} height="100%" zoom={14} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditLandlord && (
        <LandlordForm
          landlord={landlord}
          onClose={() => setShowEditLandlord(false)}
        />
      )}
      {showAddPlot && id && (
        <PlotForm
          landlordId={id}
          onClose={() => {
            setShowAddPlot(false);
            if (id) fetchByLandlord(id);
          }}
        />
      )}
      {editPlot && (
        <PlotForm
          landlordId={editPlot.landlord_id}
          plot={editPlot}
          onClose={() => {
            setEditPlot(null);
            if (id) fetchByLandlord(id);
          }}
        />
      )}
      {showCharge && landlordPlots.length > 0 && (
        <ChargeForm
          plots={landlordPlots}
          onClose={() => {
            setShowCharge(false);
            fetchCharges();
          }}
        />
      )}
      {showPayment && landlordPlots.length > 0 && (
        <PaymentForm
          plots={landlordPlots}
          onClose={() => {
            setShowPayment(false);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
