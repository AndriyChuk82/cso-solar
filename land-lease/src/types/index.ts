export interface Landlord {
  id: string
  full_name: string
  phone: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface LandPlot {
  id: string
  landlord_id: string
  address: string
  settlement: string | null
  area_hectares: number
  cadastral_number: string | null
  latitude: number | null
  longitude: number | null
  payment_type: 'money' | 'natural' | 'mixed'
  annual_rate_money: number
  annual_rate_natural: string | null
  lease_start_date: string | null
  boundary_json?: string | null
  active: boolean
  created_at: string
  // Joined
  landlord?: Landlord
}

export type ChargeType = 'money' | 'grain' | 'oil' | 'sugar' | 'other'

export interface LeaseCharge {
  id: string
  plot_id: string
  charge_date: string
  charge_type: ChargeType
  amount: number
  unit: string
  description: string | null
  period: string | null
  created_at: string
  // Joined
  land_plot?: LandPlot
}

export interface LeasePayment {
  id: string
  plot_id: string
  payment_date: string
  payment_type: ChargeType
  amount: number
  unit: string
  description: string | null
  created_at: string
  // Joined
  land_plot?: LandPlot
}

export interface PlotBalance {
  plot_id: string
  landlord_id: string
  address: string
  area_hectares: number
  landlord_name: string
  charged_money: number
  paid_money: number
  debt_money: number
  charged_grain: number
  paid_grain: number
  debt_grain: number
  charged_oil: number
  paid_oil: number
  debt_oil: number
  charged_sugar: number
  paid_sugar: number
  debt_sugar: number
  charged_other: number
  paid_other: number
}

export interface LandlordBalance {
  landlord_id: string
  full_name: string
  phone: string | null
  plot_count: number
  total_area: number
  charged_money: number
  paid_money: number
  debt_money: number
  charged_grain: number
  paid_grain: number
  debt_grain: number
  charged_oil: number
  paid_oil: number
  debt_oil: number
  charged_sugar: number
  paid_sugar: number
  debt_sugar: number
}

export interface LandlordFormData {
  full_name: string
  phone: string
  notes: string
}

export interface PlotFormData {
  landlord_id: string
  address: string
  settlement: string
  area_hectares: number
  cadastral_number: string
  latitude: number | null
  longitude: number | null
  boundary_json?: string
  payment_type: 'money' | 'natural' | 'mixed'
  annual_rate_money: number
  annual_rate_natural: string
  lease_start_date: string
}

export interface ChargeFormData {
  plot_id: string
  charge_date: string
  charge_type: ChargeType
  amount: number
  unit: string
  description: string
  period: string
}

export interface PaymentFormData {
  plot_id: string
  payment_date: string
  payment_type: ChargeType
  amount: number
  unit: string
  description: string
}

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  money: 'Гроші',
  grain: 'Зерно',
  oil: 'Олія',
  sugar: 'Цукор',
  other: 'Інше',
}

export const CHARGE_TYPE_UNITS: Record<ChargeType, string> = {
  money: 'грн',
  grain: 'кг',
  oil: 'л',
  sugar: 'кг',
  other: 'шт',
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  money: 'Грошима',
  natural: 'Натурою',
  mixed: 'Комбіновано',
}
