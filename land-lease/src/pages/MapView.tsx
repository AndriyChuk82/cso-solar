import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlotStore } from "../stores/plotStore";
import { useFinanceStore } from "../stores/financeStore";
import { getDebtStatus } from "../utils/formatters";
import MapComponent from "../components/MapComponent";

export default function MapView() {
  const { plots, fetchAll } = usePlotStore();
  const { plotBalances, fetchBalances } = useFinanceStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
    fetchBalances();
  }, []);

  const plotsWithCoords = plots.filter(
    (p) => p.latitude && p.longitude && p.active,
  );
  const balanceMap = new Map(plotBalances.map((b) => [b.plot_id, b]));

  // Build markers data for map component
  const markers = plotsWithCoords.map((plot) => {
    const bal = balanceMap.get(plot.id);
    const status = bal
      ? getDebtStatus(
          Number(bal.debt_money),
          Number(bal.debt_grain),
          Number(bal.debt_oil),
          Number(bal.debt_sugar),
        )
      : "paid";
    return {
      ...plot,
      status,
      balance: bal,
    };
  });

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Карта ділянок</h1>
          <p className="page-subtitle">
            {plotsWithCoords.length} з {plots.filter((p) => p.active).length}{" "}
            ділянок мають координати
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Оплачено
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Частково
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Борг
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
        {plotsWithCoords.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            <p className="text-lg mb-2">🗺️</p>
            <p>Немає ділянок з координатами.</p>
            <p className="text-xs mt-1">
              Додайте координати до ділянок, щоб побачити їх на карті.
            </p>
          </div>
        ) : (
          <MapComponent
            plots={markers}
            height="calc(100vh - 220px)"
            zoom={10}
            onPlotClick={(plot) => navigate(`/landlords/${plot.landlord_id}`)}
          />
        )}
      </div>
    </div>
  );
}
