import { create } from 'zustand'
import type { LeaseCharge, LeasePayment, LandlordBalance, PlotBalance, ChargeFormData, PaymentFormData } from '../types'
import * as api from '../api/leaseApi'

interface FinanceState {
  charges: LeaseCharge[]
  payments: LeasePayment[]
  landlordBalances: LandlordBalance[]
  plotBalances: PlotBalance[]
  loading: boolean
  error: string | null

  fetchCharges: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchBalances: () => Promise<void>
  createCharge: (data: ChargeFormData) => Promise<LeaseCharge>
  createPayment: (data: PaymentFormData) => Promise<LeasePayment>
  deleteCharge: (id: string) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  charges: [],
  payments: [],
  landlordBalances: [],
  plotBalances: [],
  loading: false,
  error: null,

  fetchCharges: async () => {
    set({ loading: true, error: null })
    try {
      const charges = await api.fetchAllCharges()
      set({ charges, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchPayments: async () => {
    set({ loading: true, error: null })
    try {
      const payments = await api.fetchAllPayments()
      set({ payments, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchBalances: async () => {
    set({ loading: true, error: null })
    try {
      const landlordBalances = await api.fetchLandlordBalances()
      const plotBalances = await api.fetchPlotBalances()
      set({ landlordBalances, plotBalances, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  createCharge: async (data) => {
    const charge = await api.createCharge(data)
    set(s => ({ charges: [charge, ...s.charges] }))
    // Automatically refetch balances to keep them in sync
    get().fetchBalances()
    return charge
  },

  createPayment: async (data) => {
    const payment = await api.createPayment(data)
    set(s => ({ payments: [payment, ...s.payments] }))
    get().fetchBalances()
    return payment
  },

  deleteCharge: async (id) => {
    await api.deleteCharge(id)
    set(s => ({ charges: s.charges.filter(c => c.id !== id) }))
    get().fetchBalances()
  },

  deletePayment: async (id) => {
    await api.deletePayment(id)
    set(s => ({ payments: s.payments.filter(p => p.id !== id) }))
    get().fetchBalances()
  }
}))
