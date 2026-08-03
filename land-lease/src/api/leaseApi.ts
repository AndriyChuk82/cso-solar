import { supabase } from './supabaseClient'
import type {
  Landlord,
  LandlordFormData,
  LandPlot,
  PlotFormData,
  LeaseCharge,
  ChargeFormData,
  LeasePayment,
  PaymentFormData,
  LandlordBalance,
  PlotBalance,
} from '../types'

function checkSupabase() {
  if (!supabase) throw new Error('Supabase is not initialized')
}

// ----------------------
// Landlords
// ----------------------

export async function fetchLandlords(): Promise<Landlord[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('landlords')
    .select('*')
    .eq('active', true)
    .order('full_name')

  if (error) throw new Error(`Помилка завантаження орендодавців: ${error.message}`)
  return data || []
}

export async function fetchLandlordById(id: string): Promise<Landlord | null> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('landlords')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Помилка завантаження орендодавця: ${error.message}`)
  return data || null
}

export async function createLandlord(data: LandlordFormData): Promise<Landlord> {
  checkSupabase()
  const { data: landlord, error } = await supabase!
    .from('landlords')
    .insert([data])
    .select()
    .single()

  if (error) throw new Error(`Помилка створення орендодавця: ${error.message}`)
  return landlord
}

export async function updateLandlord(id: string, data: Partial<LandlordFormData>): Promise<Landlord> {
  checkSupabase()
  const { data: landlord, error } = await supabase!
    .from('landlords')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Помилка оновлення орендодавця: ${error.message}`)
  return landlord
}

export async function deleteLandlord(id: string): Promise<void> {
  checkSupabase()
  const { error } = await supabase!
    .from('landlords')
    .update({ active: false })
    .eq('id', id)

  if (error) throw new Error(`Помилка видалення орендодавця: ${error.message}`)
}

// ----------------------
// Land Plots
// ----------------------

export async function fetchPlotsByLandlord(landlordId: string): Promise<LandPlot[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('land_plots')
    .select('*, landlord:landlords(*)')
    .eq('landlord_id', landlordId)
    .eq('active', true)

  if (error) throw new Error(`Помилка завантаження ділянок: ${error.message}`)
  return data || []
}

export async function fetchAllPlots(): Promise<LandPlot[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('land_plots')
    .select('*, landlord:landlords(*)')
    .eq('active', true)

  if (error) throw new Error(`Помилка завантаження ділянок: ${error.message}`)
  return data || []
}

export async function createPlot(data: PlotFormData): Promise<LandPlot> {
  checkSupabase()
  const insertData = {
    ...data,
    lease_start_date: data.lease_start_date || null
  }

  let { data: plot, error } = await supabase!
    .from('land_plots')
    .insert([insertData])
    .select('*, landlord:landlords(*)')
    .single()

  if (error && error.message.includes('boundary_json')) {
    delete (insertData as any).boundary_json
    const res = await supabase!
      .from('land_plots')
      .insert([insertData])
      .select('*, landlord:landlords(*)')
      .single()
    plot = res.data
    error = res.error
  }

  if (error) throw new Error(`Помилка створення ділянки: ${error.message}`)
  return plot
}

export async function updatePlot(id: string, data: Partial<PlotFormData>): Promise<LandPlot> {
  checkSupabase()
  const updateData = { ...data }
  if ('lease_start_date' in updateData && !updateData.lease_start_date) {
    updateData.lease_start_date = null as any
  }
  
  let { data: plot, error } = await supabase!
    .from('land_plots')
    .update(updateData)
    .eq('id', id)
    .select('*, landlord:landlords(*)')
    .single()

  if (error && error.message.includes('boundary_json')) {
    delete (updateData as any).boundary_json
    const res = await supabase!
      .from('land_plots')
      .update(updateData)
      .eq('id', id)
      .select('*, landlord:landlords(*)')
      .single()
    plot = res.data
    error = res.error
  }

  if (error) throw new Error(`Помилка оновлення ділянки: ${error.message}`)
  return plot
}

export async function deletePlot(id: string): Promise<void> {
  checkSupabase()
  const { error } = await supabase!
    .from('land_plots')
    .update({ active: false })
    .eq('id', id)

  if (error) throw new Error(`Помилка видалення ділянки: ${error.message}`)
}

// ----------------------
// Charges
// ----------------------

export async function fetchChargesByPlot(plotId: string): Promise<LeaseCharge[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('lease_charges')
    .select('*')
    .eq('plot_id', plotId)
    .order('charge_date', { ascending: false })

  if (error) throw new Error(`Помилка завантаження нарахувань: ${error.message}`)
  return data || []
}

export async function fetchAllCharges(): Promise<LeaseCharge[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('lease_charges')
    .select('*, land_plot:land_plots(*, landlord:landlords(*))')
    .order('charge_date', { ascending: false })

  if (error) throw new Error(`Помилка завантаження нарахувань: ${error.message}`)
  return data || []
}

export async function createCharge(data: ChargeFormData): Promise<LeaseCharge> {
  checkSupabase()
  const { data: charge, error } = await supabase!
    .from('lease_charges')
    .insert([data])
    .select('*, land_plot:land_plots(*, landlord:landlords(*))')
    .single()

  if (error) throw new Error(`Помилка створення нарахування: ${error.message}`)
  return charge
}

export async function deleteCharge(id: string): Promise<void> {
  checkSupabase()
  const { error } = await supabase!
    .from('lease_charges')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Помилка видалення нарахування: ${error.message}`)
}

// ----------------------
// Payments
// ----------------------

export async function fetchPaymentsByPlot(plotId: string): Promise<LeasePayment[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('lease_payments')
    .select('*')
    .eq('plot_id', plotId)
    .order('payment_date', { ascending: false })

  if (error) throw new Error(`Помилка завантаження оплат: ${error.message}`)
  return data || []
}

export async function fetchAllPayments(): Promise<LeasePayment[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('lease_payments')
    .select('*, land_plot:land_plots(*, landlord:landlords(*))')
    .order('payment_date', { ascending: false })

  if (error) throw new Error(`Помилка завантаження оплат: ${error.message}`)
  return data || []
}

export async function createPayment(data: PaymentFormData): Promise<LeasePayment> {
  checkSupabase()
  const { data: payment, error } = await supabase!
    .from('lease_payments')
    .insert([data])
    .select('*, land_plot:land_plots(*, landlord:landlords(*))')
    .single()

  if (error) throw new Error(`Помилка створення оплати: ${error.message}`)
  return payment
}

export async function deletePayment(id: string): Promise<void> {
  checkSupabase()
  const { error } = await supabase!
    .from('lease_payments')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Помилка видалення оплати: ${error.message}`)
}

// ----------------------
// Balances
// ----------------------

export async function fetchLandlordBalances(): Promise<LandlordBalance[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('landlord_balances')
    .select('*')

  if (error) throw new Error(`Помилка завантаження балансів: ${error.message}`)
  return data || []
}

export async function fetchPlotBalances(): Promise<PlotBalance[]> {
  checkSupabase()
  const { data, error } = await supabase!
    .from('plot_balances')
    .select('*')

  if (error) throw new Error(`Помилка завантаження балансів ділянок: ${error.message}`)
  return data || []
}

// ----------------------
// Auth (Session verification stub matching warehouse pattern)
// ----------------------
export async function verifySession(): Promise<boolean> {
  if (!supabase) return false
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (e) {
    console.error('Session verification error', e)
    return false
  }
}
