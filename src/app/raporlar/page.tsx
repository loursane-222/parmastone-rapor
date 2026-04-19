'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatSayi } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'

export default function RaporlarPage() {
  const [projeler, setProjeler] = useState<any[]>([])
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
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
  const kazanilan = projeler.filter(p => p.guncel_durum === 'kazanildi').length
  const kaybedilen = projeler.filter(p => p.guncel_durum === 'kaybedildi').length
  const sonuclanan = kazanilan + kaybedilen
  const kazanmaOrani = sonuclanan > 0 ? Math.round((kazanilan / sonuclanan) * 100) : 0
  const toplamPotCiro = musteriler.reduce((t, m) => t + (m.aylik_toplam_ciro_pot || 0), 0)
  const toplamLaminamCiro = musteriler.reduce((t, m) => t + (m.laminam_mevcut_ciro || 0), 0)

  const markaBazliKayip: Record<string, number> = {}
  projeler.filter(p => p.guncel_durum === 'kaybedildi' && p.kaybedilen_marka)
    .forEach(p => { markaBazliKayip[p.kaybedilen_marka] = (markaBazliKayip[p.kaybedilen_marka] || 0) + 1 })
  const markaSirali = Object.entries(markaBazliKayip).sort((a, b) => b[1] - a[1])

  const durumlar = [
    { durum: 'devam_ediyor', renk: 'bg-blue-500' },
    { durum: 'teklif_asamasinda', renk: 'bg-yellow-500' },
    { durum: 'numune_asamasinda', renk: 'bg-purple-500' },
    { durum: 'karar_bekleniyor', renk: 'bg-orange-500' },
    { durum: 'kazanildi', renk: 'bg-green-500' },
    { durum: 'kaybedildi', renk: 'bg-red-500' },
    { durum: 'beklemede', renk: 'bg-gray-400' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
        <p className="text-slate-500 text-sm mt-1">Bölgesel performans özeti</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { b: 'Toplam Müşteri', d: formatSayi(musteriler.length), r: 'text-blue-700' },
          { b: 'Toplam Proje', d: formatSayi(toplam), r: 'text-purple-700' },
          { b: 'Toplam Pot. Ciro', d: formatEuro(toplamPotCiro), r: 'text-green-700' },
          { b: 'Laminam Mevcut', d: formatEuro(toplamLaminamCiro), r: 'text-brand-700' },
        ].map((k, i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">📊 Proje Durum Özeti</h2>
          <div className="space-y-3">
            {durumlar.map(({ durum, renk }) => {
              const sayi = projeler.filter(p => p.guncel_durum === durum).length
              const yuzde = toplam > 0 ? Math.round((sayi / toplam) * 100) : 0
              return (
                <div key={durum}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{PROJECT_STATUS_LABELS[durum as keyof typeof PROJECT_STATUS_LABELS]}</span>
                    <span className="font-medium">{sayi} (%{yuzde})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${renk} h-2 rounded-full`} style={{ width: `${yuzde}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Kazanma Oranı</span>
                <span className="font-bold text-green-700">%{kazanmaOrani}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">🏷️ Marka Bazlı Kayıp Analizi</h2>
          {markaSirali.length > 0 ? (
            <div className="space-y-3">
              {markaSirali.map(([marka, sayi]) => {
                const yuzde = kaybedilen > 0 ? Math.round((sayi / kaybedilen) * 100) : 0
                return (
                  <div key={marka}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{marka}</span>
                      <span className="font-medium">{sayi} proje (%{yuzde})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: `${yuzde}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-slate-400">Henüz kayıp analizi verisi yok</p>
          )}
        </div>
      </div>
    </div>
  )
}
