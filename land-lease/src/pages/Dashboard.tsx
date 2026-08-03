import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Map,
  Banknote,
  Wheat,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useLandlordStore } from "../stores/landlordStore";
import { usePlotStore } from "../stores/plotStore";
import { useFinanceStore } from "../stores/financeStore";
import { formatMoney, formatArea, getDebtStatus } from "../utils/formatters";

export default function Dashboard() {
  const { landlords, fetchAll: fetchLandlords } = useLandlordStore();
  const { plots, fetchAll: fetchPlots } = usePlotStore();
  const {
    landlordBalances,
    payments,
    charges,
    fetchBalances,
    fetchPayments,
    fetchCharges,
  } = useFinanceStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLandlords();
    fetchPlots();
    fetchBalances();
    fetchPayments();
    fetchCharges();
  }, []);

  const totalArea = plots.reduce((sum, p) => sum + Number(p.area_hectares), 0);
  const totalDebtMoney = landlordBalances.reduce(
    (sum, b) => sum + Number(b.debt_money),
    0,
  );
  const totalDebtGrain = landlordBalances.reduce(
    (sum, b) => sum + Number(b.debt_grain),
    0,
  );
  const totalDebtOil = landlordBalances.reduce(
    (sum, b) => sum + Number(b.debt_oil),
    0,
  );
  const totalDebtSugar = landlordBalances.reduce(
    (sum, b) => sum + Number(b.debt_sugar),
    0,
  );
  const debtorsCount = landlordBalances.filter(
    (b) =>
      getDebtStatus(
        Number(b.debt_money),
        Number(b.debt_grain),
        Number(b.debt_oil),
        Number(b.debt_sugar),
      ) === "debt",
  ).length;

  // Recent operations (last 5 combined charges + payments, sorted by date)
  const recentOps = [
    ...charges.map((c) => ({
      type: "charge" as const,
      date: c.charge_date,
      amount: c.amount,
      unit: c.unit,
      chargeType: c.charge_type,
      description: c.description,
      id: c.id,
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      date: p.payment_date,
      amount: p.amount,
      unit: p.unit,
      chargeType: p.payment_type,
      description: p.description,
      id: p.id,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Дашборд</h1>
        <p className="page-subtitle">
          Загальний огляд оренди земельних ділянок
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          className="kpi-card cursor-pointer flex flex-col items-center justify-center text-center"
          onClick={() => navigate("/landlords")}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Users size={20} className="text-blue-500" />
            </div>
            <span className="kpi-label">Орендодавці</span>
          </div>
          <div className="kpi-value text-center">{landlords.length}</div>
        </div>

        <div
          className="kpi-card cursor-pointer flex flex-col items-center justify-center text-center"
          onClick={() => navigate("/map")}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Map size={20} className="text-green-500" />
            </div>
            <span className="kpi-label">Ділянки / Площа</span>
          </div>
          <div className="kpi-value text-center">
            {plots.length}{" "}
            <span className="text-base font-normal text-gray-400">
              / {formatArea(totalArea)}
            </span>
          </div>
        </div>

        <div
          className="kpi-card cursor-pointer flex flex-col items-center justify-center text-center"
          onClick={() => navigate("/finances")}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Banknote size={20} className="text-red-500" />
            </div>
            <span className="kpi-label">Борг (гроші)</span>
          </div>
          <div className="kpi-value text-center text-red-600 dark:text-red-400">
            {formatMoney(totalDebtMoney)}
          </div>
        </div>

        <div className="kpi-card flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
            <span className="kpi-label">Боржники</span>
          </div>
          <div className="kpi-value text-center text-amber-600 dark:text-amber-400">
            {debtorsCount}
          </div>
        </div>
      </div>

      {/* Recent Operations */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} />
            Останні операції
          </h2>
          <button
            onClick={() => navigate("/finances")}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Всі операції →
          </button>
        </div>
        {recentOps.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-neutral-500">
            Операцій поки немає
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {recentOps.map((op) => (
              <div
                key={op.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${op.type === "charge" ? "bg-red-400" : "bg-green-400"}`}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {op.type === "charge" ? "Нарахування" : "Оплата"}
                    </span>
                    {op.description && (
                      <span className="text-xs text-gray-400 dark:text-neutral-500 ml-2">
                        {op.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-semibold ${op.type === "charge" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                  >
                    {op.type === "charge" ? "+" : "-"}
                    {op.amount.toLocaleString("uk-UA")} {op.unit}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(op.date).toLocaleDateString("uk-UA")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
