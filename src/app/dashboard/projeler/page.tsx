'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, projeStatusRengi } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'
import Link from 'next/link'

export default function ProjelerPage() {
  const [projeler, setProjeler] = useState<any[]>([])
  const [filtre, setFiltre] = useState({ durum: '', arama: '', kalinlik: '' })
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('projects')
      .select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setProjeler(data || []); setYukleniyor(false) })
  }, [])

  const filtrelenmis = projeler.filter(p => {
    if (filtre.durum && p.guncel_durum !== filtre.durum) return false
    if (filtre.kalinlik && p.kalinlik !== filtre.kalinlik) return false
    if (filtre.arama && !p.proje_adi.toLowerCase().includes(filtre.arama.toLowerCase())) return false
    return true
  })

  const toplamMetraj = filtrelenmis.reduce((t, p) => t + (p.metraj || 0), 0)
  const toplamCiro = filtrelenmis.reduce((t, p) => t + (p.pot_ciro || 0), 0)

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  const durumlar = ['devam_ediyor','teklif_asamasinda','numune_asamasinda','karar_bekleniyor','kazanildi','kaybedildi','beklemede','iptal']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
          <p className="text-slate-500 text-sm mt-1">{filtrelenmis.length} / {projeler.length} proje</p>
        </div>
        <Link href="/dashboard/projeler/yeni" className="btn-primary">+ Yeni Proje</Link>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input className="form-input max-w-xs" placeholder="Proje ara..." value={filtre.arama} onChange={e => setFiltre(f => ({ ...f, arama: e.target.value }))} />
        <select className="form-input max-w-48" value={filtre.durum} onChange={e => setFiltre(f => ({ ...f, durum: e.target.value }))}>
          <option value="">Tüm Durumlar</option>
          {durumlar.map(d => <option key={d} value={d}>{PROJECT_STATUS_LABELS[d as keyof typeof PROJECT_STATUS_LABELS]}</option>)}
        </select>
        <select className="form-input max-w-36" value={filtre.kalinlik} onChange={e => setFiltre(f => ({ ...f, kalinlik: e.target.value }))}>
          <option value="">Tüm Kalınlıklar</option>
          {['20MM','12MM','5MM','3MM','2MM'].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Toplam Metraj</p>
          <p className="text-xl font-bold text-slate-900">{toplamMetraj.toLocaleString('tr-TR')} m²</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Toplam Pot. Ciro</p>
          <p className="text-xl font-bold text-green-700">{formatEuro(toplamCiro)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">Kazanma Oranı</p>
          <p className="text-xl font-bold text-brand-700">
            {(() => {
              const sonuclanan = filtrelenmis.filter(p => ['kazanildi','kaybedildi'].includes(p.guncel_durum)).length
              const kazanilan = filtrelenmis.filter(p => p.guncel_durum === 'kazanildi').length
              return sonuclanan > 0 ? `%${Math.round((kazanilan/sonuclanan)*100)}` : '—'
            })()}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proje Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Müşteri</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kullanım</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Kalınlık</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metraj</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Teklif</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrelenmis.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.proje_adi}</p>
                    {p.konut_tipi && <p className="text-xs text-slate-500">{p.konut_tipi}{p.konut_sayisi ? ` · ${p.konut_sayisi} ünite` : ''}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.customer?.firma_adi || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${projeStatusRengi(p.guncel_durum)}`}>
                      {PROJECT_STATUS_LABELS[p.guncel_durum as keyof typeof PROJECT_STATUS_LABELS]}
                    </span>
                    {p.guncel_durum === 'kaybedildi' && p.kaybedilen_marka && (
                      <p className="text-xs text-red-500 mt-0.5">{p.kaybedilen_marka}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.kullanim_alani || '—'}</td>
                  <td className="px-4 py-3">
                    {p.kalinlik ? <span className="badge bg-slate-100 text-slate-700">{p.kalinlik}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                    {p.metraj ? `${p.metraj.toLocaleString('tr-TR')} m²` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatEuro(p.pot_ciro)}</td>
                  <td className="px-4 py-3 text-center">{p.teklif_verildi ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/projeler/${p.id}`} className="text-brand-600 hover:text-brand-800 text-sm font-medium">Detay →</Link>
                  </td>
                </tr>
              ))}
              {filtrelenmis.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  {projeler.length === 0
                    ? <><Link href="/dashboard/projeler/yeni" className="text-brand-600 hover:underline">İlk projeyi ekleyin →</Link></>
                    : 'Filtreyle eşleşen proje yok.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
