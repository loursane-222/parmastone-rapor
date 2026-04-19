'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatTarih, projeStatusRengi } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'

const MARKALAR = ['Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer']
const KULLANIM_ALANLARI = ['Tezgah','Cephe','Zemin','İç Mekan','Banyo','Mutfak','Dış Mekan','Diğer']
const KALINLIKLAR = ['20MM','12MM','5MM','3MM','2MM']
const KONUT_TIPLERI = ['Daire','Villa','AVM','Ofis','Otel','Hastane','Okul','Endüstriyel','Diğer']
const DURUMLAR = ['devam_ediyor','teklif_asamasinda','numune_asamasinda','karar_bekleniyor','kazanildi','kaybedildi','beklemede','iptal']

export default function ProjeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [proje, setProje] = useState<any>(null)
  const [duzenle, setDuzenle] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { params.then(p => setId(p.id)) }, [])

  useEffect(() => {
    if (!id) return
    supabase.from('projects')
      .select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)')
      .eq('id', id).single()
      .then(({ data }) => { setProje(data); setForm(data); setYukleniyor(false) })
  }, [id])

  function guncelle(alan: string, deger: any) { setForm((f: any) => ({ ...f, [alan]: deger })) }

  const projeToplam = (Number(form?.metraj) || 0) * (Number(form?.birim_fiyat) || 0)

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setKaydediyor(true)
    const { error } = await supabase.from('projects').update({
      proje_adi: form.proje_adi,
      proje_tipi: form.proje_tipi,
      guncel_durum: form.guncel_durum,
      konut_tipi: form.konut_tipi || null,
      konut_sayisi: form.konut_sayisi ? Number(form.konut_sayisi) : null,
      kullanim_alani: form.kullanim_alani || null,
      kalinlik: form.kalinlik || null,
      metraj: form.metraj ? Number(form.metraj) : null,
      birim_fiyat: form.birim_fiyat ? Number(form.birim_fiyat) : null,
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
      pot_ciro: projeToplam || (form.pot_ciro ? Number(form.pot_ciro) : 0),
      pot_m2: Number(form.metraj) || 0,
      pot_plaka: Number(form.pot_plaka) || 0,
      notlar: form.notlar || null,
    }).eq('id', id)
    if (error) { setHata('Hata: ' + error.message); setKaydediyor(false) }
    else {
      const { data } = await supabase.from('projects').select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)').eq('id', id).single()
      setProje(data); setForm(data); setDuzenle(false); setKaydediyor(false)
    }
  }

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>
  if (!proje) return <div className="text-center py-12 text-slate-400">Proje bulunamadı</div>

  if (duzenle && form) return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Proje Düzenle</h1>
        <p className="text-slate-500 text-sm mt-1">{proje.proje_adi}</p>
      </div>
      <form onSubmit={kaydet} className="space-y-6">

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Proje Bilgileri</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Proje Adı *</label>
              <input className="form-input" value={form.proje_adi || ''} onChange={e => guncelle('proje_adi', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Proje Tipi</label>
              <select className="form-input" value={form.proje_tipi} onChange={e => guncelle('proje_tipi', e.target.value)}>
                <option value="konut">Konut</option><option value="ticari">Ticari</option>
                <option value="otel">Otel</option><option value="saglik">Sağlık</option>
                <option value="egitim">Eğitim</option><option value="endustri">Endüstri</option>
                <option value="diger">Diğer</option>
              </select>
            </div>
            <div>
              <label className="form-label">Konut Tipi</label>
              <select className="form-input" value={form.konut_tipi || ''} onChange={e => guncelle('konut_tipi', e.target.value)}>
                <option value="">Seçin...</option>
                {KONUT_TIPLERI.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Konut / Ünite Sayısı</label>
              <input type="number" className="form-input" value={form.konut_sayisi || ''} onChange={e => guncelle('konut_sayisi', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Güncel Durum *</label>
              <select className="form-input" value={form.guncel_durum} onChange={e => guncelle('guncel_durum', e.target.value)}>
                {DURUMLAR.map(d => <option key={d} value={d}>{PROJECT_STATUS_LABELS[d as keyof typeof PROJECT_STATUS_LABELS]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tahmini Kapanış</label>
              <input type="date" className="form-input" value={form.tahmini_kapanis_tarihi || ''} onChange={e => guncelle('tahmini_kapanis_tarihi', e.target.value)} />
            </div>
          </div>

          {form.guncel_durum === 'kaybedildi' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <label className="form-label text-red-700 mb-2 block">Hangi Markaya Kaybedildi? *</label>
              <div className="grid grid-cols-4 gap-2">
                {MARKALAR.map(m => (
                  <button key={m} type="button"
                    onClick={() => guncelle('kaybedilen_marka', m)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${form.kaybedilen_marka === m ? 'bg-red-600 text-white border-red-600 font-semibold' : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
              {form.kaybedilen_marka && <p className="mt-2 text-sm font-medium text-red-700">Seçilen: {form.kaybedilen_marka}</p>}
            </div>
          )}

          {form.guncel_durum === 'kazanildi' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-700 mb-3">🎉 Kazanılan Proje Detayları</p>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="form-label">Kazanılan Ciro (€)</label><input type="number" className="form-input" value={form.kazanilan_ciro || ''} onChange={e => guncelle('kazanilan_ciro', e.target.value)} placeholder="0" /></div>
                <div><label className="form-label">Kazanılan m²</label><input type="number" className="form-input" value={form.kazanilan_m2 || ''} onChange={e => guncelle('kazanilan_m2', e.target.value)} placeholder="0" /></div>
                <div><label className="form-label">Kazanılan Plaka</label><input type="number" className="form-input" value={form.kazanilan_plaka || ''} onChange={e => guncelle('kazanilan_plaka', e.target.value)} placeholder="0" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Ürün ve Metraj</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Kullanım Alanı</label>
              <select className="form-input" value={form.kullanim_alani || ''} onChange={e => guncelle('kullanim_alani', e.target.value)}>
                <option value="">Seçin...</option>
                {KULLANIM_ALANLARI.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Kalınlık</label>
              <div className="flex gap-2 mt-1">
                {KALINLIKLAR.map(k => (
                  <button key={k} type="button"
                    onClick={() => guncelle('kalinlik', k)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${form.kalinlik === k ? 'bg-brand-600 text-white border-brand-600 font-semibold' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Metraj (m²)</label>
              <input type="number" className="form-input" value={form.metraj || ''} onChange={e => guncelle('metraj', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Birim Fiyat (€/m²)</label>
              <input type="number" className="form-input" value={form.birim_fiyat || ''} onChange={e => guncelle('birim_fiyat', e.target.value)} placeholder="0" />
            </div>
          </div>
          {projeToplam > 0 && (
            <div className="mt-4 p-4 bg-brand-50 rounded-xl flex items-center justify-between">
              <span className="text-sm text-brand-700 font-medium">Hesaplanan Proje Tutarı</span>
              <span className="text-xl font-bold text-brand-800">€{projeToplam.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Karar Vericiler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Karar Verici</label><input className="form-input" value={form.karar_verici || ''} onChange={e => guncelle('karar_verici', e.target.value)} /></div>
            <div><label className="form-label">Mimar</label><input className="form-input" value={form.mimar || ''} onChange={e => guncelle('mimar', e.target.value)} /></div>
            <div className="col-span-2"><label className="form-label">Yüklenici</label><input className="form-input" value={form.yuklenici || ''} onChange={e => guncelle('yuklenici', e.target.value)} /></div>
          </div>
          <div className="flex gap-6 mt-4">
            {[['teklif_verildi','Teklif Verildi'],['numune_verildi','Numune Verildi'],['teknik_calisma_yapildi','Teknik Çalışma']].map(([alan, etiket]) => (
              <label key={alan} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[alan] || false} onChange={e => guncelle(alan, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">{etiket}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar || ''} onChange={e => guncelle('notlar', e.target.value)} />
        </div>

        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={kaydediyor} className="btn-primary">{kaydediyor ? 'Kaydediliyor...' : 'Güncelle'}</button>
          <button type="button" onClick={() => setDuzenle(false)} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{proje.proje_adi}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${projeStatusRengi(proje.guncel_durum)}`}>
              {PROJECT_STATUS_LABELS[proje.guncel_durum as keyof typeof PROJECT_STATUS_LABELS]}
            </span>
            {proje.customer && <span className="text-slate-500 text-sm">{proje.customer.firma_adi}</span>}
            {proje.konut_tipi && <span className="text-slate-400 text-sm">{proje.konut_tipi}{proje.konut_sayisi ? ` · ${proje.konut_sayisi} ünite` : ''}</span>}
          </div>
        </div>
        <button onClick={() => setDuzenle(true)} className="btn-secondary">✏️ Düzenle</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">📋 Proje Bilgileri</h3>
          <dl className="space-y-2 text-sm">
            {proje.karar_verici && <div className="flex justify-between"><dt className="text-slate-500">Karar Verici</dt><dd className="font-medium">{proje.karar_verici}</dd></div>}
            {proje.mimar && <div className="flex justify-between"><dt className="text-slate-500">Mimar</dt><dd>{proje.mimar}</dd></div>}
            {proje.yuklenici && <div className="flex justify-between"><dt className="text-slate-500">Yüklenici</dt><dd>{proje.yuklenici}</dd></div>}
            {proje.tahmini_kapanis_tarihi && <div className="flex justify-between"><dt className="text-slate-500">Tahmini Kapanış</dt><dd>{formatTarih(proje.tahmini_kapanis_tarihi)}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Sorumlu</dt><dd>{proje.sorumlu?.full_name}</dd></div>
            {proje.kullanim_alani && <div className="flex justify-between"><dt className="text-slate-500">Kullanım Alanı</dt><dd>{proje.kullanim_alani}</dd></div>}
            {proje.kalinlik && <div className="flex justify-between"><dt className="text-slate-500">Kalınlık</dt><dd><span className="badge bg-brand-100 text-brand-800">{proje.kalinlik}</span></dd></div>}
            {proje.guncel_durum === 'kaybedildi' && proje.kaybedilen_marka && (
              <div className="flex justify-between pt-2 border-t border-slate-100"><dt className="text-slate-500">Kaybedilen Marka</dt><dd className="text-red-600 font-semibold">{proje.kaybedilen_marka}</dd></div>
            )}
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">📐 Metraj ve Ciro</h3>
          <div className="space-y-2 text-sm">
            {proje.metraj && <div className="flex justify-between"><span className="text-slate-500">Toplam Metraj</span><span className="font-semibold">{proje.metraj.toLocaleString('tr-TR')} m²</span></div>}
            {proje.birim_fiyat && <div className="flex justify-between"><span className="text-slate-500">Birim Fiyat</span><span className="font-semibold">€{proje.birim_fiyat}/m²</span></div>}
            {proje.pot_ciro > 0 && <div className="flex justify-between"><span className="text-slate-500">Pot. Ciro</span><span className="font-semibold">{formatEuro(proje.pot_ciro)}</span></div>}

            {proje.guncel_durum === 'kazanildi' && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Kazanılan</p>
                {proje.kazanilan_m2 && <div className="flex justify-between"><span className="text-slate-500">Kazanılan m²</span><span className="font-bold text-green-700">{proje.kazanilan_m2.toLocaleString('tr-TR')} m²</span></div>}
                {proje.kazanilan_ciro && <div className="flex justify-between"><span className="text-slate-500">Kazanılan Ciro</span><span className="font-bold text-green-700">{formatEuro(proje.kazanilan_ciro)}</span></div>}
                {proje.kazanilan_plaka && <div className="flex justify-between"><span className="text-slate-500">Kazanılan Plaka</span><span className="font-bold text-green-700">{proje.kazanilan_plaka}</span></div>}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {proje.teklif_verildi && <span className="badge bg-blue-100 text-blue-700">Teklif ✓</span>}
            {proje.numune_verildi && <span className="badge bg-purple-100 text-purple-700">Numune ✓</span>}
            {proje.teknik_calisma_yapildi && <span className="badge bg-teal-100 text-teal-700">Teknik ✓</span>}
          </div>
        </div>
      </div>

      {proje.notlar && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-2">📝 Notlar</h3>
          <p className="text-sm text-slate-600">{proje.notlar}</p>
        </div>
      )}
    </div>
  )
}
