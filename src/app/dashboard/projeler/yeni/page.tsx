'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_STATUS_LABELS } from '@/types'

const MARKALAR = ['Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer']
const KULLANIM_ALANLARI = ['Tezgah','Cephe','Zemin','Duvar','Mobilya','Banyo','Mutfak','Dış Mekan','Diğer']
const KALINLIKLAR = ['20MM','12MM','5MM','3MM','2MM']
const KONUT_TIPLERI = ['Daire','Villa','AVM','Ofis','Otel','Hastane','Okul','Endüstriyel','Diğer']
const DURUMLAR = ['devam_ediyor','teklif_asamasinda','numune_asamasinda','karar_bekleniyor','kazanildi','kaybedildi','beklemede','iptal']

interface ProjeKalemi {
  kullanim_alani: string
  kalinlik: string
  metraj: string
  birim_fiyat: string
}

export default function YeniProjePage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    proje_adi: '', customer_id: '',
    proje_tipi: 'ticari', guncel_durum: 'devam_ediyor',
    konut_tipi: '', konut_sayisi: '',
    karar_verici: '', mimar: '', yuklenici: '',
    tahmini_kapanis_tarihi: '',
    teklif_verildi: false, numune_verildi: false, teknik_calisma_yapildi: false,
    kaybedilen_marka: '',
    kazanilan_ciro: '', kazanilan_plaka: '', kazanilan_m2: '',
    notlar: ''
  })
  const [kalemler, setKalemler] = useState<ProjeKalemi[]>([
    { kullanim_alani: '', kalinlik: '', metraj: '', birim_fiyat: '' }
  ])

  useEffect(() => {
    supabase.from('customers').select('id, firma_adi').order('firma_adi')
      .then(({ data }) => setMusteriler(data || []))
  }, [])

  function guncelle(alan: string, deger: any) { setForm(f => ({ ...f, [alan]: deger })) }

  function kalemGuncelle(idx: number, alan: keyof ProjeKalemi, deger: string) {
    setKalemler(k => k.map((item, i) => i === idx ? { ...item, [alan]: deger } : item))
  }

  function kalemEkle() {
    setKalemler(k => [...k, { kullanim_alani: '', kalinlik: '', metraj: '', birim_fiyat: '' }])
  }

  function kalemSil(idx: number) {
    setKalemler(k => k.filter((_, i) => i !== idx))
  }

  const toplamTutar = kalemler.reduce((t, k) => t + (Number(k.metraj) || 0) * (Number(k.birim_fiyat) || 0), 0)
  const toplamMetraj = kalemler.reduce((t, k) => t + (Number(k.metraj) || 0), 0)

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const gecerliKalemler = kalemler.filter(k => k.kullanim_alani)

    const { data: proje, error } = await supabase.from('projects').insert({
      proje_adi: form.proje_adi,
      customer_id: form.customer_id || null,
      proje_tipi: form.proje_tipi,
      guncel_durum: form.guncel_durum,
      konut_tipi: form.konut_tipi || null,
      konut_sayisi: form.konut_sayisi ? Number(form.konut_sayisi) : null,
      sorumlu_id: user.id,
      karar_verici: form.karar_verici || null,
      mimar: form.mimar || null,
      yuklenici: form.yuklenici || null,
      tahmini_kapanis_tarihi: form.tahmini_kapanis_tarihi || null,
      teklif_verildi: form.teklif_verildi,
      numune_verildi: form.numune_verildi,
      teknik_calisma_yapildi: form.teknik_calisma_yapildi,
      kaybedilen_marka: form.guncel_durum === 'kaybedildi' ? form.kaybedilen_marka : null,
      kazanilan_ciro: form.kazanilan_ciro ? Number(form.kazanilan_ciro) : null,
      kazanilan_m2: form.kazanilan_m2 ? Number(form.kazanilan_m2) : null,
      kazanilan_plaka: form.kazanilan_plaka ? Number(form.kazanilan_plaka) : null,
      pot_ciro: toplamTutar,
      pot_m2: toplamMetraj,
      pot_plaka: 0,
      notlar: form.notlar || null,
    }).select().single()

    if (error) { setHata('Hata: ' + error.message); setYukleniyor(false); return }

    if (gecerliKalemler.length > 0 && proje) {
      await supabase.from('project_items').insert(
        gecerliKalemler.map(k => ({
          project_id: proje.id,
          kullanim_alani: k.kullanim_alani,
          kalinlik: k.kalinlik || null,
          metraj: Number(k.metraj) || 0,
          birim_fiyat: Number(k.birim_fiyat) || 0,
        }))
      )
    }

    router.push('/dashboard/projeler')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Proje Kaydı</h1>
        <p className="text-slate-500 text-sm mt-1">Proje portföyünüze yeni kayıt ekleyin</p>
      </div>
      <form onSubmit={kaydet} className="space-y-6">

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Proje Bilgileri</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Proje Adı *</label>
              <input className="form-input" value={form.proje_adi} onChange={e => guncelle('proje_adi', e.target.value)} required placeholder="Örn: Ekinci İnşaat Torbalı" />
            </div>
            <div>
              <label className="form-label">Bağlı Müşteri</label>
              <select className="form-input" value={form.customer_id} onChange={e => guncelle('customer_id', e.target.value)}>
                <option value="">Seçin (opsiyonel)...</option>
                {musteriler.map(m => <option key={m.id} value={m.id}>{m.firma_adi}</option>)}
              </select>
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
              <label className="form-label">Konut Tipi</label>
              <select className="form-input" value={form.konut_tipi} onChange={e => guncelle('konut_tipi', e.target.value)}>
                <option value="">Seçin...</option>
                {KONUT_TIPLERI.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Konut / Ünite Sayısı</label>
              <input type="number" className="form-input" value={form.konut_sayisi} onChange={e => guncelle('konut_sayisi', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Güncel Durum *</label>
              <select className="form-input" value={form.guncel_durum} onChange={e => guncelle('guncel_durum', e.target.value)}>
                {DURUMLAR.map(d => <option key={d} value={d}>{PROJECT_STATUS_LABELS[d as keyof typeof PROJECT_STATUS_LABELS]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tahmini Kapanış</label>
              <input type="date" className="form-input" value={form.tahmini_kapanis_tarihi} onChange={e => guncelle('tahmini_kapanis_tarihi', e.target.value)} />
            </div>
          </div>

          {form.guncel_durum === 'kaybedildi' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <label className="form-label text-red-700 mb-2 block">Hangi Markaya Kaybedildi? *</label>
              <div className="grid grid-cols-4 gap-2">
                {MARKALAR.map(m => (
                  <button key={m} type="button" onClick={() => guncelle('kaybedilen_marka', m)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${form.kaybedilen_marka === m ? 'bg-red-600 text-white border-red-600 font-semibold' : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.guncel_durum === 'kazanildi' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-700 mb-3">🎉 Kazanılan Detaylar</p>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="form-label">Kazanılan Ciro (€)</label><input type="number" className="form-input" value={form.kazanilan_ciro} onChange={e => guncelle('kazanilan_ciro', e.target.value)} /></div>
                <div><label className="form-label">Kazanılan m²</label><input type="number" className="form-input" value={form.kazanilan_m2} onChange={e => guncelle('kazanilan_m2', e.target.value)} /></div>
                <div><label className="form-label">Kazanılan Plaka</label><input type="number" className="form-input" value={form.kazanilan_plaka} onChange={e => guncelle('kazanilan_plaka', e.target.value)} /></div>
              </div>
            </div>
          )}

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">Kullanım Alanları ve Metraj</h2>
              <p className="text-xs text-slate-500 mt-0.5">Her kullanım alanı için ayrı kalınlık, metraj ve fiyat girebilirsiniz</p>
            </div>
            <button type="button" onClick={kalemEkle} className="btn-secondary text-sm">+ Alan Ekle</button>
          </div>

          <div className="space-y-3">
            {kalemler.map((k, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="col-span-3">
                  {idx === 0 && <label className="form-label">Kullanım Alanı</label>}
                  <select className="form-input" value={k.kullanim_alani} onChange={e => kalemGuncelle(idx, 'kullanim_alani', e.target.value)}>
                    <option value="">Seçin...</option>
                    {KULLANIM_ALANLARI.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="form-label">Kalınlık</label>}
                  <select className="form-input" value={k.kalinlik} onChange={e => kalemGuncelle(idx, 'kalinlik', e.target.value)}>
                    <option value="">Seçin...</option>
                    {KALINLIKLAR.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="form-label">Metraj (m²)</label>}
                  <input type="number" className="form-input" value={k.metraj} onChange={e => kalemGuncelle(idx, 'metraj', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="form-label">Birim Fiyat (€)</label>}
                  <input type="number" className="form-input" value={k.birim_fiyat} onChange={e => kalemGuncelle(idx, 'birim_fiyat', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="form-label">Tutar (€)</label>}
                  <div className="form-input bg-slate-100 text-slate-700 font-semibold">
                    €{((Number(k.metraj)||0) * (Number(k.birim_fiyat)||0)).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  {kalemler.length > 1 && (
                    <button type="button" onClick={() => kalemSil(idx)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {toplamTutar > 0 && (
            <div className="mt-4 p-4 bg-brand-50 rounded-xl flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <span className="text-brand-700">Toplam Metraj: <strong>{toplamMetraj.toLocaleString('tr-TR')} m²</strong></span>
              </div>
              <span className="text-xl font-bold text-brand-800">Toplam: €{toplamTutar.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Karar Vericiler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Karar Verici</label><input className="form-input" value={form.karar_verici} onChange={e => guncelle('karar_verici', e.target.value)} placeholder="Ad Soyad" /></div>
            <div><label className="form-label">Mimar</label><input className="form-input" value={form.mimar} onChange={e => guncelle('mimar', e.target.value)} /></div>
            <div className="col-span-2"><label className="form-label">Yüklenici</label><input className="form-input" value={form.yuklenici} onChange={e => guncelle('yuklenici', e.target.value)} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar} onChange={e => guncelle('notlar', e.target.value)} placeholder="Proje notları..." />
        </div>

        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={yukleniyor} className="btn-primary">{yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}</button>
          <button type="button" onClick={() => router.push('/dashboard/projeler')} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
