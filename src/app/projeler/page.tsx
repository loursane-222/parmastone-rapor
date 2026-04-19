'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, projeStatusRengi } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/types'
import Link from 'next/link'

export default function ProjelerPage() {
  const [projeler, setProjeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('projects')
      .select('*, sorumlu:profiles(full_name), customer:customers(firma_adi)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setProjeler(data || []); setYukleniyor(false) })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
          <p className="text-slate-500 text-sm mt-1">{projeler.length} proje</p>
        </div>
        <Link href="/projeler/yeni" className="btn-primary">+ Yeni Proje</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proje Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Müşteri</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sorumlu</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Teklif</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Numune</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projeler.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.proje_adi}</p>
                    {p.karar_verici && <p className="text-xs text-slate-500">{p.karar_verici}</p>}
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
                  <td className="px-4 py-3 text-sm text-slate-600">{p.sorumlu?.full_name}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatEuro(p.pot_ciro)}</td>
                  <td className="px-4 py-3 text-center">{p.teklif_verildi ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-center">{p.numune_verildi ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/projeler/${p.id}`} className="text-brand-600 hover:text-brand-800 text-sm font-medium">Detay →</Link>
                  </td>
                </tr>
              ))}
              {projeler.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Henüz proje yok. <Link href="/projeler/yeni" className="text-brand-600 hover:underline">İlk projeyi ekleyin →</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
