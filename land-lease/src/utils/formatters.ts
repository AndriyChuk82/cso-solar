export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  } catch {
    return '-'
  }
}

export function formatMoney(amount: number): string {
  if (isNaN(amount)) return '0 грн'
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' грн'
}

export function formatArea(hectares: number): string {
  if (isNaN(hectares)) return '0 га'
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(hectares) + ' га'
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  return phone
}

export function getDebtStatus(debtMoney: number, debtGrain: number, debtOil: number, debtSugar: number): 'paid' | 'partial' | 'debt' {
  const debts = [debtMoney, debtGrain, debtOil, debtSugar]
  
  let hasDebt = false
  for (const debt of debts) {
    if (debt > 0.01) { // Adding small tolerance for floating point errors
      hasDebt = true
      break
    }
  }

  if (hasDebt) return 'debt'
  
  // If all are <= 0, we treat it as paid
  return 'paid'
}

export function getDebtColor(status: 'paid' | 'partial' | 'debt'): string {
  switch (status) {
    case 'paid': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
    case 'partial': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20'
    case 'debt': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800'
  }
}
