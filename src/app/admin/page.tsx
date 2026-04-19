'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatSayi, formatTarih } from '@/lib/utils'

export default function AdminPage() {
  const [veri, setVeri] = useState<any>({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').neq('role', 'admin'),
      supabase.from('customers').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('weekly_reports').select('*, temsilci:profiles(full_name)').order('hafta_baslangic', { ascending: false }).limit(10),
      supabase.from('visits').select('temsilci_id, tarih'),
    ]).then(([t, m, p, r, z]) => {
      setVeri({ temsilciler: t.data||[], musteriler: m.data||[], projeler: p.data||[], raporlar: r.data||[], ziyaretler: z.data||[] })
      setYukleniyor(false)
    })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  const { temsilciler, musteriler, projeler, raporlar, ziyaretler } = veri
  const toplamPotCiro = musteriler.reduce((t: number, m: any) => t + (m.aylik_toplam_ciro_pot || 0), 0)
  const toplamLaminamCiro = musteriler.reduce((t: number, m: any) => t + (m.laminam_mevcut_ciro || 0), 0)
  const toplamLaminamPot = musteriler.reduce((t: number, m: any) => t + (m.laminam_pot_ciro || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Yönetici Paneli</h1>
        <p className="text-slate-500 text-sm mt-1">Tüm bölge performans özeti</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { b: 'Toplam Müşteri', d: formatSayi(musteriler.length), r: 'text-blue-700' },
          { b: 'Toplam Proje', d: formatSayi(projeler.length), r: 'text-purple-700' },
          { b: 'Bölge Pot. Ciro', d: formatEuro(toplamPotCiro), r: 'text-green-700' },
          { b: 'Laminam Mevcut', d: formatEuro(toplamLaminamCiro), r: 'text-brand-700' },
        ].map((k, i) => (
          <div key={i} className="card p-5">
            <p className="text-xs text-slate-500 mb-1">{k.b}</p>
            <p className={`text-xl font-bold ${k.r}`}>{k.d}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">👥 Temsilci Performansı</h2>
          <div className="space-y-4">
            {temsilciler.map((t: any) => {
              const tmMusteriler = musteriler.filter((m: any) => m.sorumlu_id === t.id)
              const tmProjeler = projeler.filter((p: any) => p.sorumlu_id === t.id)
              const buAy = new Date(); buAy.setDate(1)
              const buAyZiyaret = ziyaretler.filter((z: any) => z.temsilci_id === t.id && new Date(z.tarih) >= buAy).length
              const potCiro = tmMusteriler.reduce((s: number, m: any) => s + (m.aylik_toplam_ciro_pot || 0), 0)
              return (
                <div key={t.id} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{t.full_name}</p>
                      <p className="text-xs text-slate-500">{t.role === 'imalatci_temsilci' ? 'İmalatçı Temsilcisi' : 'Proje Temsilcisi'}</p>
                    </div>
                    <span className="badge bg-brand-100 text-brand-800">{buAyZiyaret} ziyaret</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2"><div className="text-lg font-bold">{tmMusteriler.length}</div><div className="text-xs text-slate-500">Müşteri</div></div>
                    <div className="bg-white rounded-lg p-2"><div className="text-lg font-bold">{tmProjeler.length}</div><div className="text-xs text-slate-500">Proje</div></div>
                    <div className="bg-white rounded-lg p-2"><div className="text-sm font-bold text-green-700">{formatEuro(potCiro)}</div><div className="text-xs text-slate-500">Pot. Ciro</div></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">🎯 Laminam Hedef Takibi</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Mevcut / Potansiyel</span>
              <span className="font-semibold">{toplamLaminamPot > 0 ? Math.round((toplamLaminamCiro / toplamLaminamPot) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-brand-600 h-3 rounded-full" style={{ width: `${Math.min(100, toplamLaminamPot > 0 ? (toplamLaminamCiro / toplamLaminamPot) * 100 : 0)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Mevcut: {formatEuro(toplamLaminamCiro)}</span>
              <span>Pot: {formatEuro(toplamLaminamPot)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { b: 'Kazanılan', d: projeler.filter((p:any)=>p.guncel_durum==='kazanildi').length, r: 'text-green-700' },
              { b: 'Kaybedilen', d: projeler.filter((p:any)=>p.guncel_durum==='kaybedildi').length, r: 'text-red-700' },
              { b: 'Aktif Proje', d: projeler.filter((p:any)=>!['kazanildi','kaybedildi','iptal'].includes(p.guncel_durum)).length, r: 'text-blue-700' },
              { b: 'Laminam Kullanan', d: musteriler.filter((m:any)=>m.laminam_kullaniyor).length, r: 'text-teal-700' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${k.r}`}>{k.d}</div>
                <div className="text-xs text-slate-500">{k.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 mb-4">📋 Son Haftalık Raporlar</h2>
        <div className="space-y-3">
          {raporlar.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium text-slate-900">{r.temsilci?.full_name}</p>
                <p className="text-sm text-slate-500">{formatTarih(r.hafta_baslangic)} haftası</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center"><div className="font-bold">{r.toplam_ziyaret}</div><div className="text-xs text-slate-500">Ziyaret</div></div>
                <div className="text-center"><div className="font-bold">{r.verilen_teklif}</div><div className="text-xs text-slate-500">Teklif</div></div>
                <div className="text-center"><div className="font-bold text-green-700">{formatEuro(r.satis_tutari_eur)}</div><div className="text-xs text-slate-500">Satış</div></div>
              </div>
            </div>
          ))}
          {raporlar.length === 0 && <p className="text-center text-slate-400 py-4">Henüz rapor yok</p>}
        </div>
      </div>
    </div>
  )
}
