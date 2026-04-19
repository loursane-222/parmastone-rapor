'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro } from '@/lib/utils'
import Link from 'next/link'

const segmentRengi: Record<string, string> = {
  'A+': 'bg-green-100 text-green-800',
  'A': 'bg-blue-100 text-blue-800',
  'B': 'bg-yellow-100 text-yellow-800',
  'C': 'bg-gray-100 text-gray-700',
}

export default function MusterilerPage() {
  const [musteriler, setMusteriler] = useState<any[]>([])
  const [filtre, setFiltre] = useState({ segment: '', arama: '' })
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('customers')
      .select('*, sorumlu:profiles(full_name)')
      .order('oncelik_skoru', { ascending: false })
      .then(({ data }) => { setMusteriler(data || []); setYukleniyor(false) })
  }, [])

  const filtrelenmis = musteriler.filter(m => {
    if (filtre.segment && m.segment !== filtre.segment) return false
    if (filtre.arama && !m.firma_adi.toLowerCase().includes(filtre.arama.toLowerCase())) return false
    return true
  })

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İmalatçı Portföyü</h1>
          <p className="text-slate-500 text-sm mt-1">{filtrelenmis.length} / {musteriler.length} kayıt</p>
        </div>
        <Link href="/dashboard/musteriler/yeni" className="btn-primary">+ Yeni İmalatçı</Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          className="form-input max-w-xs"
          placeholder="Firma ara..."
          value={filtre.arama}
          onChange={e => setFiltre(f => ({ ...f, arama: e.target.value }))}
        />
        <select className="form-input max-w-40" value={filtre.segment} onChange={e => setFiltre(f => ({ ...f, segment: e.target.value }))}>
          <option value="">Tüm Segmentler</option>
          <option value="A+">A+ Segment</option>
          <option value="A">A Segment</option>
          <option value="B">B Segment</option>
          <option value="C">C Segment</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Firma Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Şehir</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">En Çok Marka</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Segment</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Öncelik</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pot. Ciro</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Laminam Payı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sorumlu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrelenmis.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{m.firma_adi}</p>
                    {m.yetkili_kisi && <p className="text-xs text-slate-500">{m.yetkili_kisi}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.sehir}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.en_cok_marka || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {m.segment ? (
                      <span className={`badge font-semibold ${segmentRengi[m.segment] || 'bg-gray-100 text-gray-700'}`}>{m.segment}</span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">{m.oncelik || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatEuro(m.aylik_toplam_ciro_pot)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${(m.laminam_payi_yuzde||0) >= 40 ? 'text-green-600' : (m.laminam_payi_yuzde||0) >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                      %{(m.laminam_payi_yuzde||0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.sorumlu?.full_name}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/musteriler/${m.id}`} className="text-brand-600 hover:text-brand-800 text-sm font-medium">Detay →</Link>
                  </td>
                </tr>
              ))}
              {filtrelenmis.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  {musteriler.length === 0 ? <>Henüz kayıt yok. <Link href="/dashboard/musteriler/yeni" className="text-brand-600 hover:underline">İlk imaatçıyı ekleyin →</Link></> : 'Filtreyle eşleşen kayıt yok.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        {['A+', 'A', 'B', 'C'].map(seg => {
          const sayi = musteriler.filter(m => m.segment === seg).length
          return (
            <div key={seg} className="card p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltre(f => ({ ...f, segment: f.segment === seg ? '' : seg }))}>
              <span className={`badge text-lg font-bold px-3 py-1 ${segmentRengi[seg]}`}>{seg}</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">{sayi}</p>
              <p className="text-xs text-slate-500">müşteri</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
