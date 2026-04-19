'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTarih, hesaplaPerformansPuani, puanYorumu } from '@/lib/utils'
import Link from 'next/link'

export default function HaftalikRaporPage() {
  const [raporlar, setRaporlar] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('weekly_reports')
      .select('*, temsilci:profiles(full_name)')
      .order('hafta_baslangic', { ascending: false })
      .then(({ data }) => { setRaporlar(data || []); setYukleniyor(false) })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Haftalık Raporlar</h1>
          <p className="text-slate-500 text-sm mt-1">{raporlar.length} rapor</p>
        </div>
        <Link href="/dashboard/haftalik-rapor/yeni" className="btn-primary">+ Yeni Rapor</Link>
      </div>
      <div className="space-y-4">
        {raporlar.map(r => {
          const puan = hesaplaPerformansPuani(r)
          const yorum = puanYorumu(puan)
          return (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-900">{formatTarih(r.hafta_baslangic)} haftası</p>
                  <p className="text-sm text-slate-500">{r.temsilci?.full_name}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${yorum.renk}`}>{puan}</div>
                  <div className="text-xs text-slate-500">puan</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-3">
                {[['Ziyaret', r.toplam_ziyaret],['Benzersiz', r.benzersiz_musteri],['Teklif', r.verilen_teklif],['Sipariş', r.onaylanan_siparis]].map(([e, d]) => (
                  <div key={e as string} className="text-center bg-slate-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-slate-900">{d}</div>
                    <div className="text-xs text-slate-500">{e}</div>
                  </div>
                ))}
              </div>
              <p className={`text-sm font-medium ${yorum.renk}`}>{yorum.mesaj}</p>
            </div>
          )
        })}
        {raporlar.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            Henüz rapor yok. <Link href="/dashboard/haftalik-rapor/yeni" className="text-brand-600 hover:underline">İlk raporu girin →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
