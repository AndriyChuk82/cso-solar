import { formatMoney } from '../utils/formatters'

interface BalanceSummaryProps {
  debtMoney: number
  debtGrain: number
  debtOil: number
  debtSugar: number
}

export default function BalanceSummary({ debtMoney, debtGrain, debtOil, debtSugar }: BalanceSummaryProps) {
  const hasDebts = debtMoney > 0 || debtGrain > 0 || debtOil > 0 || debtSugar > 0
  
  if (!hasDebts) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Оплачено
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {debtMoney > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Борг: {formatMoney(debtMoney)}
        </span>
      )}
      {debtGrain > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Зерно: {debtGrain} кг
        </span>
      )}
      {debtOil > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Олія: {debtOil} л
        </span>
      )}
      {debtSugar > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Цукор: {debtSugar} кг
        </span>
      )}
    </div>
  )
}
