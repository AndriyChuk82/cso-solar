import React, { useState, useEffect } from 'react'
import { X, Search, MapPin, Loader2, Undo, RotateCcw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LandPlot } from '../types'
import { PAYMENT_TYPE_LABELS } from '../types'
import { usePlotStore } from '../stores/plotStore'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface PlotFormProps {
  landlordId: string
  plot?: LandPlot
  onClose: () => void
}

function calculatePolygonAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0
  const RADIUS = 6378137
  let total = 0
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i]
    const p2 = coords[(i + 1) % coords.length]
    const lat1 = (p1[0] * Math.PI) / 180
    const lat2 = (p2[0] * Math.PI) / 180
    const lon1 = (p1[1] * Math.PI) / 180
    const lon2 = (p2[1] * Math.PI) / 180
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  const areaSqMeters = Math.abs((total * RADIUS * RADIUS) / 2)
  return Number((areaSqMeters / 10000).toFixed(4))
}

function MapEventsHandler({
  mode,
  onLocationSelect,
  onAddPolygonPoint,
}: {
  mode: 'marker' | 'polygon'
  onLocationSelect: (lat: number, lng: number) => void
  onAddPolygonPoint: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (mode === 'marker') {
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      } else {
        onAddPolygonPoint(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function PlotForm({ landlordId, plot, onClose }: PlotFormProps) {
  const { create, update } = usePlotStore()
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeMsg, setGeocodeMsg] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState<'marker' | 'polygon'>('polygon')
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])

  const [formData, setFormData] = useState({
    address: '',
    settlement: '',
    area_hectares: 0,
    cadastral_number: '',
    payment_type: 'money' as 'money' | 'natural' | 'mixed',
    annual_rate_money: 0,
    annual_rate_natural: '',
    lease_start_date: new Date().toISOString().split('T')[0],
    latitude: 49.0,
    longitude: 32.0,
  })

  useEffect(() => {
    if (plot) {
      let initialPoints: [number, number][] = []
      if (plot.boundary_json) {
        try {
          initialPoints = JSON.parse(plot.boundary_json)
        } catch {
          initialPoints = []
        }
      }
      setPolygonPoints(initialPoints)
      setFormData({
        address: plot.address || '',
        settlement: plot.settlement || '',
        area_hectares: Number(plot.area_hectares) || 0,
        cadastral_number: plot.cadastral_number || '',
        payment_type: plot.payment_type || 'money',
        annual_rate_money: Number(plot.annual_rate_money) || 0,
        annual_rate_natural: plot.annual_rate_natural || '',
        lease_start_date: plot.lease_start_date ? plot.lease_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        latitude: plot.latitude ? Number(plot.latitude) : 49.0,
        longitude: plot.longitude ? Number(plot.longitude) : 32.0,
      })
    }
  }, [plot])

  const handleAddPolygonPoint = (lat: number, lng: number) => {
    const updated = [...polygonPoints, [lat, lng] as [number, number]]
    setPolygonPoints(updated)
    const calculatedArea = calculatePolygonAreaHectares(updated)
    if (calculatedArea > 0) {
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        area_hectares: calculatedArea,
      }))
    } else {
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
    }
  }

  const handleUndoPoint = () => {
    const updated = polygonPoints.slice(0, -1)
    setPolygonPoints(updated)
    const calculatedArea = calculatePolygonAreaHectares(updated)
    if (calculatedArea > 0) {
      setFormData(prev => ({ ...prev, area_hectares: calculatedArea }))
    }
  }

  const handleClearPolygon = () => {
    setPolygonPoints([])
  }

  const handleSearchOnMap = async () => {
    const queryParts = [formData.settlement, formData.address].filter(Boolean)
    if (queryParts.length === 0) {
      setGeocodeMsg('Введіть населений пункт або адресу для пошуку')
      return
    }
    setGeocoding(true)
    setGeocodeMsg(null)
    try {
      const query = queryParts.join(', ') + ', Україна'
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ua&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))
        setGeocodeMsg(`Знайдено: ${data[0].display_name.split(',')[0]}`)
      } else {
        setGeocodeMsg('Не вдалося знайти точку за цією адресою. Клікніть потрібне місце на карті.')
      }
    } catch {
      setGeocodeMsg('Помилка з\'єднання з сервером карт')
    } finally {
      setGeocoding(false)
    }
  }

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.address.trim()) {
      setSubmitError('Будь ласка, заповніть обов\'язкове поле «Адреса»')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        ...formData,
        landlord_id: landlordId,
        boundary_json: polygonPoints.length >= 3 ? JSON.stringify(polygonPoints) : undefined,
      }
      if (plot) {
        await update(plot.id, payload)
      } else {
        await create(payload)
      }
      onClose()
    } catch (err: any) {
      console.error('Error saving plot:', err)
      setSubmitError(err.message || 'Помилка збереження ділянки в базі даних')
    } finally {
      setSubmitting(false)
    }
  }

  const showMoney = formData.payment_type === 'money' || formData.payment_type === 'mixed'
  const showNatural = formData.payment_type === 'natural' || formData.payment_type === 'mixed'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 modal-overlay p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-2xl my-auto modal-content">
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700 modal-header">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {plot ? 'Редагувати ділянку' : 'Додати ділянку'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Адреса *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Населений пункт</label>
              <input
                type="text"
                value={formData.settlement}
                onChange={e => setFormData({ ...formData, settlement: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Площа (га) * {polygonPoints.length >= 3 && <span className="text-xs text-green-600 dark:text-green-400 font-normal">(авто-розраховано з контуру)</span>}
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.area_hectares}
                onChange={e => setFormData({ ...formData, area_hectares: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Кадастровий номер</label>
              <input
                type="text"
                value={formData.cadastral_number}
                onChange={e => setFormData({ ...formData, cadastral_number: e.target.value })}
                placeholder="4621183300:01:001:0000"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Тип оплати</label>
              <select
                value={formData.payment_type}
                onChange={e => setFormData({ ...formData, payment_type: e.target.value as any })}
                className="form-select"
              >
                {Object.entries(PAYMENT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Початок оренди</label>
              <input
                type="date"
                value={formData.lease_start_date}
                onChange={e => setFormData({ ...formData, lease_start_date: e.target.value })}
                className="form-input"
              />
            </div>
            {showMoney && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Річна ставка (грн)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annual_rate_money}
                  onChange={e => setFormData({ ...formData, annual_rate_money: Number(e.target.value) })}
                  className="form-input"
                />
              </div>
            )}
            {showNatural && (
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Річна ставка (натура)</label>
                <input
                  type="text"
                  value={formData.annual_rate_natural}
                  onChange={e => setFormData({ ...formData, annual_rate_natural: e.target.value })}
                  placeholder="напр. 500 кг пшениці"
                  className="form-input"
                />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                  Карта та межі поля:
                </label>
                <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-neutral-700">
                  <button
                    type="button"
                    onClick={() => setDrawMode('polygon')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${drawMode === 'polygon' ? 'bg-white dark:bg-neutral-800 text-amber-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    ✏️ Намалювати контур
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawMode('marker')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${drawMode === 'marker' ? 'bg-white dark:bg-neutral-800 text-amber-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    📍 Тільки точка
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSearchOnMap}
                disabled={geocoding}
                className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
              >
                {geocoding ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Знайти за адресою
              </button>
            </div>

            {drawMode === 'polygon' && (
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg mb-2 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span>
                  Точок контуру: <strong>{polygonPoints.length}</strong>
                  {polygonPoints.length >= 3 && ` • Площа: ${calculatePolygonAreaHectares(polygonPoints)} га`}
                </span>
                <div className="flex gap-2">
                  {polygonPoints.length > 0 && (
                    <button type="button" onClick={handleUndoPoint} className="hover:underline flex items-center gap-1">
                      <Undo size={12} /> Скасувати точку
                    </button>
                  )}
                  {polygonPoints.length > 0 && (
                    <button type="button" onClick={handleClearPolygon} className="hover:underline flex items-center gap-1 text-red-600 dark:text-red-400">
                      <RotateCcw size={12} /> Очистити
                    </button>
                  )}
                </div>
              </div>
            )}

            {geocodeMsg && (
              <p className={`text-xs mb-2 ${geocodeMsg.startsWith('Знайдено') ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {geocodeMsg}
              </p>
            )}

            <div className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden relative" style={{ isolation: 'isolate', zIndex: 1 }}>
              <MapContainer center={[formData.latitude, formData.longitude]} zoom={14} style={{ height: '300px', width: '100%' }}>
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="🛰️ Супутник Esri">
                    <TileLayer
                      attribution='Tiles &copy; Esri'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxNativeZoom={17}
                      maxZoom={20}
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="🛰️ Супутник Google">
                    <TileLayer
                      attribution='&copy; Google Maps'
                      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      maxZoom={20}
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="🗺️ Схема OSM">
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {polygonPoints.length >= 3 && (
                  <Polygon positions={polygonPoints} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4, weight: 3 }} />
                )}
                {polygonPoints.map((pt, idx) => (
                  <Marker
                    key={idx}
                    position={pt}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target
                        const latLng = marker.getLatLng()
                        const updated = [...polygonPoints]
                        updated[idx] = [Number(latLng.lat.toFixed(7)), Number(latLng.lng.toFixed(7))]
                        setPolygonPoints(updated)
                        const calculatedArea = calculatePolygonAreaHectares(updated)
                        if (calculatedArea > 0) {
                          setFormData(prev => ({
                            ...prev,
                            latitude: latLng.lat,
                            longitude: latLng.lng,
                            area_hectares: calculatedArea,
                          }))
                        }
                      },
                    }}
                  />
                ))}
                {polygonPoints.length === 0 && (
                  <Marker
                    position={[formData.latitude, formData.longitude]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target
                        const latLng = marker.getLatLng()
                        setFormData(prev => ({
                          ...prev,
                          latitude: Number(latLng.lat.toFixed(7)),
                          longitude: Number(latLng.lng.toFixed(7)),
                        }))
                      },
                    }}
                  />
                )}

                <MapEventsHandler
                  mode={drawMode}
                  onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                  onAddPolygonPoint={handleAddPolygonPoint}
                />
                <MapController center={[formData.latitude, formData.longitude]} />
              </MapContainer>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              💡 Клікайте по карті для додавання точок або <strong>перетягуйте будь-яку точку мишкою</strong> для підгонки контуру.
            </p>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t dark:border-neutral-700 modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary min-w-[110px]"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Збереження...
                </>
              ) : (
                'Зберегти'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
