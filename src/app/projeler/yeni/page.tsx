'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COMPETITOR_BRANDS, PROJECT_STATUS_LABELS } from '@/types'

export default function YeniProjePage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    proje_adi: '', proje_tipi: 'ticari', guncel_durum: 'devam_ediyor',
    karar_verici: '', mimar: '', yuklenici: '',
    proje_buyuklugu_m2: '', tahmini_kapanis_tarihi: '',
    teklif_verildi: false, numune_verildi: false, teknik_calisma_yapildi: false,
    kaybedilen_marka: '', kazanilan_ciro: '', kazanilan_plaka: '', kazanilan_m2: '',
    pot_ciro: 0, pot_plaka: 0, pot_m2: 0, notlar: ''
  })

  function guncelle(alan: string, deger: any) { setForm(f => ({ ...f, [alan]: deger })) }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('projects').insert({
      ...form,
      sorumlu_id: user.id,
      pot_ciro: Number(form.pot_ciro),
      pot_plaka: Number(form.pot_plaka),
      pot_m2: Number(form.pot_m2),
      proje_buyuklugu_m2: form.proje_buyuklugu_m2 ? Number(form.proje_buyuklugu_m2) : null,
      kazanilan_ciro: form.kazanilan_ciro ? Number(form.kazanilan_ciro) : null,
      kazanilan_plaka: form.kazanilan_plaka ? Number(form.kazanilan_plaka) : null,
      kazanilan_m2: form.kazanilan_m2 ? Number(form.kazanilan_m2) : null,
      tahmini_kapanis_tarihi: form.tahmini_kapanis_tarihi || null,
      kaybedilen_marka: form.guncel_durum === 'kaybedildi' ? form.kaybedilen_marka : null,
    })
    if (error) { setHata('Hata: ' + error.message); setYukleniyor(false) }
    else { router.push('/projeler'); router.refresh() }
  }

  const durumlar = ['devam_ediyor','teklif_asamasinda','numune_asamasinda','karar_bekleniyor','kazanildi','kaybedildi','beklemede','iptal']

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Proje</h1>
        <p className="text-slate-500 text-sm mt-1">Proje portföyünüze yeni kayıt ekleyin</p>
      </div>
      <form onSubmit={kaydet} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Proje Bilgileri</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Proje Adı *</label>
              <input className="form-input" value={form.proje_adi} onChange={e => guncelle('proje_adi', e.target.value)} required placeholder="Proje adı" />
            </div>
            <div>
              <label className="form-label">Proje Tipi</label>
              <select className="form-input" value={form.proje_tipi} onChange={e => guncelle('proje_tipi', e.target.value)}>
                <option value="konut">Konut</option>
                <option value="ticari">Ticari</option>
                <option value="otel">Otel</option>
                <option value="saglik">Sağlık</option>
                <option value="egitim">Eğitim</option>
                <option value="endustri">Endüstri</option>
                <option value="diger">Diğer</option>
              </select>
            </div>
            <div>
              <label className="form-label">Güncel Durum *</label>
              <select className="form-input" value={form.guncel_durum} onChange={e => guncelle('guncel_durum', e.target.value)}>
                {durumlar.map(d => <option key={d} value={d}>{PROJECT_STATUS_LABELS[d as keyof typeof PROJECT_STATUS_LABELS]}</option>)}
              </select>
            </div>
            {form.guncel_durum === 'kaybedildi' && (
              <div className="col-span-2">
                <label className="form-label">Hangi Markaya Kaybedildi? *</label>
                <select className="form-input" value={form.kaybedilen_marka} onChange={e => guncelle('kaybedilen_marka', e.target.value)} required>
                  <option value="">Seçin...</option>
                  {COMPETITOR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            {form.guncel_durum === 'kazanildi' && (
              <>
                <div><label className="form-label">Kazanılan Ciro (€)</label><input type="number" className="form-input" value={form.kazanilan_ciro} onChange={e => guncelle('kazanilan_ciro', e.target.value)} /></div>
                <div><label className="form-label">Kazanılan Plaka</label><input type="number" className="form-input" value={form.kazanilan_plaka} onChange={e => guncelle('kazanilan_plaka', e.target.value)} /></div>
              </>
            )}
            <div><label className="form-label">Karar Verici</label><input className="form-input" value={form.karar_verici} onChange={e => guncelle('karar_verici', e.target.value)} placeholder="Ad Soyad" /></div>
            <div><label className="form-label">Mimar</label><input className="form-input" value={form.mimar} onChange={e => guncelle('mimar', e.target.value)} /></div>
            <div><label className="form-label">Yüklenici</label><input className="form-input" value={form.yuklenici} onChange={e => guncelle('yuklenici', e.target.value)} /></div>
            <div><label className="form-label">Proje Büyüklüğü (m²)</label><input type="number" className="form-input" value={form.proje_buyuklugu_m2} onChange={e => guncelle('proje_buyuklugu_m2', e.target.value)} /></div>
            <div><label className="form-label">Tahmini Kapanış</label><input type="date" className="form-input" value={form.tahmini_kapanis_tarihi} onChange={e => guncelle('tahmini_kapanis_tarihi', e.target.value)} /></div>
          </div>
          <div className="flex gap-6 mt-4">
            {[['teklif_verildi','Teklif Verildi'],['numune_verildi','Numune Verildi'],['teknik_calisma_yapildi','Teknik Çalışma']].map(([alan, etiket]) => (
              <label key={alan} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[alan as keyof typeof form] as boolean} onChange={e => guncelle(alan, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">{etiket}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Potansiyel</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Pot. Ciro (€)</label><input type="number" className="form-input" value={form.pot_ciro} onChange={e => guncelle('pot_ciro', e.target.value)} /></div>
            <div><label className="form-label">Pot. Plaka</label><input type="number" className="form-input" value={form.pot_plaka} onChange={e => guncelle('pot_plaka', e.target.value)} /></div>
            <div><label className="form-label">Pot. m²</label><input type="number" className="form-input" value={form.pot_m2} onChange={e => guncelle('pot_m2', e.target.value)} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar} onChange={e => guncelle('notlar', e.target.value)} placeholder="Proje notları..." />
        </div>

        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={yukleniyor} className="btn-primary">{yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}</button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
