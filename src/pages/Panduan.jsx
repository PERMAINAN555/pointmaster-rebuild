export default function Panduan() {
  const sections = [
    { t: '1. Buat Turnamen', d: 'Dari Dashboard, klik "+ Turnamen Baru". Isi nama, format, tipe, dan poin rules.' },
    { t: '2. Import Tim', d: 'Buka Wizard BR di turnamen → Upload screenshot klasemen → OCR otomatis → review → simpan.' },
    { t: '3. Input Hasil Match', d: 'Buka tab Match → Edit → masukkan placement + kill per tim. Poin dihitung otomatis.' },
    { t: '4. Leaderboard', d: 'Akumulasi poin dari semua match. Klik dari halaman turnamen.' },
    { t: '5. Bagan', d: 'Visual bracket — aktif kalau turnamen tipe bracket.' },
    { t: '6. Overlay', d: 'URL OBS-friendly — bagikan ke streamer. /overlay/:id' }
  ]
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Panduan</h2>
      {sections.map((s, i) => (
        <div key={i} className="bg-white border rounded-lg p-4">
          <div className="font-semibold">{s.t}</div>
          <div className="text-sm text-gray-600 mt-1">{s.d}</div>
        </div>
      ))}
    </div>
  )
}
