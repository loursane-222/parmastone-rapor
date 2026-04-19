'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'

const KALINLIKLAR = ['20MM','12MM','5MM','3MM','2MM']
const KULLANIM_ALANLARI = ['Tezgah','Cephe','Zemin','Duvar','Mobilya','Banyo','Mutfak','Dış Mekan','Diğer']

export default function RaporlarPage() {
  const [projeler, setProjeler] = useState<any[]>([])
  const [kalemler, setKalemler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifSekme, setAktifSekme] = useState<'genel'|'kullanim'|'fiyat'|'marka'|'kalinlik'|'durum'>('genel')
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('project_items').select('*, project:projects(proje_adi, guncel_durum, kaybedilen_marka)'),
    ]).then(([p, k]) => {
      setProjeler(p.data || [])
      setKalemler(k.data || [])
      setYukleniyor(false)
    })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  const toplam = projeler.length
  const kazanilan = projeler.filter(p => p.guncel_durum === 'kazanildi')
  const kaybedilen = projeler.filter(p => p.guncel_durum === 'kaybedildi')
  const devamEden = projeler.filter(p => !['kazanildi','kaybedildi','iptal'].includes(p.guncel_durum))
  const sonuclanan = kazanilan.length + kaybedilen.length
  const kazanmaOrani = sonuclanan > 0 ? Math.round((kazanilan.length / sonuclanan) * 100) : 0
  const toplamMetraj = kalemler.reduce((t, k) => t + (k.metraj || 0), 0)
  const toplamCiro = kalemler.reduce((t, k) => t + (k.toplam || 0), 0)
  const kazanilanMetraj = kazanilan.reduce((t, p) => t + (p.kazanilan_m2 || 0), 0)
  const kazanilanCiro = kazanilan.reduce((t, p) => t + (p.kazanilan_ciro || 0), 0)

  // Kullanım alanı analizi
  const kullanımAnaliz = KULLANIM_ALANLARI.map(alan => {
    const alanKalemleri = kalemler.filter(k => k.kullanim_alani === alan)
    const topMetraj = alanKalemleri.reduce((t, k) => t + (k.metraj || 0), 0)
    const topCiro = alanKalemleri.reduce((t, k) => t + (k.toplam || 0), 0)
    const kalinlikDagilim = KALINLIKLAR.map(kal => ({
      kalinlik: kal,
      metraj: alanKalemleri.filter(k => k.kalinlik === kal).reduce((t, k) => t + (k.metraj || 0), 0),
      sayi: alanKalemleri.filter(k => k.kalinlik === kal).length,
    })).filter(k => k.sayi > 0)
    return { alan, sayi: alanKalemleri.length, metraj: topMetraj, ciro: topCiro, kalinlikDagilim }
  }).filter(a => a.sayi > 0).sort((a, b) => b.metraj - a.metraj)

  // Fiyat ortalaması analizi
  const fiyatAnaliz = KALINLIKLAR.map(kal => {
    const tumKalemler = kalemler.filter(k => k.kalinlik === kal && k.birim_fiyat > 0)
    const kazanilanKalemler = kalemler.filter(k => k.kalinlik === kal && k.birim_fiyat > 0 && k.project?.guncel_durum === 'kazanildi')
    const kaybedilenKalemler = kalemler.filter(k => k.kalinlik === kal && k.birim_fiyat > 0 && k.project?.guncel_durum === 'kaybedildi')
    const devamKalemler = kalemler.filter(k => k.kalinlik === kal && k.birim_fiyat > 0 && !['kazanildi','kaybedildi','iptal'].includes(k.project?.guncel_durum || ''))

    const ort = (liste: any[]) => liste.length > 0 ? liste.reduce((t, k) => t + k.birim_fiyat, 0) / liste.length : null
    const min = (liste: any[]) => liste.length > 0 ? Math.min(...liste.map(k => k.birim_fiyat)) : null
    const max = (liste: any[]) => liste.length > 0 ? Math.max(...liste.map(k => k.birim_fiyat)) : null

    // Rakip marka bazında kaybedilen fiyatlar
    const markaFiyat = ['Dekton','Neolith','Atlas','Materia','Infinity','Level','Kale','Doğaltaş','Diğer'].map(marka => {
      const markaKalemler = kalemler.filter(k => k.kalinlik === kal && k.birim_fiyat > 0 && k.project?.guncel_durum === 'kaybedildi' && k.project?.kaybedilen_marka === marka)
      return { marka, ort: ort(markaKalemler), sayi: markaKalemler.length }
    }).filter(m => m.sayi > 0)

    return {
      kalinlik: kal,
      genelOrt: ort(tumKalemler),
      genelMin: min(tumKalemler),
      genelMax: max(tumKalemler),
      kazanilanOrt: ort(kazanilanKalemler),
      kaybedilenOrt: ort(kaybedilenKalemler),
      devamOrt: ort(devamKalemler),
      tumSayi: tumKalemler.length,
      kazanilanSayi: kazanilanKalemler.length,
      kaybedilenSayi: kaybedilenKalemler.length,
      markaFiyat,
    }
  }).filter(k => k.tumSayi > 0)

  // Kullanım alanı + kalınlık fiyat matrisi
  const fiyatMatrisi = KULLANIM_ALANLARI.map(alan => {
    const satir: Record<string, number|null> = { alan: 0 }
    KALINLIKLAR.forEach(kal => {
      const liste = kalemler.filter(k => k.kullanim_alani === alan && k.kalinlik === kal && k.birim_fiyat > 0)
      satir[kal] = liste.length > 0 ? liste.reduce((t, k) => t + k.birim_fiyat, 0) / liste.length : null
    })
    return { alan, ...satir }
  }).filter(s => KALINLIKLAR.some(k => s[k] !== null))

  // Marka analizi
  const markaKazanim = ['Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer'].map(marka => {
    const markaKayip = kaybedilen.filter(p => p.kaybedilen_marka === marka)
    return { marka, kayipSayi: markaKayip.length, kayipMetraj: markaKayip.reduce((t,p)=>t+(p.metraj||0),0), kayipCiro: markaKayip.reduce((t,p)=>t+(p.pot_ciro||0),0) }
  }).filter(m => m.kayipSayi > 0).sort((a,b) => b.kayipSayi - a.kayipSayi)

  // Kalınlık analizi
  const kalinlikAnaliz = KALINLIKLAR.map(k => {
    const kKalemler = kalemler.filter(item => item.kalinlik === k)
    return { kalinlik: k, sayi: kKalemler.length, metraj: kKalemler.reduce((t,i)=>t+(i.metraj||0),0), ciro: kKalemler.reduce((t,i)=>t+(i.toplam||0),0) }
  }).filter(k => k.sayi > 0)
  const tumKalinlikMetraj = kalinlikAnaliz.reduce((t,k)=>t+k.metraj,0)

  const durumDagilim = [
    { durum: 'devam_ediyor', renk: 'bg-blue-500' }, { durum: 'teklif_asamasinda', renk: 'bg-yellow-500' },
    { durum: 'numune_asamasinda', renk: 'bg-purple-500' }, { durum: 'karar_bekleniyor', renk: 'bg-orange-500' },
    { durum: 'kazanildi', renk: 'bg-green-500' }, { durum: 'kaybedildi', renk: 'bg-red-500' },
    { durum: 'beklemede', renk: 'bg-gray-400' }, { durum: 'iptal', renk: 'bg-gray-300' },
  ]

  const fmtFiyat = (n: number|null) => n ? `€${n.toFixed(0)}/m²` : '—'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Raporlar ve Pazar Analizi</h1>
        <p className="text-slate-500 text-sm mt-1">Tüm projeler, kullanım alanı, fiyat, marka ve kalınlık dağılımı</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { b: 'Toplam Proje', d: toplam, r: 'text-slate-900' },
          { b: 'Toplam Metraj', d: `${toplamMetraj.toLocaleString('tr-TR')} m²`, r: 'text-blue-700' },
          { b: 'Toplam Pot. Ciro', d: formatEuro(toplamCiro), r: 'text-green-700' },
          { b: 'Kazanma Oranı', d: `%${kazanmaOrani}`, r: 'text-brand-700' },
        ].map((k,i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { b: 'Kazanılan Proje', d: kazanilan.length, r: 'text-green-700', alt: formatEuro(kazanilanCiro) },
          { b: 'Kazanılan Metraj', d: `${kazanilanMetraj.toLocaleString('tr-TR')} m²`, r: 'text-green-700', alt: '' },
          { b: 'Kaybedilen Proje', d: kaybedilen.length, r: 'text-red-700', alt: '' },
          { b: 'Devam Eden', d: devamEden.length, r: 'text-blue-700', alt: '' },
        ].map((k,i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
            {k.alt && <p className="text-xs text-slate-400 mt-1">{k.alt}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[['genel','📊 Genel'],['kullanim','🏠 Kullanım Alanları'],['fiyat','💶 Fiyat Ortalamaları'],['marka','🏷️ Marka Analizi'],['kalinlik','📐 Kalınlık'],['durum','🔄 Durum']].map(([id, etiket]) => (
          <button key={id} onClick={() => setAktifSekme(id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aktifSekme === id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {etiket}
          </button>
        ))}
      </div>

      {/* GENEL */}
      {aktifSekme === 'genel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Laminam Kazanım Özeti</h2>
            <div className="space-y-3">
              {[
                { l: 'Kazanılan Proje', v: kazanilan.length, r: 'text-green-700 text-lg font-bold' },
                { l: 'Kazanılan Metraj', v: `${kazanilanMetraj.toLocaleString('tr-TR')} m²`, r: 'text-green-700 font-bold' },
                { l: 'Kazanılan Ciro', v: formatEuro(kazanilanCiro), r: 'text-green-700 font-bold' },
                { l: 'Kazanma Oranı', v: `%${kazanmaOrani}`, r: 'text-brand-700 text-xl font-bold' },
              ].map((item,i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500">{item.l}</span>
                  <span className={item.r}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Kullanım Alanı Özeti</h2>
            {kullanımAnaliz.slice(0,6).map(a => {
              const yuzde = toplamMetraj > 0 ? Math.round((a.metraj/toplamMetraj)*100) : 0
              return (
                <div key={a.alan} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{a.alan}</span>
                    <span className="text-slate-500">{a.metraj.toLocaleString('tr-TR')} m² (%{yuzde})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${yuzde}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KULLANIM ALANLARI */}
      {aktifSekme === 'kullanim' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Kullanım Alanı Bazlı Analiz</h2>
            <p className="text-sm text-slate-500 mb-4">Tüm proje kalemlerinin kullanım alanına göre metraj, ciro ve kalınlık dağılımı</p>
            {kullanımAnaliz.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Henüz kullanım alanı verisi yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanım Alanı</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalem</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Toplam Metraj</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pay %</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Toplam Ciro</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlıklar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kullanımAnaliz.map(a => {
                      const yuzde = toplamMetraj > 0 ? Math.round((a.metraj/toplamMetraj)*100) : 0
                      return (
                        <tr key={a.alan} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">{a.alan}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{a.sayi}</td>
                          <td className="px-4 py-3 text-right font-medium">{a.metraj.toLocaleString('tr-TR')} m²</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${yuzde}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-brand-700 w-8">%{yuzde}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-700">{formatEuro(a.ciro)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {a.kalinlikDagilim.map(k => (
                                <span key={k.kalinlik} className="badge bg-brand-100 text-brand-800 text-xs">{k.kalinlik}: {k.metraj.toLocaleString('tr-TR')}m²</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                      <td className="px-4 py-3">TOPLAM</td>
                      <td className="px-4 py-3 text-right">{kullanımAnaliz.reduce((t,a)=>t+a.sayi,0)}</td>
                      <td className="px-4 py-3 text-right">{toplamMetraj.toLocaleString('tr-TR')} m²</td>
                      <td className="px-4 py-3 text-right text-brand-700">%100</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatEuro(toplamCiro)}</td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FİYAT ORTALAMALARI */}
      {aktifSekme === 'fiyat' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Kalınlık Bazlı Fiyat Ortalamaları</h2>
            <p className="text-sm text-slate-500 mb-4">Kazanılan, kaybedilen ve devam eden projelerdeki ortalama birim fiyatlar (€/m²)</p>
            {fiyatAnaliz.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Henüz fiyat verisi yok — proje eklerken birim fiyat girin</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Genel Ort.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Min</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Max</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-green-700 uppercase">Kazanılan Ort.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-red-600 uppercase">Kaybedilen Ort.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase">Devam Ort.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fiyatAnaliz.map(k => (
                      <tr key={k.kalinlik} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><span className="badge bg-brand-100 text-brand-800 font-semibold">{k.kalinlik}</span></td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{fmtFiyat(k.genelOrt)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmtFiyat(k.genelMin)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmtFiyat(k.genelMax)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{fmtFiyat(k.kazanilanOrt)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">{fmtFiyat(k.kaybedilenOrt)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{fmtFiyat(k.devamOrt)}</td>
                        <td className="px-4 py-3 text-right text-slate-400 text-xs">{k.tumSayi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rakip marka bazında kaybedilen fiyatlar */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Rakip Bazında Kaybedilen Fiyat Ortalamaları</h2>
            <p className="text-sm text-slate-500 mb-4">Hangi rakibe, hangi kalınlıkta, hangi ortalama fiyatla kaybedildi?</p>
            {fiyatAnaliz.every(k => k.markaFiyat.length === 0) ? (
              <p className="text-center py-8 text-slate-400">Kaybedilen proje verisi yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rakip Marka</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen Ort. Fiyat</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalem Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fiyatAnaliz.flatMap(k =>
                      k.markaFiyat.map(m => (
                        <tr key={`${k.kalinlik}-${m.marka}`} className="hover:bg-slate-50">
                          <td className="px-4 py-3"><span className="badge bg-brand-100 text-brand-800 font-semibold">{k.kalinlik}</span></td>
                          <td className="px-4 py-3 font-medium text-slate-900">{m.marka}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{fmtFiyat(m.ort)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{m.sayi}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kullanım alanı x kalınlık fiyat matrisi */}
          {fiyatMatrisi.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-2">Kullanım Alanı × Kalınlık Fiyat Matrisi</h2>
              <p className="text-sm text-slate-500 mb-4">Ortalama birim fiyat (€/m²) — tüm projeler dahil</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanım Alanı</th>
                      {KALINLIKLAR.map(k => (
                        <th key={k} className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fiyatMatrisi.map(s => (
                      <tr key={s.alan} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{s.alan}</td>
                        {KALINLIKLAR.map(k => (
                          <td key={k} className={`px-4 py-3 text-right text-sm ${s[k] ? 'font-semibold text-slate-900' : 'text-slate-300'}`}>
                            {s[k] ? `€${(s[k] as number).toFixed(0)}` : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MARKA */}
      {aktifSekme === 'marka' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Marka Bazlı Kayıp Analizi</h2>
            <p className="text-sm text-slate-500 mb-4">Kaybedilen projelerde rakip markaların dağılımı</p>
            {markaKazanim.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Henüz kaybedilen proje yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Marka</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pazar Payı</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metraj</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ciro</th>
                      <th className="px-4 py-3 w-32"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {markaKazanim.map(m => {
                      const pazar = kaybedilen.length > 0 ? Math.round((m.kayipSayi/kaybedilen.length)*100) : 0
                      return (
                        <tr key={m.marka} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium">{m.marka}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{m.kayipSayi}</td>
                          <td className="px-4 py-3 text-right font-semibold">%{pazar}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{m.kayipMetraj.toLocaleString('tr-TR')} m²</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatEuro(m.kayipCiro)}</td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pazar}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KALINLIK */}
      {aktifSekme === 'kalinlik' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Kalınlık Bazlı Pazar Analizi</h2>
          {kalinlikAnaliz.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Kalınlık bilgisi girilmiş kalem yok</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalem</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Toplam Metraj</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metraj Payı</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kalinlikAnaliz.map(k => {
                      const pay = tumKalinlikMetraj > 0 ? Math.round((k.metraj/tumKalinlikMetraj)*100) : 0
                      return (
                        <tr key={k.kalinlik} className="hover:bg-slate-50">
                          <td className="px-4 py-3"><span className="badge bg-brand-100 text-brand-800 font-semibold">{k.kalinlik}</span></td>
                          <td className="px-4 py-3 text-right font-medium">{k.sayi}</td>
                          <td className="px-4 py-3 text-right">{k.metraj.toLocaleString('tr-TR')} m²</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pay}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-brand-700 w-8">%{pay}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-green-700 font-medium">{formatEuro(k.ciro)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                      <td className="px-4 py-3">TOPLAM</td>
                      <td className="px-4 py-3 text-right">{kalinlikAnaliz.reduce((t,k)=>t+k.sayi,0)}</td>
                      <td className="px-4 py-3 text-right">{tumKalinlikMetraj.toLocaleString('tr-TR')} m²</td>
                      <td className="px-4 py-3 text-right text-brand-700">%100</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatEuro(kalinlikAnaliz.reduce((t,k)=>t+k.ciro,0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {kalinlikAnaliz.map(k => {
                  const pay = tumKalinlikMetraj > 0 ? Math.round((k.metraj/tumKalinlikMetraj)*100) : 0
                  return (
                    <div key={k.kalinlik} className="bg-slate-50 rounded-xl p-4 text-center">
                      <span className="badge bg-brand-100 text-brand-800 font-bold text-base mb-2 inline-block">{k.kalinlik}</span>
                      <p className="text-2xl font-bold text-slate-900">%{pay}</p>
                      <p className="text-xs text-slate-500">{k.metraj.toLocaleString('tr-TR')} m²</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* DURUM */}
      {aktifSekme === 'durum' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Proje Durum Dağılımı</h2>
          <div className="space-y-4">
            {durumDagilim.map(({ durum, renk }) => {
              const projGrup = projeler.filter(p => p.guncel_durum === durum)
              const sayi = projGrup.length
              if (sayi === 0) return null
              const yuzde = toplam > 0 ? Math.round((sayi/toplam)*100) : 0
              const ciro = projGrup.reduce((t,p)=>t+(p.pot_ciro||0),0)
              return (
                <div key={durum} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${renk}`} />
                      <span className="font-medium text-slate-800">{PROJECT_STATUS_LABELS[durum as keyof typeof PROJECT_STATUS_LABELS]}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-slate-500">{sayi} proje</span>
                      <span className="font-medium text-green-700">{formatEuro(ciro)}</span>
                      <span className="font-bold text-slate-900 w-10 text-right">%{yuzde}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${renk} h-2 rounded-full`} style={{ width: `${yuzde}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
