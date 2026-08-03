import { create } from 'zustand'
import type { Landlord, LandlordFormData } from '../types'
import * as api from '../api/leaseApi'

interface LandlordState {
  landlords: Landlord[]
  loading: boolean
  error: string | null
  selectedId: string | null
  searchQuery: string
  
  fetchAll: () => Promise<void>
  create: (data: LandlordFormData) => Promise<Landlord>
  update: (id: string, data: Partial<LandlordFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  setSelectedId: (id: string | null) => void
  setSearchQuery: (q: string) => void
}

export const useLandlordStore = create<LandlordState>((set) => ({
  landlords: [],
  loading: false,
  error: null,
  selectedId: null,
  searchQuery: '',

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const landlords = await api.fetchLandlords()
      set({ landlords, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  create: async (data) => {
    const landlord = await api.createLandlord(data)
    set(s => ({ landlords: [...s.landlords, landlord] }))
    return landlord
  },

  update: async (id, data) => {
    const updated = await api.updateLandlord(id, data)
    set(s => ({ landlords: s.landlords.map(l => l.id === id ? updated : l) }))
  },

  remove: async (id) => {
    await api.deleteLandlord(id)
    set(s => ({ landlords: s.landlords.filter(l => l.id !== id) }))
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
