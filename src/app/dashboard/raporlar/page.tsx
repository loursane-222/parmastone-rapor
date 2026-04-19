'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'

const KALINLIKLAR = ['20MM','12MM','5MM','3MM','2MM']

export default function RaporlarPage() {
  const [projeler, setProjeler] = useState<any[]>([])
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifSekme, setAktifSekme] = useState<'genel'|'marka'|'kalinlik'|'durum'>('genel')
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('customers').select('*'),
    ]).then(([p, m]) => {
      setProjeler(p.data || [])
      setMusteriler(m.data || [])
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

  const toplamMetraj = projeler.reduce((t, p) => t + (p.metraj || 0), 0)
  const toplamCiro = projeler.reduce((t, p) => t + (p.pot_ciro || 0), 0)
  const kazanilanMetraj = kazanilan.reduce((t, p) => t + (p.kazanilan_m2 || p.metraj || 0), 0)
  const kazanilanCiro = kazanilan.reduce((t, p) => t + (p.kazanilan_ciro || p.pot_ciro || 0), 0)

  // Marka bazlı analiz
  const markalar = ['Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer']

  const markaKazanim = markalar.map(marka => {
    const markaProjeleri = kazanilan.filter(p => {
      if (marka === 'Laminam') return !p.kaybedilen_marka
      return false
    })
    const markaKayip = kaybedilen.filter(p => p.kaybedilen_marka === marka)
    const topMetraj = markaKayip.reduce((t, p) => t + (p.metraj || 0), 0)
    const topCiro = markaKayip.reduce((t, p) => t + (p.pot_ciro || 0), 0)
    return { marka, kayipSayi: markaKayip.length, kayipMetraj: topMetraj, kayipCiro: topCiro }
  }).filter(m => m.kayipSayi > 0).sort((a, b) => b.kayipSayi - a.kayipSayi)

  // Laminam kazanım analizi
  const laminamKazanilan = kazanilan
  const laminamTopMetraj = laminamKazanilan.reduce((t, p) => t + (p.kazanilan_m2 || p.metraj || 0), 0)
  const laminamTopCiro = laminamKazanilan.reduce((t, p) => t + (p.kazanilan_ciro || p.pot_ciro || 0), 0)

  // Kalınlık bazlı analiz — tüm projeler
  const kalinlikAnaliz = KALINLIKLAR.map(k => {
    const kProj = projeler.filter(p => p.kalinlik === k)
    const kKaz = kazanilan.filter(p => p.kalinlik === k)
    const kKayb = kaybedilen.filter(p => p.kalinlik === k)
    const topMetraj = kProj.reduce((t, p) => t + (p.metraj || 0), 0)
    const topCiro = kProj.reduce((t, p) => t + (p.pot_ciro || 0), 0)
    return { kalinlik: k, sayi: kProj.length, kazanilan: kKaz.length, kaybedilen: kKayb.length, metraj: topMetraj, ciro: topCiro }
  }).filter(k => k.sayi > 0)

  const tumMetraj = kalinlikAnaliz.reduce((t, k) => t + k.metraj, 0)

  // Durum dağılımı
  const durumDagilim = [
    { durum: 'devam_ediyor', renk: 'bg-blue-500' },
    { durum: 'teklif_asamasinda', renk: 'bg-yellow-500' },
    { durum: 'numune_asamasinda', renk: 'bg-purple-500' },
    { durum: 'karar_bekleniyor', renk: 'bg-orange-500' },
    { durum: 'kazanildi', renk: 'bg-green-500' },
    { durum: 'kaybedildi', renk: 'bg-red-500' },
    { durum: 'beklemede', renk: 'bg-gray-400' },
    { durum: 'iptal', renk: 'bg-gray-300' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Raporlar ve Pazar Analizi</h1>
        <p className="text-slate-500 text-sm mt-1">Tüm projeler, marka dağılımı, kalınlık ve pazar payı</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { b: 'Toplam Proje', d: toplam, r: 'text-slate-900' },
          { b: 'Toplam Metraj', d: `${toplamMetraj.toLocaleString('tr-TR')} m²`, r: 'text-blue-700' },
          { b: 'Toplam Pot. Ciro', d: formatEuro(toplamCiro), r: 'text-green-700' },
          { b: 'Kazanma Oranı', d: `%${kazanmaOrani}`, r: 'text-brand-700' },
        ].map((k, i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { b: 'Kazanılan Proje', d: kazanilan.length, r: 'text-green-700', alt: `${formatEuro(kazanilanCiro)}` },
          { b: 'Kazanılan Metraj', d: `${kazanilanMetraj.toLocaleString('tr-TR')} m²`, r: 'text-green-700', alt: '' },
          { b: 'Kaybedilen Proje', d: kaybedilen.length, r: 'text-red-700', alt: `${kaybedilen.reduce((t,p)=>t+(p.metraj||0),0).toLocaleString('tr-TR')} m²` },
          { b: 'Devam Eden', d: devamEden.length, r: 'text-blue-700', alt: `${devamEden.reduce((t,p)=>t+(p.metraj||0),0).toLocaleString('tr-TR')} m²` },
        ].map((k, i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
            {k.alt && <p className="text-xs text-slate-400 mt-1">{k.alt}</p>}
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {[['genel','📊 Genel Durum'],['marka','🏷️ Marka Analizi'],['kalinlik','📐 Kalınlık Analizi'],['durum','🔄 Durum Dağılımı']].map(([id, etiket]) => (
          <button key={id} onClick={() => setAktifSekme(id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aktifSekme === id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {etiket}
          </button>
        ))}
      </div>

      {/* GENEL DURUM */}
      {aktifSekme === 'genel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Laminam Kazanım Özeti</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Kazanılan Proje Sayısı</span>
                <span className="font-bold text-green-700 text-lg">{laminamKazanilan.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Kazanılan Toplam Metraj</span>
                <span className="font-bold text-green-700">{laminamTopMetraj.toLocaleString('tr-TR')} m²</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Kazanılan Toplam Ciro</span>
                <span className="font-bold text-green-700">{formatEuro(laminamTopCiro)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Kazanma Oranı</span>
                <span className="font-bold text-brand-700 text-xl">%{kazanmaOrani}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Kullanım Alanı Dağılımı</h2>
            {(() => {
              const alanlar = ['Tezgah','Cephe','Zemin','İç Mekan','Banyo','Mutfak','Dış Mekan','Diğer']
              return alanlar.map(alan => {
                const sayi = projeler.filter(p => p.kullanim_alani === alan).length
                if (sayi === 0) return null
                const yuzde = toplam > 0 ? Math.round((sayi/toplam)*100) : 0
                return (
                  <div key={alan} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{alan}</span>
                      <span className="font-medium">{sayi} proje (%{yuzde})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${yuzde}%` }} />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      )}

      {/* MARKA ANALİZİ */}
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
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen Proje</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pazar Payı %</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen Metraj</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen Ciro</th>
                      <th className="px-4 py-3 w-32"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {markaKazanim.map(m => {
                      const pazar = kaybedilen.length > 0 ? Math.round((m.kayipSayi / kaybedilen.length) * 100) : 0
                      return (
                        <tr key={m.marka} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{m.marka}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{m.kayipSayi}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">%{pazar}</td>
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

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Kaybedilen Proje Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proje</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen Marka</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanım</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metraj</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ciro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kaybedilen.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.proje_adi}</td>
                      <td className="px-4 py-3"><span className="badge bg-red-100 text-red-700">{p.kaybedilen_marka || '—'}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.kullanim_alani || '—'}</td>
                      <td className="px-4 py-3"><span className="badge bg-slate-100 text-slate-700">{p.kalinlik || '—'}</span></td>
                      <td className="px-4 py-3 text-right text-sm">{p.metraj ? `${p.metraj.toLocaleString('tr-TR')} m²` : '—'}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatEuro(p.pot_ciro)}</td>
                    </tr>
                  ))}
                  {kaybedilen.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Kaybedilen proje yok</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KALINLIK ANALİZİ */}
      {aktifSekme === 'kalinlik' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-2">Kalınlık Bazlı Pazar Analizi</h2>
          <p className="text-sm text-slate-500 mb-6">Tüm projelerin kalınlığa göre dağılımı, m² ve ciro payları</p>
          {kalinlikAnaliz.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Kalınlık bilgisi girilmiş proje yok</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proje Sayısı</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kazanılan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kaybedilen</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Toplam Metraj</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metraj Payı %</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kalinlikAnaliz.map(k => {
                      const pay = tumMetraj > 0 ? Math.round((k.metraj / tumMetraj) * 100) : 0
                      return (
                        <tr key={k.kalinlik} className="hover:bg-slate-50">
                          <td className="px-4 py-3"><span className="badge bg-brand-100 text-brand-800 font-semibold">{k.kalinlik}</span></td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">{k.sayi}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">{k.kazanilan}</td>
                          <td className="px-4 py-3 text-right text-red-500">{k.kaybedilen}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{k.metraj.toLocaleString('tr-TR')} m²</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pay}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-brand-700 w-8">%{pay}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-700">{formatEuro(k.ciro)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                      <td className="px-4 py-3 text-slate-700">TOPLAM</td>
                      <td className="px-4 py-3 text-right text-slate-900">{kalinlikAnaliz.reduce((t,k)=>t+k.sayi,0)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{kalinlikAnaliz.reduce((t,k)=>t+k.kazanilan,0)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{kalinlikAnaliz.reduce((t,k)=>t+k.kaybedilen,0)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{tumMetraj.toLocaleString('tr-TR')} m²</td>
                      <td className="px-4 py-3 text-right text-brand-700">%100</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatEuro(kalinlikAnaliz.reduce((t,k)=>t+k.ciro,0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {kalinlikAnaliz.map(k => {
                  const pay = tumMetraj > 0 ? Math.round((k.metraj / tumMetraj) * 100) : 0
                  return (
                    <div key={k.kalinlik} className="bg-slate-50 rounded-xl p-4 text-center">
                      <span className="badge bg-brand-100 text-brand-800 font-bold text-base mb-2 inline-block">{k.kalinlik}</span>
                      <p className="text-2xl font-bold text-slate-900">%{pay}</p>
                      <p className="text-xs text-slate-500">{k.metraj.toLocaleString('tr-TR')} m²</p>
                      <p className="text-xs text-slate-400">{k.sayi} proje</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* DURUM DAĞILIMI */}
      {aktifSekme === 'durum' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">Proje Durum Dağılımı</h2>
          <div className="space-y-4">
            {durumDagilim.map(({ durum, renk }) => {
              const projGrup = projeler.filter(p => p.guncel_durum === durum)
              const sayi = projGrup.length
              if (sayi === 0) return null
              const yuzde = toplam > 0 ? Math.round((sayi / toplam) * 100) : 0
              const metraj = projGrup.reduce((t, p) => t + (p.metraj || 0), 0)
              const ciro = projGrup.reduce((t, p) => t + (p.pot_ciro || 0), 0)
              return (
                <div key={durum} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${renk}`} />
                      <span className="font-medium text-slate-800">{PROJECT_STATUS_LABELS[durum as keyof typeof PROJECT_STATUS_LABELS]}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-slate-500">{sayi} proje</span>
                      <span className="text-slate-500">{metraj.toLocaleString('tr-TR')} m²</span>
                      <span className="font-medium text-green-700">{formatEuro(ciro)}</span>
                      <span className="font-bold text-slate-900 w-10 text-right">%{yuzde}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${renk} h-2 rounded-full transition-all`} style={{ width: `${yuzde}%` }} />
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
