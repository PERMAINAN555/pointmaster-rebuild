import { useState } from 'react'
import { Layers, Copy, Check, Download, Loader2, Shuffle, X } from 'lucide-react'
import html2canvas from 'html2canvas'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function GeneratorPot() {
  const [tournamentName, setTournamentName] = useState('')
  const [teamsText, setTeamsText] = useState('')
  const [perPot, setPerPot] = useState(12)
  const [pots, setPots] = useState({})
  const [potLabels, setPotLabels] = useState({})
  const [copiedKey, setCopiedKey] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const [downloadingKey, setDownloadingKey] = useState(null)

  function shuffle(arr) {
    const t = [...arr]
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[t[i], t[j]] = [t[j], t[i]]
    }
    return t
  }

  function reset() {
    setTournamentName('')
    setTeamsText('')
    setPerPot(12)
    setPots({})
    setPotLabels({})
    setError('')
    setCopiedAll(false)
  }

  function generate(doShuffle = true) {
    setError('')
    setPots({})
    setPotLabels({})
    setCopiedAll(false)

    if (!tournamentName.trim()) {
      setError('Mohon isi Nama Turnamen terlebih dahulu.')
      return
    }
    if (perPot < 2) {
      setError('Jumlah tim per POT minimal harus 2.')
      return
    }

    const teams = teamsText
      .split('\n')
      .map(l => l.replace(/^\d+[\.\-\)]*\s*/, '').trim())
      .filter(l => l.length > 0)

    if (teams.length === 0) {
      setError('Mohon masukkan minimal 1 nama tim di daftar.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const list = doShuffle ? shuffle(teams) : [...teams]
      const out = {}
      let idx = 0
      let potIdx = 0
      while (idx < list.length) {
        const label = `POT ${LETTERS[potIdx] || potIdx + 1}`
        out[label] = list.slice(idx, idx + perPot)
        idx += perPot
        potIdx++
      }
      setPots(out)
      setLoading(false)
    }, 500)
  }

  function setLabel(key, value) {
    setPotLabels(prev => ({ ...prev, [key]: value }))
  }

  function copyAll() {
    if (Object.keys(pots).length === 0) return
    let text = `HASIL DRAWING POT - *${tournamentName.toUpperCase()}*\n\n`
    Object.keys(pots).sort().forEach(key => {
      const custom = potLabels[key]?.trim() ? ` (${potLabels[key].trim()})` : ''
      text += `*${key}*${custom} - ${pots[key].length} Tim\n`
      pots[key].forEach((team, i) => {
        text += `${i + 1}. ${team}\n`
      })
      text += '\n'
    })
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 3000)
    })
  }

  function copyPot(key) {
    navigator.clipboard.writeText(pots[key].join('\n')).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  async function downloadPot(key, filename) {
    setDownloadingKey(key)
    const el = document.getElementById(key.replace(/\s/g, '-'))
    if (!el) return setDownloadingKey(null)
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        style: { transform: 'scale(1)' }
      })
      const a = document.createElement('a')
      a.download = filename
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (err) {
      console.error('Gagal mengunduh gambar:', err)
      alert('Gagal memproses gambar. Pastikan browser Anda mendukung fitur ini.')
    } finally {
      setDownloadingKey(null)
    }
  }

  const potKeys = Object.keys(pots).sort()
  const rows = []
  for (let i = 0; i < potKeys.length; i += 3) rows.push(potKeys.slice(i, i + 3))

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-[#E04E27] rounded-2xl">
            <Layers className="w-8 h-8" />
          </div>
          Generator POT
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Bagi tim peserta ke dalam beberapa pot secara acak.
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 mb-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Nama Turnamen</label>
            <input
              value={tournamentName}
              onChange={e => setTournamentName(e.target.value)}
              placeholder="Contoh: Turnamen Warga RW 11"
              className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Tim per POT</label>
            <input
              type="number" min="2" max="32"
              value={perPot}
              onChange={e => setPerPot(Math.max(2, parseInt(e.target.value) || 2))}
              className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">
            Daftar Tim (satu per baris)
          </label>
          <textarea
            value={teamsText}
            onChange={e => setTeamsText(e.target.value)}
            rows={10}
            placeholder={'1. EVOS\n2. RRQ\n3. Bigetron\n\nAtau paste langsung tanpa nomor.'}
            className="mt-1 w-full border rounded-lg px-3 py-2.5 text-sm font-mono"
          />
          <div className="text-xs text-gray-400 mt-1">
            Nomor di depan nama dihapus otomatis ("1. EVOS" → "EVOS").
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => generate(true)}
            disabled={loading}
            className="px-5 py-2.5 bg-[#E04E27] text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            {loading ? 'Mengacak…' : 'Generate POT'}
          </button>
          <button
            onClick={() => generate(false)}
            disabled={loading}
            className="px-4 py-2.5 border rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Urutan Asli
          </button>
          <button
            onClick={reset}
            className="px-4 py-2.5 border rounded-lg text-sm font-medium text-gray-600"
          >
            Reset
          </button>
          {potKeys.length > 0 && (
            <button
              onClick={copyAll}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-gray-900 text-white ml-auto"
            >
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedAll ? 'Tersalin!' : 'Copy Semua'}
            </button>
          )}
        </div>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {row.map(key => (
            <div key={key} id={key.replace(/\s/g, '-')} className="bg-white border-2 rounded-2xl overflow-hidden">
              <div className="bg-[#E04E27] text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg">{key}</span>
                  <span className="text-xs opacity-80">{pots[key].length} Tim</span>
                </div>
                <input
                  value={potLabels[key] || ''}
                  onChange={e => setLabel(key, e.target.value)}
                  placeholder="Label kustom (opsional)"
                  className="mt-2 w-full bg-white/20 placeholder-white/60 border border-white/30 rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <ul className="divide-y">
                {pots[key].map((team, i) => (
                  <li key={i} className="px-4 py-2 text-sm flex items-center gap-2">
                    <span className="text-gray-400 text-xs w-5 text-right">{i + 1}.</span>
                    <span>{team}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t p-2 flex gap-2">
                <button
                  onClick={() => copyPot(key)}
                  className="flex-1 text-xs py-1.5 border rounded flex items-center justify-center gap-1"
                >
                  {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === key ? 'Tersalin' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadPot(key, `${key}-${tournamentName || 'draw'}.png`)}
                  disabled={downloadingKey === key}
                  className="flex-1 text-xs py-1.5 border rounded flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {downloadingKey === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
