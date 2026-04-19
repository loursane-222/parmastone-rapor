'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const GUNLER = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

function ayinIlkGunu(yil: number, ay: number): number {
  const gun = new Date(yil, ay, 1).getDay()
  return gun === 0 ? 6 : gun - 1
}
function ayinGunSayisi(yil: number, ay: number): number {
  return new Date(yil, ay + 1, 0).getDate()
}

const RENK_MAP: Record<string, string> = {
  rutin: 'bg-blue-100 text-blue-800 border-blue-200',
  teklif: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  numune: 'bg-purple-100 text-purple-800 border-purple-200',
  teknik: 'bg-teal-100 text-teal-800 border-teal-200',
  tahsilat: 'bg-orange-100 text-orange-800 border-orange-200',
  tanitim: 'bg-pink-100 text-pink-800 border-pink-200',
}

export default function ZiyaretPlanlamaPage() {
  const bugun = new Date()
  const [yil, setYil] = useState(bugun.getFullYear())
  const [ay, setAy] = useState(bugun.getMonth())
  const [planlar, setPlanlar] = useState<any[]>([])
  const [gecmis, setGecmis] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secilenGun, setSecilenGun] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const baslangic = `${yil}-${String(ay + 1).padStart(2, '0')}-01`
    const bitis = `${yil}-${String(ay + 1).padStart(2, '0')}-${String(ayinGunSayisi(yil, ay)).padStart(2, '0')}`

    Promise.all([
      supabase.from('visit_plans')
        .select('*, customer:customers(firma_adi, kayit_tipi), temsilci:profiles(full_name)')
        .gte('planlanan_tarih', baslangic)
        .lte('planlanan_tarih', bitis)
        .order('planlanan_tarih'),
      supabase.from('visits')
        .select('*, customer:customers(firma_adi), temsilci:profiles(full_name)')
        .gte('tarih', baslangic)
        .lte('tarih', bitis)
        .order('tarih', { ascending: false }),
    ]).then(([p, g]) => {
      setPlanlar(p.data || [])
      setGecmis(g.data || [])
      setYukleniyor(false)
    })
  }, [yil, ay])

  function oncekiAy() {
    if (ay === 0) { setYil(y => y - 1); setAy(11) } else setAy(a => a - 1)
    setSecilenGun(null)
  }
  function sonrakiAy() {
    if (ay === 11) { setYil(y => y + 1); setAy(0) } else setAy(a => a + 1)
    setSecilenGun(null)
  }

  const ilkGun = ayinIlkGunu(yil, ay)
  const gunSayisi = ayinGunSayisi(yil, ay)
  const toplamHucre = Math.ceil((ilkGun + gunSayisi) / 7) * 7

  function gunPlanlari(gun: number) {
    const tarihStr = `${yil}-${String(ay + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`
    return planlar.filter(p => p.planlanan_tarih === tarihStr)
  }
  function gunZiyaretleri(gun: number) {
    const tarihStr = `${yil}-${String(ay + 1).padStart(2, '0')}-${String(gun).padStart(2, '0')}`
    return gecmis.filter(z => z.tarih === tarihStr)
  }

  const secilenGunPlanlari = secilenGun ? gunPlanlari(secilenGun) : []
  const secilenGunZiyaretleri = secilenGun ? gunZiyaretleri(secilenGun) : []
  const bugunMu = (gun: number) => gun === bugun.getDate() && ay === bugun.getMonth() && yil === bugun.getFullYear()

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ziyaret Planlama</h1>
          <p className="text-slate-500 text-sm mt-1">{planlar.length} planlanan · {gecmis.length} gerçekleşen</p>
        </div>
        <Link href="/dashboard/ziyaret-planlama/yeni" className="btn-primary">+ Ziyaret Planla</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TAKVİM */}
        <div className="lg:col-span-2 card p-5">
          {/* Ay navigasyon */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={oncekiAy} className="btn-ghost px-3 py-1.5 text-lg">←</button>
            <h2 className="font-semibold text-slate-900 text-lg">{AYLAR[ay]} {yil}</h2>
            <button onClick={sonrakiAy} className="btn-ghost px-3 py-1.5 text-lg">→</button>
          </div>

          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 mb-1">
            {GUNLER.map(g => (
              <div key={g} className={`text-center text-xs font-semibold py-2 ${g === 'Cmt' || g === 'Paz' ? 'text-slate-400' : 'text-slate-500'}`}>{g}</div>
            ))}
          </div>

          {/* Takvim hücreleri */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: toplamHucre }).map((_, idx) => {
              const gun = idx - ilkGun + 1
              const gecerli = gun >= 1 && gun <= gunSayisi
              if (!gecerli) return <div key={idx} className="h-20 rounded-lg" />

              const gPlanlar = gunPlanlari(gun)
              const gZiyaretler = gunZiyaretleri(gun)
              const hepsiBirden = [...gPlanlar, ...gZiyaretler]
              const hafSonu = (idx % 7) === 5 || (idx % 7) === 6
              const secili = secilenGun === gun
              const bugunUMu = bugunMu(gun)

              return (
                <div
                  key={idx}
                  onClick={() => setSecilenGun(secili ? null : gun)}
                  className={`h-20 rounded-lg p-1.5 cursor-pointer border transition-all overflow-hidden
                    ${bugunUMu ? 'border-brand-400 bg-brand-50' : secili ? 'border-brand-300 bg-blue-50' : hafSonu ? 'border-slate-100 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'}
                    ${hepsiBirden.length > 0 ? 'hover:shadow-sm' : ''}`}
                >
                  <div className={`text-xs font-semibold mb-1 ${bugunUMu ? 'text-brand-700' : hafSonu ? 'text-slate-400' : 'text-slate-600'}`}>
                    {gun}
                    {bugunUMu && <span className="ml-1 text-brand-500">●</span>}
                  </div>
                  <div className="space-y-0.5">
                    {hepsiBirden.slice(0, 3).map((item, i) => {
                      const isPlan = 'planlanan_tarih' in item
                      const isim = item.customer?.firma_adi || '—'
                      const kisaIsim = isim.length > 10 ? isim.substring(0, 10) + '…' : isim
                      return (
                        <div key={i} className={`text-xs px-1 py-0.5 rounded border truncate ${isPlan ? (RENK_MAP[item.ziyaret_tipi] || 'bg-blue-100 text-blue-800 border-blue-200') : 'bg-green-100 text-green-800 border-green-200'}`}>
                          {kisaIsim}
                        </div>
                      )
                    })}
                    {hepsiBirden.length > 3 && (
                      <div className="text-xs text-slate-400 px-1">+{hepsiBirden.length - 3} daha</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Renk açıklaması */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />Rutin
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />Teklif
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" />Numune
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded bg-teal-100 border border-teal-200" />Teknik
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />Gerçekleşti
            </div>
          </div>
        </div>

        {/* SAĞ PANEL */}
        <div className="space-y-4">
          {/* Seçilen gün detayı */}
          {secilenGun ? (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  {secilenGun} {AYLAR[ay]} {yil}
                </h3>
                <Link
                  href={`/dashboard/ziyaret-planlama/yeni`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  + Ekle
                </Link>
              </div>

              {secilenGunPlanlari.length === 0 && secilenGunZiyaretleri.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Bu gün için kayıt yok</p>
              )}

              {secilenGunPlanlari.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Planlanan</p>
                  <div className="space-y-2">
                    {secilenGunPlanlari.map(p => (
                      <div key={p.id} className={`p-3 rounded-lg border ${RENK_MAP[p.ziyaret_tipi] || 'bg-blue-50 border-blue-200'}`}>
                        <p className="font-medium text-sm">{p.customer?.firma_adi || '—'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-75">{p.planlanan_saat || 'Saat belirtilmemiş'}</span>
                          <span className="text-xs opacity-75">{p.temsilci?.full_name}</span>
                        </div>
                        {p.amac && <p className="text-xs opacity-75 mt-1">{p.amac}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {secilenGunZiyaretleri.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gerçekleşen</p>
                  <div className="space-y-2">
                    {secilenGunZiyaretleri.map(z => (
                      <div key={z.id} className="p-3 rounded-lg border bg-green-50 border-green-200">
                        <p className="font-medium text-sm text-green-900">{z.customer?.firma_adi || '—'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-700">{z.temsilci?.full_name}</span>
                          <span className={`badge text-xs ${z.gerceklesti ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-700'}`}>
                            {z.gerceklesti ? '✓ Gerçekleşti' : '✗ İptal'}
                          </span>
                        </div>
                        {z.ziyaret_notu && <p className="text-xs text-green-700 mt-1 line-clamp-2">{z.ziyaret_notu}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-2">Takvim</h3>
              <p className="text-sm text-slate-500">Detay görmek için bir güne tıklayın.</p>
            </div>
          )}

          {/* Bu ay özeti */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-700 mb-3">📊 {AYLAR[ay]} Özeti</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Planlanan Ziyaret</span>
                <span className="font-semibold text-slate-900">{planlar.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gerçekleşen</span>
                <span className="font-semibold text-green-700">{gecmis.filter(z => z.gerceklesti).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benzersiz Müşteri</span>
                <span className="font-semibold text-slate-900">
                  {new Set([...planlar.map(p => p.customer_id), ...gecmis.map(z => z.customer_id)]).size}
                </span>
              </div>
              {planlar.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gerçekleşme Oranı</span>
                    <span className="font-semibold text-brand-700">
                      %{Math.round((gecmis.filter(z => z.gerceklesti).length / planlar.length) * 100)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
