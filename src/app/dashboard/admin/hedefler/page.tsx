'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

export default function HedeflerPage() {
  const bugun = new Date()
  const [yil, setYil] = useState(bugun.getFullYear())
  const [ay, setAy] = useState(bugun.getMonth() + 1)
  const [temsilciler, setTemsilciler] = useState<any[]>([])
  const [hedefler, setHedefler] = useState<Record<string, any>>({})
  const [kaydediyor, setKaydediyor] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('*').neq('role', 'admin')
      .then(({ data }) => setTemsilciler(data || []))
  }, [])

  useEffect(() => {
    if (temsilciler.length === 0) return
    supabase.from('monthly_targets')
      .select('*')
      .eq('yil', yil)
      .eq('ay', ay)
      .then(({ data }) => {
        const map: Record<string, any> = {}
        ;(data || []).forEach(h => { map[h.temsilci_id] = h })
        setHedefler(map)
      })
  }, [yil, ay, temsilciler])

  function hedefGuncelle(temsilciId: string, alan: string, deger: any) {
    setHedefler(h => ({
      ...h,
      [temsilciId]: { ...h[temsilciId], [alan]: deger }
    }))
  }

  async function kaydet(temsilciId: string) {
    setKaydediyor(temsilciId)
    const mevcut = hedefler[temsilciId] || {}
    const { error } = await supabase.from('monthly_targets').upsert({
      temsilci_id: temsilciId,
      yil, ay,
      hedef_satis_eur: Number(mevcut.hedef_satis_eur) || 0,
      hedef_tahsilat_tl: Number(mevcut.hedef_tahsilat_tl) || 0,
      hedef_ziyaret: Number(mevcut.hedef_ziyaret) || 0,
      hedef_yeni_musteri: Number(mevcut.hedef_yeni_musteri) || 0,
      hedef_teklif: Number(mevcut.hedef_teklif) || 0,
      hedef_onaylanan_teklif: Number(mevcut.hedef_onaylanan_teklif) || 0,
    }, { onConflict: 'temsilci_id,yil,ay' })
    setKaydediyor(null)
    if (!error) { setMesaj('Hedefler kaydedildi ✓'); setTimeout(() => setMesaj(''), 3000) }
  }

  const rolEtiket = (role: string) => role === 'imalatci_temsilci' ? 'İmalatçı Temsilcisi' : 'Proje Temsilcisi'

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Aylık Hedef Yönetimi</h1>
        <p className="text-slate-500 text-sm mt-1">Temsilci bazında aylık KPI hedeflerini belirleyin</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <label className="form-label">Yıl</label>
            <select className="form-input w-28" value={yil} onChange={e => setYil(Number(e.target.value))}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Ay</label>
            <select className="form-input w-36" value={ay} onChange={e => setAy(Number(e.target.value))}>
              {AYLAR.map((a, i) => <option key={i+1} value={i+1}>{a}</option>)}
            </select>
          </div>
          {mesaj && <div className="ml-auto text-sm text-green-600 font-medium">{mesaj}</div>}
        </div>
      </div>

      <div className="space-y-6">
        {temsilciler.map(t => {
          const h = hedefler[t.id] || {}
          return (
            <div key={t.id} className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-slate-900 text-lg">{t.full_name}</h2>
                  <p className="text-sm text-slate-500">{rolEtiket(t.role)}</p>
                </div>
                <button onClick={() => kaydet(t.id)} disabled={kaydediyor === t.id} className="btn-primary">
                  {kaydediyor === t.id ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { alan: 'hedef_satis_eur', etiket: 'Aylık Satış Hedefi (€)', tip: 'number', placeholder: '50000' },
                  { alan: 'hedef_tahsilat_tl', etiket: 'Aylık Tahsilat Hedefi (₺)', tip: 'number', placeholder: '2500000' },
                  { alan: 'hedef_ziyaret', etiket: 'Aylık Ziyaret Hedefi', tip: 'number', placeholder: '100' },
                  { alan: 'hedef_yeni_musteri', etiket: 'Yeni Müşteri Hedefi', tip: 'number', placeholder: '4' },
                  { alan: 'hedef_teklif', etiket: 'Teklif Hedefi', tip: 'number', placeholder: '30' },
                  { alan: 'hedef_onaylanan_teklif', etiket: 'Onaylanan Teklif Hedefi', tip: 'number', placeholder: '10' },
                ].map(({ alan, etiket, tip, placeholder }) => (
                  <div key={alan}>
                    <label className="form-label">{etiket}</label>
                    <input
                      type={tip}
                      className="form-input"
                      value={h[alan] || ''}
                      onChange={e => hedefGuncelle(t.id, alan, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
