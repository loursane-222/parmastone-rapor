import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatEuro, formatSayi, formatTarih, aiStratejiOnerisi } from '@/lib/utils'
import Link from 'next/link'

export default async function MusteriDetayPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/giris')

  const { data: musteri } = await supabase
    .from('customers')
    .select('*, sorumlu:profiles(full_name)')
    .eq('id', params.id)
    .single()

  if (!musteri) notFound()

  const { data: ziyaretler } = await supabase
    .from('visits')
    .select('*, temsilci:profiles(full_name)')
    .eq('customer_id', params.id)
    .order('tarih', { ascending: false })
    .limit(10)

  const sonZiyaret = ziyaretler?.[0]?.tarih
  const sonZiyaretGun = sonZiyaret
    ? Math.floor((Date.now() - new Date(sonZiyaret).getTime()) / 86400000)
    : null

  const oneriler = aiStratejiOnerisi({
    laminam_payi: musteri.laminam_payi_yuzde || 0,
    pot_ciro: musteri.aylik_toplam_ciro_pot || 0,
    son_ziyaret_gun: sonZiyaretGun,
  })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/musteriler" className="text-sm text-slate-500 hover:text-slate-700 mb-1 block">← Müşteriler</Link>
          <h1 className="text-2xl font-bold text-slate-900">{musteri.firma_adi}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${musteri.kayit_tipi === 'imalatci' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {musteri.kayit_tipi === 'imalatci' ? 'İmalatçı' : 'Proje'}
            </span>
            <span className="text-slate-500 text-sm">{musteri.sehir}</span>
          </div>
        </div>
        <Link href={`/musteriler/${params.id}/duzenle`} className="btn-secondary">Düzenle</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">📋 Temel Bilgiler</h3>
          <dl className="space-y-2 text-sm">
            {musteri.yetkili_kisi && <><dt className="text-slate-500">Yetkili</dt><dd className="font-medium">{musteri.yetkili_kisi}</dd></>}
            {musteri.telefon && <><dt className="text-slate-500">Telefon</dt><dd>{musteri.telefon}</dd></>}
            {musteri.email && <><dt className="text-slate-500">E-posta</dt><dd>{musteri.email}</dd></>}
            <dt className="text-slate-500">Sorumlu</dt><dd>{musteri.sorumlu?.full_name}</dd>
            {sonZiyaret && <><dt className="text-slate-500">Son Ziyaret</dt><dd className={sonZiyaretGun && sonZiyaretGun > 30 ? 'text-red-600 font-medium' : ''}>{formatTarih(sonZiyaret)} ({sonZiyaretGun} gün önce)</dd></>}
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 mb-3">💶 Potansiyel</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Toplam Ciro Pot.</span><span className="font-semibold">{formatEuro(musteri.aylik_toplam_ciro_pot)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Toplam Plaka Pot.</span><span className="font-semibold">{formatSayi(musteri.aylik_toplam_plaka_pot)}</span></div>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <div className="flex justify-between"><span className="text-slate-500">Laminam Mevcut Ciro</span><span className="font-semibold text-brand-700">{formatEuro(musteri.laminam_mevcut_ciro)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Laminam Pot. Ciro</span><span className="font-semibold">{formatEuro(musteri.laminam_pot_ciro)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Laminam Payı</span>
                <span className={`font-bold text-base ${(musteri.laminam_payi_yuzde || 0) >= 40 ? 'text-green-600' : (musteri.laminam_payi_yuzde || 0) >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  %{(musteri.laminam_payi_yuzde || 0).toFixed(1)}
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
          <Link href={`/ziyaret-planlama/yeni?musteri=${params.id}`} className="btn-secondary text-xs">+ Ziyaret Planla</Link>
        </div>
        {ziyaretler && ziyaretler.length > 0 ? (
          <div className="space-y-2">
            {ziyaretler.map(z => (
              <div key={z.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-slate-800">{formatTarih(z.tarih)}</span>
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
