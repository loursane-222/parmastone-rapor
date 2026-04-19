'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatTarih, projeStatusRengi } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'

const MARKALAR = ['Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer']
const KULLANIM_ALANLARI = ['Tezgah','Cephe','Zemin','Duvar','Mobilya','Banyo','Mutfak','Dış Mekan','Diğer']
const KALINLIKLAR = ['20MM','12MM','5MM','3MM','2MM']
const DURUMLAR = ['devam_ediyor','teklif_asamasinda','numune_asamasinda','karar_bekleniyor','kazanildi','kaybedildi','beklemede','iptal']

export default function ProjeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [proje, setProje] = useState<any>(null)
  const [kalemler, setKalemler] = useState<any[]>([])
  const [duzenle, setDuzenle] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(null)
  const [formKalemler, setFormKalemler] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { params.then(p => setId(p.id)) }, [])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('projects').select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)').eq('id', id).single(),
      supabase.from('project_items').select('*').eq('project_id', id).order('created_at'),
    ]).then(([p, k]) => {
      setProje(p.data); setForm(p.data)
      setKalemler(k.data || [])
      setFormKalemler(k.data && k.data.length > 0 ? k.data.map((item: any) => ({ ...item, metraj: String(item.metraj), birim_fiyat: String(item.birim_fiyat) })) : [{ kullanim_alani: '', kalinlik: '', metraj: '', birim_fiyat: '' }])
      setYukleniyor(false)
    })
  }, [id])

  function guncelle(alan: string, deger: any) { setForm((f: any) => ({ ...f, [alan]: deger })) }
  function kalemGuncelle(idx: number, alan: string, deger: string) {
    setFormKalemler(k => k.map((item, i) => i === idx ? { ...item, [alan]: deger } : item))
  }
  function kalemEkle() { setFormKalemler(k => [...k, { kullanim_alani: '', kalinlik: '', metraj: '', birim_fiyat: '' }]) }
  function kalemSil(idx: number) { setFormKalemler(k => k.filter((_, i) => i !== idx)) }

  const toplamTutar = formKalemler.reduce((t, k) => t + (Number(k.metraj)||0) * (Number(k.birim_fiyat)||0), 0)
  const toplamMetraj = formKalemler.reduce((t, k) => t + (Number(k.metraj)||0), 0)

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setKaydediyor(true)
    const gecerliKalemler = formKalemler.filter(k => k.kullanim_alani)

    const { error } = await supabase.from('projects').update({
      proje_adi: form.proje_adi, proje_tipi: form.proje_tipi,
      guncel_durum: form.guncel_durum, konut_tipi: form.konut_tipi || null,
      konut_sayisi: form.konut_sayisi ? Number(form.konut_sayisi) : null,
      karar_verici: form.karar_verici || null, mimar: form.mimar || null,
      yuklenici: form.yuklenici || null,
      tahmini_kapanis_tarihi: form.tahmini_kapanis_tarihi || null,
      teklif_verildi: form.teklif_verildi, numune_verildi: form.numune_verildi,
      teknik_calisma_yapildi: form.teknik_calisma_yapildi,
      kaybedilen_marka: form.guncel_durum === 'kaybedildi' ? form.kaybedilen_marka : null,
      kazanilan_ciro: form.kazanilan_ciro ? Number(form.kazanilan_ciro) : null,
      kazanilan_m2: form.kazanilan_m2 ? Number(form.kazanilan_m2) : null,
      kazanilan_plaka: form.kazanilan_plaka ? Number(form.kazanilan_plaka) : null,
      pot_ciro: toplamTutar || Number(form.pot_ciro) || 0,
      pot_m2: toplamMetraj || Number(form.pot_m2) || 0,
      notlar: form.notlar || null,
    }).eq('id', id)

    if (error) { setHata('Hata: ' + error.message); setKaydediyor(false); return }

    // Kalemleri güncelle
    await supabase.from('project_items').delete().eq('project_id', id)
    if (gecerliKalemler.length > 0) {
      await supabase.from('project_items').insert(
        gecerliKalemler.map((k: any) => ({
          project_id: id,
          kullanim_alani: k.kullanim_alani,
          kalinlik: k.kalinlik || null,
          metraj: Number(k.metraj) || 0,
          birim_fiyat: Number(k.birim_fiyat) || 0,
        }))
      )
    }

    const { data: yeniProje } = await supabase.from('projects').select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)').eq('id', id).single()
    const { data: yeniKalemler } = await supabase.from('project_items').select('*').eq('project_id', id)
    setProje(yeniProje); setKalemler(yeniKalemler || [])
    setDuzenle(false); setKaydediyor(false)
  }

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>
  if (!proje) return <div className="text-center py-12 text-slate-400">Proje bulunamadı</div>

  const toplamKalemTutar = kalemler.reduce((t, k) => t + (k.toplam || 0), 0)
  const toplamKalemMetraj = kalemler.reduce((t, k) => t + (k.metraj || 0), 0)

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
            <div className="col-span-2"><label className="form-label">Proje Adı *</label><input className="form-input" value={form.proje_adi||''} onChange={e => guncelle('proje_adi', e.target.value)} required /></div>
            <div>
              <label className="form-label">Proje Tipi</label>
              <select className="form-input" value={form.proje_tipi} onChange={e => guncelle('proje_tipi', e.target.value)}>
                <option value="konut">Konut</option><option value="ticari">Ticari</option>
                <option value="otel">Otel</option><option value="saglik">Sağlık</option>
                <option value="egitim">Eğitim</option><option value="endustri">Endüstri</option><option value="diger">Diğer</option>
              </select>
            </div>
            <div>
              <label className="form-label">Güncel Durum *</label>
              <select className="form-input" value={form.guncel_durum} onChange={e => guncelle('guncel_durum', e.target.value)}>
                {DURUMLAR.map(d => <option key={d} value={d}>{PROJECT_STATUS_LABELS[d as keyof typeof PROJECT_STATUS_LABELS]}</option>)}
              </select>
            </div>
            <div><label className="form-label">Karar Verici</label><input className="form-input" value={form.karar_verici||''} onChange={e => guncelle('karar_verici', e.target.value)} /></div>
            <div><label className="form-label">Mimar</label><input className="form-input" value={form.mimar||''} onChange={e => guncelle('mimar', e.target.value)} /></div>
            <div><label className="form-label">Yüklenici</label><input className="form-input" value={form.yuklenici||''} onChange={e => guncelle('yuklenici', e.target.value)} /></div>
            <div><label className="form-label">Tahmini Kapanış</label><input type="date" className="form-input" value={form.tahmini_kapanis_tarihi||''} onChange={e => guncelle('tahmini_kapanis_tarihi', e.target.value)} /></div>
          </div>

          {form.guncel_durum === 'kaybedildi' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <label className="form-label text-red-700 mb-2 block">Hangi Markaya Kaybedildi?</label>
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
                <div><label className="form-label">Kazanılan Ciro (€)</label><input type="number" className="form-input" value={form.kazanilan_ciro||''} onChange={e => guncelle('kazanilan_ciro', e.target.value)} /></div>
                <div><label className="form-label">Kazanılan m²</label><input type="number" className="form-input" value={form.kazanilan_m2||''} onChange={e => guncelle('kazanilan_m2', e.target.value)} /></div>
                <div><label className="form-label">Kazanılan Plaka</label><input type="number" className="form-input" value={form.kazanilan_plaka||''} onChange={e => guncelle('kazanilan_plaka', e.target.value)} /></div>
              </div>
            </div>
          )}

          <div className="flex gap-6 mt-4">
            {[['teklif_verildi','Teklif Verildi'],['numune_verildi','Numune Verildi'],['teknik_calisma_yapildi','Teknik Çalışma']].map(([alan, etiket]) => (
              <label key={alan} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[alan]||false} onChange={e => guncelle(alan, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">{etiket}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Kullanım Alanları ve Metraj</h2>
            <button type="button" onClick={kalemEkle} className="btn-secondary text-sm">+ Alan Ekle</button>
          </div>
          <div className="space-y-3">
            {formKalemler.map((k, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="col-span-3">
                  {idx === 0 && <label className="form-label">Kullanım Alanı</label>}
                  <select className="form-input" value={k.kullanim_alani||''} onChange={e => kalemGuncelle(idx, 'kullanim_alani', e.target.value)}>
                    <option value="">Seçin...</option>
                    {KULLANIM_ALANLARI.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="form-label">Kalınlık</label>}
                  <select className="form-input" value={k.kalinlik||''} onChange={e => kalemGuncelle(idx, 'kalinlik', e.target.value)}>
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
                  {idx === 0 && <label className="form-label">Tutar</label>}
                  <div className="form-input bg-slate-100 text-slate-700 font-semibold text-sm">
                    €{((Number(k.metraj)||0)*(Number(k.birim_fiyat)||0)).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  {formKalemler.length > 1 && <button type="button" onClick={() => kalemSil(idx)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>}
                </div>
              </div>
            ))}
          </div>
          {toplamTutar > 0 && (
            <div className="mt-4 p-4 bg-brand-50 rounded-xl flex items-center justify-between">
              <span className="text-sm text-brand-700">Toplam Metraj: <strong>{toplamMetraj.toLocaleString('tr-TR')} m²</strong></span>
              <span className="text-xl font-bold text-brand-800">Toplam: €{toplamTutar.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar||''} onChange={e => guncelle('notlar', e.target.value)} />
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
            {proje.guncel_durum === 'kaybedildi' && proje.kaybedilen_marka && (
              <div className="flex justify-between pt-2 border-t border-slate-100"><dt className="text-slate-500">Kaybedilen Marka</dt><dd className="text-red-600 font-semibold">{proje.kaybedilen_marka}</dd></div>
            )}
          </dl>
          <div className="flex gap-2 mt-4 flex-wrap">
            {proje.teklif_verildi && <span className="badge bg-blue-100 text-blue-700">Teklif ✓</span>}
            {proje.numune_verildi && <span className="badge bg-purple-100 text-purple-700">Numune ✓</span>}
            {proje.teknik_calisma_yapildi && <span className="badge bg-teal-100 text-teal-700">Teknik ✓</span>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">💶 Özet</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Toplam Metraj</span><span className="font-semibold">{toplamKalemMetraj.toLocaleString('tr-TR')} m²</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Toplam Tutar</span><span className="font-semibold text-green-700">{formatEuro(toplamKalemTutar)}</span></div>
            {proje.guncel_durum === 'kazanildi' && proje.kazanilan_ciro && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between"><span className="text-slate-500">Kazanılan Ciro</span><span className="font-bold text-green-700">{formatEuro(proje.kazanilan_ciro)}</span></div>
                {proje.kazanilan_m2 && <div className="flex justify-between"><span className="text-slate-500">Kazanılan m²</span><span className="font-bold text-green-700">{proje.kazanilan_m2} m²</span></div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {kalemler.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-slate-700 mb-4">📐 Kullanım Alanları Detayı</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-500">Kullanım Alanı</th>
                <th className="text-center px-3 py-2 font-semibold text-slate-500">Kalınlık</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500">Metraj (m²)</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500">Birim Fiyat (€)</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500">Tutar (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kalemler.map(k => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{k.kullanim_alani}</td>
                  <td className="px-3 py-2.5 text-center">{k.kalinlik ? <span className="badge bg-brand-100 text-brand-800">{k.kalinlik}</span> : '—'}</td>
                  <td className="px-3 py-2.5 text-right">{k.metraj?.toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2.5 text-right">€{k.birim_fiyat?.toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-green-700">€{(k.toplam||0).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="px-3 py-2.5" colSpan={2}>TOPLAM</td>
                <td className="px-3 py-2.5 text-right">{toplamKalemMetraj.toLocaleString('tr-TR')} m²</td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5 text-right text-green-700">€{toplamKalemTutar.toLocaleString('tr-TR')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {proje.notlar && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-2">📝 Notlar</h3>
          <p className="text-sm text-slate-600">{proje.notlar}</p>
        </div>
      )}
    </div>
  )
}
