import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Landlord } from '../types'
import { useLandlordStore } from '../stores/landlordStore'

interface LandlordFormProps {
  landlord?: Landlord
  onClose: () => void
}

export default function LandlordForm({ landlord, onClose }: LandlordFormProps) {
  const { create, update } = useLandlordStore()
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    notes: '',
  })
  
  useEffect(() => {
    if (landlord) {
      setFormData({
        full_name: landlord.full_name || '',
        phone: landlord.phone || '',
        notes: landlord.notes || '',
      })
    }
  }, [landlord])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (landlord) {
      await update(landlord.id, formData)
    } else {
      await create(formData)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md modal-content">
        <div className="flex items-center justify-between p-4 border-b modal-header">
          <h2 className="text-lg font-semibold">
            {landlord ? 'Редагувати орендодавця' : 'Додати орендодавця'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body p-4 space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 form-label">
              ПІБ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 form-input"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 form-label">
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 form-input"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 form-label">
              Примітки
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 form-textarea min-h-[100px]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 btn btn-secondary"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 btn btn-primary"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
