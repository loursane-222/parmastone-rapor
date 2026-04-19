'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro } from '@/lib/utils'
import Link from 'next/link'

export default function MusterilerPage() {
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('customers')
      .select('*, sorumlu:profiles(full_name)')
      .order('oncelik_skoru', { ascending: false })
      .then(({ data }) => {
        setMusteriler(data || [])
        setYukleniyor(false)
      })
  }, [])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
          <p className="text-slate-500 text-sm mt-1">{musteriler.length} kayıt</p>
        </div>
        <Link href="/musteriler/yeni" className="btn-primary">+ Yeni Müşteri</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Firma Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Şehir</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sorumlu</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Laminam Payı</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {musteriler.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{m.firma_adi}</p>
                    {m.yetkili_kisi && <p className="text-xs text-slate-500">{m.yetkili_kisi}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${m.kayit_tipi === 'imalatci' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {m.kayit_tipi === 'imalatci' ? 'İmalatçı' : 'Proje'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.sehir}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.sorumlu?.full_name}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatEuro(m.aylik_toplam_ciro_pot)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${(m.laminam_payi_yuzde||0) >= 40 ? 'text-green-600' : (m.laminam_payi_yuzde||0) >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                      %{(m.laminam_payi_yuzde||0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/musteriler/${m.id}`} className="text-brand-600 hover:text-brand-800 text-sm font-medium">Detay →</Link>
                  </td>
                </tr>
              ))}
              {musteriler.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Henüz müşteri yok. <Link href="/musteriler/yeni" className="text-brand-600 hover:underline">İlk müşteriyi ekleyin →</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
