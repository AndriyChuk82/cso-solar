import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import type { LandPlot } from '../types'
import { formatArea, formatMoney } from '../utils/formatters'

// Fix default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface MapPlot extends LandPlot {
  status?: string
  balance?: any
}

interface MapComponentProps {
  plots: MapPlot[]
  height?: string
  zoom?: number
  onPlotClick?: (plot: MapPlot) => void
}

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

const ICONS = {
  paid: createColoredIcon('#22c55e'),
  partial: createColoredIcon('#f59e0b'),
  debt: createColoredIcon('#ef4444'),
  default: createColoredIcon('#3b82f6'),
}

function FitBounds({ plots }: { plots: MapPlot[] }) {
  const map = useMap()
  const fittedKeyRef = useRef<string | null>(null)
  const plotsKey = plots.map(p => p.id).join(',')

  useEffect(() => {
    if (plots.length > 0 && fittedKeyRef.current !== plotsKey) {
      fittedKeyRef.current = plotsKey
      const bounds = L.latLngBounds(plots.map(p => [p.latitude!, p.longitude!] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [plotsKey, map])
  return null
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom())
    },
  })
  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])
  return null
}

export default function MapComponent({ plots, height = '500px', zoom = 6, onPlotClick }: MapComponentProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const center: [number, number] = plots.length > 0 && plots[0].latitude && plots[0].longitude
    ? [plots[0].latitude, plots[0].longitude]
    : [49.0, 32.0]

  return (
    <div style={{ position: 'relative', zIndex: 1, isolation: 'isolate', height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
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

        <FitBounds plots={plots.filter(p => p.latitude && p.longitude)} />
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {plots.filter(p => p.latitude && p.longitude).map(plot => {
          let polygonCoords: [number, number][] = []
          if (plot.boundary_json) {
            try {
              polygonCoords = JSON.parse(plot.boundary_json)
            } catch {
              polygonCoords = []
            }
          }

          const statusColor = plot.status === 'paid' ? '#22c55e' : plot.status === 'partial' ? '#f59e0b' : '#ef4444'
          const hasPolygon = polygonCoords.length >= 3

          let centerLat = plot.latitude!
          let centerLng = plot.longitude!
          if (hasPolygon) {
            centerLat = polygonCoords.reduce((sum, p) => sum + p[0], 0) / polygonCoords.length
            centerLng = polygonCoords.reduce((sum, p) => sum + p[1], 0) / polygonCoords.length
          }

          const popupContent = (
            <div style={{ minWidth: '180px' }}>
              <strong className="text-sm">{plot.landlord?.full_name || 'Орендодавець'}</strong>
              <p className="text-xs text-gray-500 mt-1">{plot.address}</p>
              <p className="text-xs mt-1">Площа: {formatArea(Number(plot.area_hectares))}</p>
              {plot.balance && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {Number(plot.balance.debt_money) > 0 && (
                    <p className="text-xs text-red-600">Борг: {formatMoney(Number(plot.balance.debt_money))}</p>
                  )}
                  {Number(plot.balance.debt_grain) > 0 && (
                    <p className="text-xs text-amber-600">Зерно: {Number(plot.balance.debt_grain)} кг</p>
                  )}
                  {Number(plot.balance.debt_money) <= 0 && Number(plot.balance.debt_grain) <= 0 && (
                    <p className="text-xs text-green-600">✓ Оплачено</p>
                  )}
                </div>
              )}
            </div>
          )

          const showMarker = !hasPolygon || currentZoom < 15

          return (
            <div key={plot.id}>
              {hasPolygon && (
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{
                    color: statusColor,
                    fillColor: statusColor,
                    fillOpacity: 0.45,
                    weight: 3,
                  }}
                  eventHandlers={{
                    click: () => onPlotClick?.(plot),
                  }}
                >
                  <Popup>{popupContent}</Popup>
                </Polygon>
              )}

              {showMarker && (
                <Marker
                  position={[centerLat, centerLng]}
                  icon={ICONS[plot.status as keyof typeof ICONS] || ICONS.default}
                  eventHandlers={{
                    click: () => onPlotClick?.(plot),
                  }}
                >
                  <Popup>{popupContent}</Popup>
                </Marker>
              )}
            </div>
          )
        })}
      </MapContainer>
    </div>
  )
}
