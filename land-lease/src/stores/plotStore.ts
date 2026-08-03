import { create } from 'zustand'
import type { LandPlot, PlotFormData } from '../types'
import * as api from '../api/leaseApi'

interface PlotState {
  plots: LandPlot[]
  loading: boolean
  error: string | null
  
  fetchAll: () => Promise<void>
  fetchByLandlord: (landlordId: string) => Promise<void>
  create: (data: PlotFormData) => Promise<LandPlot>
  update: (id: string, data: Partial<PlotFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePlotStore = create<PlotState>((set) => ({
  plots: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const plots = await api.fetchAllPlots()
      set({ plots, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  fetchByLandlord: async (landlordId: string) => {
    set({ loading: true, error: null })
    try {
      const plots = await api.fetchPlotsByLandlord(landlordId)
      set({ plots, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  create: async (data) => {
    const plot = await api.createPlot(data)
    set(s => ({ plots: [...s.plots, plot] }))
    return plot
  },

  update: async (id, data) => {
    const updated = await api.updatePlot(id, data)
    set(s => ({ plots: s.plots.map(p => p.id === id ? updated : p) }))
  },

  remove: async (id) => {
    await api.deletePlot(id)
    set(s => ({ plots: s.plots.filter(p => p.id !== id) }))
  },
}))
