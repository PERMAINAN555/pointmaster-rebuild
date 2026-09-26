import { useEffect, useRef, useState } from 'react'
import { MapPin, Trash2, Save, MousePointer2 } from 'lucide-react'

const MAPS = [
  { id: 'erangel', name: 'Erangel', src: '/maps/erangel.jpeg' },
  { id: 'miramar', name: 'Miramar', src: '/maps/miramar.jpeg' },
  { id: 'sanhok', name: 'Sanhok', src: '/maps/sanhok.jpeg' },
  { id: 'vikendi', name: 'Vikendi', src: '/maps/vikendi.jpeg' },
  { id: 'taego', name: 'Taego', src: '/maps/taego.jpeg' }
]

const KINDS = [
  { id: 'drop', label: 'Drop', color: '#E04E27' },
  { id: 'rotate', label: 'Rotasi', color: '#2563EB' },
  { id: 'enemy', label: 'Musuh', color: '#DC2626' },
  { id: 'zone', label: 'Zone', color: '#16A34A' }
]

export default function Planner() {
  const [mapId, setMapId] = useState(() => localStorage.getItem('pm-planner-map') || 'erangel')
  const [markers, setMarkers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pm-planner-markers') || '{}') } catch { return {} }
  })
  const [kind, setKind] = useState('drop')
  const [label, setLabel] = useState('')
  const [dragging, setDragging] = useState(null)
  const mapRef = useRef(null)

  useEffect(() => { localStorage.setItem('pm-planner-map', mapId) }, [mapId])
  useEffect(() => { localStorage.setItem('pm-planner-markers', JSON.stringify(markers)) }, [markers])

  const current = markers[mapId] || []
  const mapSrc = MAPS.find(m => m.id === mapId)?.src

  function addMarker(e) {
    if (dragging) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMarkers(prev => ({
      ...prev,
      [mapId]: [...(prev[mapId] || []), {
        id: Date.now().toString(),
        x, y, kind, label: label.trim()
      }]
    }))
    setLabel('')
  }

  function removeMarker(id) {
    setMarkers(prev => ({ ...prev, [mapId]: (prev[mapId] || []).filter(m => m.id !== id) }))
  }

  function startDrag(e, id) {
    e.stopPropagation()
    setDragging(id)
  }

  function onMove(e) {
    if (!dragging || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setMarkers(prev => ({
      ...prev,
      [mapId]: (prev[mapId] || []).map(m => m.id === dragging ? { ...m, x, y } : m)
    }))
  }

  function endDrag() { setDragging(null) }

  function clearAll() {
    if (!confirm('Hapus semua marker di map ini?')) return
    setMarkers(prev => ({ ...prev, [mapId]: [] }))
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ map: mapId, markers: current }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `planner-${mapId}.json`
    a.click()
  }

  return (
    <div
      className="space-y-4 max-w-5xl mx-auto select-none"
      onMouseMove={onMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={onMove}
      onTouchEnd={endDrag}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#E04E27]" /> Map Planner
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tap map untuk drop marker. Drag untuk atur posisi.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJson} className="px-3 py-1.5 border rounded text-sm flex items-center gap-1">
            <Save size={14} /> JSON
          </button>
          <button onClick={clearAll} className="px-3 py-1.5 border rounded text-sm text-red-600 flex items-center gap-1">
            <Trash2 size={14} /> Bersihkan
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {MAPS.map(m => (
          <button key={m.id} onClick={() => setMapId(m.id)}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap border ${mapId === m.id ? 'bg-[#E04E27] text-white border-[#E04E27]' : 'border-gray-300'}`}>
            {m.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {KINDS.map(k => (
          <button key={k.id} onClick={() => setKind(k.id)}
            className={`px-3 py-1 rounded text-xs border font-semibold ${kind === k.id ? 'text-white' : 'text-gray-700'}`}
            style={{ backgroundColor: kind === k.id ? k.color : 'white', borderColor: k.color }}>
            {k.label}
          </button>
        ))}
        <input value={label} onChange={e => setLabel(e.target.value)}
          placeholder="Label (opsional)"
          className="border rounded px-3 py-1 text-xs ml-auto w-40" />
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden relative">
        <div ref={mapRef} className="relative cursor-crosshair" onClick={addMarker}>
          <img src={mapSrc} alt={mapId} className="w-full block" draggable={false}
            onError={e => { e.target.style.display = 'none' }} />
          {current.map(m => {
            const k = KINDS.find(x => x.id === m.kind) || KINDS[0]
            return (
              <div
                key={m.id}
                onMouseDown={e => startDrag(e, m.id)}
                onTouchStart={e => { e.stopPropagation(); startDrag(e, m.id) }}
                onClick={e => e.stopPropagation()}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move z-10"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                    style={{ backgroundColor: k.color }}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  {m.label && (
                    <div className="text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap">
                      {m.label}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {!mapSrc && (
          <div className="p-16 text-center text-gray-400 text-sm">
            <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Map "{mapId}" belum tersedia.
            <br />Upload gambar ke <code>public/maps/{mapId}.jpeg</code> lalu refresh.
          </div>
        )}
      </div>

      {current.length > 0 && (
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs font-bold uppercase text-gray-500 mb-2">Markers ({current.length})</div>
          <div className="space-y-1">
            {current.map((m, i) => {
              const k = KINDS.find(x => x.id === m.kind) || KINDS[0]
              return (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: k.color }} />
                  <span className="font-mono">{i + 1}</span>
                  <span className="text-gray-500">{k.label}</span>
                  {m.label && <span>· {m.label}</span>}
                  <span className="text-gray-400 ml-auto font-mono">{m.x.toFixed(1)}%, {m.y.toFixed(1)}%</span>
                  <button onClick={() => removeMarker(m.id)} className="text-red-500"><Trash2 size={12} /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
