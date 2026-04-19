'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTarih } from '@/lib/utils'
import Link from 'next/link'

export default function ZiyaretPlanlamaPage() {
  const [planlar, setPlanlar] = useState<any[]>([])
  const [gecmis, setGecmis] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const bugun = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('visit_plans').select('*, customer:customers(firma_adi, kayit_tipi), temsilci:profiles(full_name)').gte('planlanan_tarih', bugun).order('planlanan_tarih'),
      supabase.from('visits').select('*, customer:customers(firma_adi), temsilci:profiles(full_name)').order('tarih', { ascending: false }).limit(20),
    ]).then(([p, g]) => { setPlanlar(p.data || []); setGecmis(g.data || []); setYukleniyor(false) })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  const ziyaretTipleri: Record<string, string> = { rutin: 'Rutin', teklif: 'Teklif', numune: 'Numune', teknik: 'Teknik', tahsilat: 'Tahsilat', tanitim: 'Tanıtım' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ziyaret Planlama</h1>
          <p className="text-slate-500 text-sm mt-1">Önümüzdeki planlar</p>
        </div>
        <Link href="/ziyaret-planlama/yeni" className="btn-primary">+ Ziyaret Planla</Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">📅 Planlanan Ziyaretler</h2>
          <div className="space-y-3">
            {planlar.map(p => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{p.customer?.firma_adi || '—'}</p>
                    <p className="text-sm text-slate-500">{formatTarih(p.planlanan_tarih)} {p.planlanan_saat && `— ${p.planlanan_saat}`}</p>
                    {p.amac && <p className="text-sm text-slate-600 mt-1">{p.amac}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="badge bg-blue-100 text-blue-700">{ziyaretTipleri[p.ziyaret_tipi] || p.ziyaret_tipi}</span>
                    <span className="text-xs text-slate-400">{p.temsilci?.full_name}</span>
                  </div>
                </div>
              </div>
            ))}
            {planlar.length === 0 && <div className="card p-8 text-center text-slate-400">Planlanan ziyaret yok.<br/><Link href="/ziyaret-planlama/yeni" className="text-brand-600 text-sm">Ziyaret planla →</Link></div>}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">✅ Son Ziyaretler</h2>
          <div className="space-y-3">
            {gecmis.map(z => (
              <div key={z.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{z.customer?.firma_adi || '—'}</p>
                    <p className="text-sm text-slate-500">{formatTarih(z.tarih)}</p>
                    {z.ziyaret_notu && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{z.ziyaret_notu}</p>}
                  </div>
                  <span className={`badge ${z.gerceklesti ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {z.gerceklesti ? 'Gerçekleşti' : 'Gerçekleşmedi'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
