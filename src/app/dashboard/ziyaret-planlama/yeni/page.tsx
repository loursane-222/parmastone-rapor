'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function YeniZiyaretPage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    customer_id: '', planlanan_tarih: '', planlanan_saat: '',
    ziyaret_tipi: 'rutin', amac: '', beklenen_sonuc: '', plan_notu: ''
  })

  useEffect(() => {
    supabase.from('customers').select('id, firma_adi, kayit_tipi').order('firma_adi')
      .then(({ data }) => setMusteriler(data || []))
  }, [])

  function guncelle(alan: string, deger: any) { setForm(f => ({ ...f, [alan]: deger })) }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('visit_plans').insert({
      ...form, temsilci_id: user.id,
      planlanan_saat: form.planlanan_saat || null,
    })
    if (error) { setHata('Hata: ' + error.message); setYukleniyor(false) }
    else { router.push('/dashboard/ziyaret-planlama') }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ziyaret Planla</h1>
      </div>
      <form onSubmit={kaydet} className="card p-6 space-y-4">
        <div>
          <label className="form-label">Müşteri *</label>
          <select className="form-input" value={form.customer_id} onChange={e => guncelle('customer_id', e.target.value)} required>
            <option value="">Müşteri seçin...</option>
            {musteriler.map(m => <option key={m.id} value={m.id}>{m.firma_adi}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Tarih *</label>
            <input type="date" className="form-input" value={form.planlanan_tarih} onChange={e => guncelle('planlanan_tarih', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Saat</label>
            <input type="time" className="form-input" value={form.planlanan_saat} onChange={e => guncelle('planlanan_saat', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label">Ziyaret Tipi</label>
          <select className="form-input" value={form.ziyaret_tipi} onChange={e => guncelle('ziyaret_tipi', e.target.value)}>
            <option value="rutin">Rutin Ziyaret</option>
            <option value="teklif">Teklif Görüşmesi</option>
            <option value="numune">Numune/Teşhir</option>
            <option value="teknik">Teknik Sunum</option>
            <option value="tahsilat">Tahsilat</option>
            <option value="tanitim">Ürün Tanıtımı</option>
          </select>
        </div>
        <div>
          <label className="form-label">Amaç</label>
          <input className="form-input" value={form.amac} onChange={e => guncelle('amac', e.target.value)} placeholder="Ziyaret amacı..." />
        </div>
        <div>
          <label className="form-label">Beklenen Sonuç</label>
          <input className="form-input" value={form.beklenen_sonuc} onChange={e => guncelle('beklenen_sonuc', e.target.value)} placeholder="Bu ziyaretten ne bekliyorsunuz?" />
        </div>
        <div>
          <label className="form-label">Not</label>
          <textarea className="form-input h-20 resize-none" value={form.plan_notu} onChange={e => guncelle('plan_notu', e.target.value)} placeholder="Ek notlar..." />
        </div>
        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={yukleniyor} className="btn-primary">{yukleniyor ? 'Kaydediliyor...' : 'Planla'}</button>
          <button type="button" onClick={() => router.push('/dashboard/ziyaret-planlama')} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
