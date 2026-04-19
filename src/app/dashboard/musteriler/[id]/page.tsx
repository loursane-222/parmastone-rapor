'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatSayi, formatTarih, aiStratejiOnerisi } from '@/lib/utils'
import Link from 'next/link'

export default function MusteriDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [musteri, setMusteri] = useState<any>(null)
  const [ziyaretler, setZiyaretler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('customers').select('*, sorumlu:profiles(full_name)').eq('id', id).single(),
      supabase.from('visits').select('*, temsilci:profiles(full_name)').eq('customer_id', id).order('tarih', { ascending: false }).limit(10),
    ]).then(([m, z]) => {
      setMusteri(m.data)
      setZiyaretler(z.data || [])
      setYukleniyor(false)
    })
  }, [id])

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>
  if (!musteri) return <div className="text-center py-12 text-slate-400">Müşteri bulunamadı</div>

  const sonZiyaret = ziyaretler[0]?.tarih
  const sonZiyaretGun = sonZiyaret ? Math.floor((Date.now() - new Date(sonZiyaret).getTime()) / 86400000) : null
  const oneriler = aiStratejiOnerisi({ laminam_payi: musteri.laminam_payi_yuzde || 0, pot_ciro: musteri.aylik_toplam_ciro_pot || 0, son_ziyaret_gun: sonZiyaretGun })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{musteri.firma_adi}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${musteri.kayit_tipi === 'imalatci' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {musteri.kayit_tipi === 'imalatci' ? 'İmalatçı' : 'Proje'}
            </span>
            <span className="text-slate-500 text-sm">{musteri.sehir}</span>
          </div>
        </div>
        <Link href={`/dashboard/musteriler/${id}/duzenle`} className="btn-secondary">✏️ Düzenle</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">📋 Temel Bilgiler</h3>
          <dl className="space-y-2 text-sm">
            {musteri.yetkili_kisi && <div className="flex justify-between"><dt className="text-slate-500">Yetkili</dt><dd className="font-medium">{musteri.yetkili_kisi}</dd></div>}
            {musteri.telefon && <div className="flex justify-between"><dt className="text-slate-500">Telefon</dt><dd>{musteri.telefon}</dd></div>}
            {musteri.email && <div className="flex justify-between"><dt className="text-slate-500">E-posta</dt><dd>{musteri.email}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Sorumlu</dt><dd>{musteri.sorumlu?.full_name}</dd></div>
            {sonZiyaret && <div className="flex justify-between"><dt className="text-slate-500">Son Ziyaret</dt><dd className={sonZiyaretGun && sonZiyaretGun > 30 ? 'text-red-600 font-medium' : ''}>{formatTarih(sonZiyaret)} ({sonZiyaretGun} gün önce)</dd></div>}
            {musteri.notlar && <div className="pt-2 border-t border-slate-100"><dt className="text-slate-500 mb-1">Notlar</dt><dd className="text-slate-700">{musteri.notlar}</dd></div>}
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">💶 Potansiyel</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Toplam Ciro Pot.</span><span className="font-semibold">{formatEuro(musteri.aylik_toplam_ciro_pot)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Toplam Plaka Pot.</span><span className="font-semibold">{formatSayi(musteri.aylik_toplam_plaka_pot)}</span></div>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <div className="flex justify-between"><span className="text-slate-500">Laminam Mevcut</span><span className="font-semibold text-brand-700">{formatEuro(musteri.laminam_mevcut_ciro)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Laminam Pot.</span><span className="font-semibold">{formatEuro(musteri.laminam_pot_ciro)}</span></div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-500">Laminam Payı</span>
                <span className={`font-bold text-base ${(musteri.laminam_payi_yuzde||0) >= 40 ? 'text-green-600' : (musteri.laminam_payi_yuzde||0) >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  %{(musteri.laminam_payi_yuzde||0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 border-l-4 border-l-brand-500">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-slate-700">AI Strateji Önerileri</h3>
        </div>
        <ul className="space-y-2">
          {oneriler.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-brand-500 mt-0.5 flex-shrink-0">→</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">🚗 Ziyaret Geçmişi</h3>
          <Link href="/dashboard/ziyaret-planlama/yeni" className="btn-secondary text-xs">+ Ziyaret Planla</Link>
        </div>
        {ziyaretler.length > 0 ? (
          <div className="space-y-2">
            {ziyaretler.map(z => (
              <div key={z.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm font-medium">{formatTarih(z.tarih)}</span>
                  {z.amac && <span className="text-sm text-slate-500 ml-2">— {z.amac}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{z.temsilci?.full_name}</span>
                  <span className={`badge ${z.gerceklesti ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {z.gerceklesti ? 'Gerçekleşti' : 'Gerçekleşmedi'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">Henüz ziyaret kaydı yok</p>
        )}
      </div>
    </div>
  )
}
