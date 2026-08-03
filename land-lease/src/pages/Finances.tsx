import { useEffect, useState } from "react";
import {
  Plus,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useFinanceStore } from "../stores/financeStore";
import { usePlotStore } from "../stores/plotStore";
import { useLandlordStore } from "../stores/landlordStore";
import { formatDate, formatMoney } from "../utils/formatters";
import { CHARGE_TYPE_LABELS } from "../types";
import type { LandPlot } from "../types";
import ChargeForm from "../components/ChargeForm";
import PaymentForm from "../components/PaymentForm";

export default function Finances() {
  const {
    charges,
    payments,
    landlordBalances,
    fetchCharges,
    fetchPayments,
    fetchBalances,
    deleteCharge,
    deletePayment,
  } = useFinanceStore();
  const { plots, fetchAll: fetchPlots } = usePlotStore();
  const { landlords, fetchAll: fetchLandlords } = useLandlordStore();

  const [activeTab, setActiveTab] = useState<
    "summary" | "charges" | "payments"
  >("summary");
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchCharges();
    fetchPayments();
    fetchBalances();
    fetchPlots();
    fetchLandlords();
  }, []);

  const plotMap = new Map(plots.map((p) => [p.id, p]));
  const landlordMap = new Map(landlords.map((l) => [l.id, l]));

  const getPlotInfo = (plotId: string) => {
    const plot = plotMap.get(plotId);
    if (!plot) return { address: "Невідома", landlordName: "Невідомий" };
    const landlord = landlordMap.get(plot.landlord_id);
    return {
      address: plot.address,
      landlordName: landlord?.full_name || "Невідомий",
    };
  };

  const activePlots = plots.filter((p) => p.active);

  // Summary totals
  const totalChargedMoney = landlordBalances.reduce(
    (s, b) => s + Number(b.charged_money),
    0,
  );
  const totalPaidMoney = landlordBalances.reduce(
    (s, b) => s + Number(b.paid_money),
    0,
  );
  const totalDebtMoney = landlordBalances.reduce(
    (s, b) => s + Number(b.debt_money),
    0,
  );

  const handleDeleteCharge = async (id: string) => {
    if (window.confirm("Видалити нарахування?")) {
      await deleteCharge(id);
      fetchCharges();
      fetchBalances();
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm("Видалити оплату?")) {
      await deletePayment(id);
      fetchPayments();
      fetchBalances();
    }
  };

  const tabs = [
    {
      key: "summary" as const,
      label: "Зведений звіт",
      icon: <DollarSign size={16} />,
    },
    {
      key: "charges" as const,
      label: `Нарахування (${charges.length})`,
      icon: <TrendingDown size={16} />,
    },
    {
      key: "payments" as const,
      label: `Оплати (${payments.length})`,
      icon: <TrendingUp size={16} />,
    },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Фінанси</h1>
          <p className="page-subtitle">Облік нарахувань та оплат за оренду</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            className="btn btn-danger flex-1 sm:flex-none"
            onClick={() => setShowChargeForm(true)}
          >
            <Plus size={16} /> Нарахувати
          </button>
          <button
            className="btn btn-primary flex-1 sm:flex-none"
            onClick={() => setShowPaymentForm(true)}
          >
            <Plus size={16} /> Оплата
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="kpi-card">
          <div className="kpi-label">Нараховано (гроші)</div>
          <div className="kpi-value text-lg">
            {formatMoney(totalChargedMoney)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Сплачено (гроші)</div>
          <div className="kpi-value text-lg text-green-600 dark:text-green-400">
            {formatMoney(totalPaidMoney)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Борг (гроші)</div>
          <div
            className={`kpi-value text-lg ${totalDebtMoney > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
          >
            {formatMoney(totalDebtMoney)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-neutral-700 overflow-x-auto pb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-neutral-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead>
              <tr>
                <th>Орендодавець</th>
                <th>Нараховано</th>
                <th>Сплачено</th>
                <th>Борг</th>
              </tr>
            </thead>
            <tbody>
              {landlordBalances.map((b) => (
                <tr key={b.landlord_id} className="cursor-default">
                  <td className="font-medium text-gray-900 dark:text-white">
                    {b.full_name}
                  </td>
                  <td>
                    {formatMoney(Number(b.charged_money))}
                  </td>
                  <td className="text-green-600 dark:text-green-400">
                    {formatMoney(Number(b.paid_money))}
                  </td>
                  <td
                    className={`font-semibold ${Number(b.debt_money) > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {formatMoney(Number(b.debt_money))}
                  </td>
                </tr>
              ))}
              {landlordBalances.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    Даних немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Charges Tab */}
      {activeTab === "charges" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Орендодавець</th>
                <th>Ділянка</th>
                <th>Тип</th>
                <th>Сума</th>
                <th>Період</th>
                <th>Опис</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {charges
                .sort(
                  (a, b) =>
                    new Date(b.charge_date).getTime() -
                    new Date(a.charge_date).getTime(),
                )
                .map((c) => {
                  const info = getPlotInfo(c.plot_id);
                  return (
                    <tr key={c.id} className="cursor-default">
                      <td>{formatDate(c.charge_date)}</td>
                      <td className="font-medium">{info.landlordName}</td>
                      <td className="text-xs text-gray-500">{info.address}</td>
                      <td>
                        <span className="badge badge-warning">
                          {CHARGE_TYPE_LABELS[c.charge_type]}
                        </span>
                      </td>
                      <td className="font-medium text-red-600 dark:text-red-400">
                        {c.amount.toLocaleString("uk-UA")} {c.unit}
                      </td>
                      <td className="text-xs text-gray-500">
                        {c.period || "—"}
                      </td>
                      <td className="text-xs text-gray-400 max-w-[150px] truncate">
                        {c.description || "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteCharge(c.id)}
                          className="btn btn-ghost p-1 text-red-400 hover:text-red-600"
                          title="Видалити"
                        >
                          <TrendingDown size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {charges.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    Нарахувань немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Орендодавець</th>
                <th>Ділянка</th>
                <th>Тип</th>
                <th>Сума</th>
                <th>Опис</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments
                .sort(
                  (a, b) =>
                    new Date(b.payment_date).getTime() -
                    new Date(a.payment_date).getTime(),
                )
                .map((p) => {
                  const info = getPlotInfo(p.plot_id);
                  return (
                    <tr key={p.id} className="cursor-default">
                      <td>{formatDate(p.payment_date)}</td>
                      <td className="font-medium">{info.landlordName}</td>
                      <td className="text-xs text-gray-500">{info.address}</td>
                      <td>
                        <span className="badge badge-success">
                          {CHARGE_TYPE_LABELS[p.payment_type]}
                        </span>
                      </td>
                      <td className="font-medium text-green-600 dark:text-green-400">
                        {p.amount.toLocaleString("uk-UA")} {p.unit}
                      </td>
                      <td className="text-xs text-gray-400 max-w-[150px] truncate">
                        {p.description || "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="btn btn-ghost p-1 text-red-400 hover:text-red-600"
                          title="Видалити"
                        >
                          <TrendingDown size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Оплат немає
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showChargeForm && (
        <ChargeForm
          plots={activePlots}
          onClose={() => {
            setShowChargeForm(false);
            fetchCharges();
            fetchBalances();
          }}
        />
      )}
      {showPaymentForm && (
        <PaymentForm
          plots={activePlots}
          onClose={() => {
            setShowPaymentForm(false);
            fetchPayments();
            fetchBalances();
          }}
        />
      )}
    </div>
  );
}
