import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { LandPlot, ChargeType } from '../types'
import { CHARGE_TYPE_LABELS, CHARGE_TYPE_UNITS } from '../types'
import { useFinanceStore } from '../stores/financeStore'

interface ChargeFormProps {
  plots: LandPlot[]
  onClose: () => void
}

export default function ChargeForm({ plots, onClose }: ChargeFormProps) {
  const { createCharge } = useFinanceStore()
  const [formData, setFormData] = useState({
    plot_id: plots.length > 0 ? plots[0].id : '',
    charge_date: new Date().toISOString().split('T')[0],
    charge_type: 'money' as ChargeType,
    amount: 0,
    unit: CHARGE_TYPE_UNITS['money'],
    period: new Date().getFullYear().toString(),
    description: '',
  })

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      unit: CHARGE_TYPE_UNITS[prev.charge_type]
    }))
  }, [formData.charge_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.plot_id) return
    await createCharge({
      ...formData,
      amount: Number(formData.amount)
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between p-4 border-b modal-header">
          <h2 className="text-lg font-semibold">Створити нарахування</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body p-4 space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ділянка *</label>
            <select
              required
              value={formData.plot_id}
              onChange={e => setFormData({ ...formData, plot_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Оберіть ділянку</option>
              {plots.map(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.address} ({plot.landlord?.full_name || 'Невідомо'})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
              <input
                type="date"
                required
                value={formData.charge_date}
                onChange={e => setFormData({ ...formData, charge_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Період</label>
              <input
                type="text"
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                placeholder="напр. 2024"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
              <select
                value={formData.charge_type}
                onChange={e => setFormData({ ...formData, charge_type: e.target.value as ChargeType })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(CHARGE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Сума / Кількість *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="inline-flex items-center px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-md">
                  {formData.unit}
                </span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t modal-footer">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 btn btn-secondary">Скасувати</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 btn btn-primary">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  )
}
