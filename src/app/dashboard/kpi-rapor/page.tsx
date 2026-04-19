'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatEuro, formatTL } from '@/lib/utils'

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function BarProgress({ yuzde, renk }: { yuzde: number, renk: string }) {
  const goster = Math.min(100, Math.round(yuzde * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${renk}`} style={{ width: `${goster}%` }} />
      </div>
      <span className="text-xs font-semibold w-10 text-right">%{goster}</span>
    </div>
  )
}

function uyariRengi(oran: number) {
  if (oran >= 1) return 'text-green-700'
  if (oran >= 0.85) return 'text-blue-700'
  if (oran >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}
function uyariEtiketi(oran: number) {
  if (oran >= 1) return 'Hedefte / Üstü'
  if (oran >= 0.85) return 'Sınırda'
  if (oran >= 0.7) return 'Riskli'
  return 'Alarm ⚠️'
}
function barRenk(oran: number) {
  if (oran >= 1) return 'bg-green-500'
  if (oran >= 0.85) return 'bg-blue-500'
  if (oran >= 0.7) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function KpiRaporPage() {
  const bugun = new Date()
  const [yil, setYil] = useState(bugun.getFullYear())
  const [ay, setAy] = useState(bugun.getMonth() + 1)
  const [temsilciler, setTemsilciler] = useState<any[]>([])
  const [hedefler, setHedefler] = useState<Record<string, any>>({})
  const [raporlar, setRaporlar] = useState<any[]>([])
  const [seciliTemsilci, setSeciliTemsilci] = useState<string>('hepsi')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('profiles').select('*').neq('role', 'admin')
      .then(({ data }) => setTemsilciler(data || []))
  }, [])

  useEffect(() => {
    const ayBaslangic = `${yil}-${String(ay).padStart(2,'0')}-01`
    const ayBitis = new Date(yil, ay, 0).toISOString().split('T')[0]

    Promise.all([
      supabase.from('monthly_targets').select('*').eq('yil', yil).eq('ay', ay),
      supabase.from('weekly_reports').select('*')
        .gte('hafta_baslangic', ayBaslangic)
        .lte('hafta_baslangic', ayBitis),
    ]).then(([h, r]) => {
      const map: Record<string, any> = {}
      ;(h.data || []).forEach(x => { map[x.temsilci_id] = x })
      setHedefler(map)
      setRaporlar(r.data || [])
    })
  }, [yil, ay])

  function temsilciVerisi(temsilciId: string) {
    const hedef = hedefler[temsilciId] || {}
    const tRaporlar = raporlar.filter(r => r.temsilci_id === temsilciId)
    const gerceklesen = {
      satis: tRaporlar.reduce((t, r) => t + (r.satis_tutari_eur || 0), 0),
      tahsilat: tRaporlar.reduce((t, r) => t + (r.tahsilat_tutari_tl || 0), 0),
      ziyaret: tRaporlar.reduce((t, r) => t + (r.toplam_ziyaret || 0), 0),
      yeni_musteri: tRaporlar.reduce((t, r) => t + (r.yeni_musteri || 0), 0),
      teklif: tRaporlar.reduce((t, r) => t + (r.verilen_teklif || 0), 0),
      onaylanan: tRaporlar.reduce((t, r) => t + (r.onaylanan_siparis || 0), 0),
      karar_verici: tRaporlar.reduce((t, r) => t + (r.karar_verici_gorusme || 0), 0),
      urun_sunumu: tRaporlar.reduce((t, r) => t + (r.urun_sunumu || 0), 0),
      fiyat: tRaporlar.reduce((t, r) => t + (r.fiyat_konusulan || 0), 0),
      numune: tRaporlar.reduce((t, r) => t + (r.numune_konusulan || 0), 0),
      sonraki_adim: tRaporlar.reduce((t, r) => t + (r.sonraki_adim_net || 0), 0),
    }
    const girilenHafta = tRaporlar.length
    const oran = {
      satis: hedef.hedef_satis_eur > 0 ? gerceklesen.satis / hedef.hedef_satis_eur : 0,
      tahsilat: hedef.hedef_tahsilat_tl > 0 ? gerceklesen.tahsilat / hedef.hedef_tahsilat_tl : 0,
      ziyaret: hedef.hedef_ziyaret > 0 ? gerceklesen.ziyaret / hedef.hedef_ziyaret : 0,
      yeni_musteri: hedef.hedef_yeni_musteri > 0 ? gerceklesen.yeni_musteri / hedef.hedef_yeni_musteri : 0,
      teklif: hedef.hedef_teklif > 0 ? gerceklesen.teklif / hedef.hedef_teklif : 0,
      onaylanan: hedef.hedef_onaylanan_teklif > 0 ? gerceklesen.onaylanan / hedef.hedef_onaylanan_teklif : 0,
    }
    const kaliteOran = gerceklesen.ziyaret > 0
      ? (gerceklesen.karar_verici + gerceklesen.urun_sunumu + gerceklesen.fiyat + gerceklesen.numune + gerceklesen.sonraki_adim) / (gerceklesen.ziyaret * 5)
      : 0
    const performansPuani = (oran.satis * 0.3) + (oran.tahsilat * 0.3) + (oran.ziyaret * 0.1) + (oran.yeni_musteri * 0.05) + (oran.teklif * 0.05) + (oran.onaylanan * 0.05) + (kaliteOran * 0.15)
    const aysonuTahmini = {
      satis: girilenHafta > 0 ? (gerceklesen.satis / girilenHafta) * 4 : 0,
      tahsilat: girilenHafta > 0 ? (gerceklesen.tahsilat / girilenHafta) * 4 : 0,
      ziyaret: girilenHafta > 0 ? (gerceklesen.ziyaret / girilenHafta) * 4 : 0,
    }
    const motivasyon = performansPuani >= 1 ? '🔥 Harika gidiyorsun, bu ritmi koru!'
      : performansPuani >= 0.85 ? '👍 İyi gidiyorsun, son vuruşu yap.'
      : performansPuani >= 0.7 ? '⚠️ Yapabilirsin, odaklan ve toparla.'
      : '❌ Alarm bölgesi: planlı, sert ve disiplinli ilerle.'
    const anlıkDurum = performansPuani >= 1 ? 'Hedef çizgisinin üzerindesin.'
      : performansPuani >= 0.85 ? 'İyi gidiyorsun, biraz daha yüklen.'
      : performansPuani >= 0.7 ? 'Fena değil ama ivme kazanmalısın.'
      : 'Toparlanman gerek, planı sıkılaştır.'

    return { hedef, gerceklesen, oran, kaliteOran, performansPuani, aysonuTahmini, girilenHafta, motivasyon, anlıkDurum, tRaporlar }
  }

  const gosterilecek = seciliTemsilci === 'hepsi' ? temsilciler : temsilciler.filter(t => t.id === seciliTemsilci)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aylık KPI Raporu</h1>
          <p className="text-slate-500 text-sm mt-1">Temsilci performans takibi · Hedef vs Gerçekleşen</p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="form-input w-28" value={yil} onChange={e => setYil(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-input w-36" value={ay} onChange={e => setAy(Number(e.target.value))}>
            {AYLAR.map((a, i) => <option key={i+1} value={i+1}>{a}</option>)}
          </select>
          <select className="form-input w-48" value={seciliTemsilci} onChange={e => setSeciliTemsilci(e.target.value)}>
            <option value="hepsi">Tüm Temsilciler</option>
            {temsilciler.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {gosterilecek.map(t => {
          const v = temsilciVerisi(t.id)
          const puanEtiketi = v.performansPuani >= 1 ? 'Elite' : v.performansPuani >= 0.85 ? 'İyi' : v.performansPuani >= 0.7 ? 'Gelişmeli' : 'Problem'
          const puanRenk = v.performansPuani >= 1 ? 'text-green-700 bg-green-50' : v.performansPuani >= 0.85 ? 'text-blue-700 bg-blue-50' : v.performansPuani >= 0.7 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'

          return (
            <div key={t.id} className="card overflow-hidden" id={`rapor-${t.id}`}>
              {/* Başlık */}
              <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{t.full_name}</h2>
                  <p className="text-slate-400 text-sm">{AYLAR[ay-1]} {yil} · {v.girilenHafta} hafta girildi</p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-xl font-bold text-xl ${puanRenk}`}>
                    %{Math.round(v.performansPuani * 100)}
                  </div>
                  <p className={`text-sm font-semibold mt-1 ${puanRenk}`}>{puanEtiketi}</p>
                </div>
              </div>

              {/* Motivasyon mesajı */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700">{v.motivasyon}</p>
                <p className="text-xs text-slate-500 mt-0.5">{v.anlıkDurum}</p>
              </div>

              <div className="p-6">
                {/* Ana KPI'lar */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { etiket: 'Satış (€)', hedef: formatEuro(v.hedef.hedef_satis_eur || 0), gercek: formatEuro(v.gerceklesen.satis), oran: v.oran.satis, tahmini: formatEuro(v.aysonuTahmini.satis) },
                    { etiket: 'Tahsilat (₺)', hedef: `₺${(v.hedef.hedef_tahsilat_tl || 0).toLocaleString('tr-TR')}`, gercek: `₺${v.gerceklesen.tahsilat.toLocaleString('tr-TR')}`, oran: v.oran.tahsilat, tahmini: `₺${Math.round(v.aysonuTahmini.tahsilat).toLocaleString('tr-TR')}` },
                    { etiket: 'Ziyaret', hedef: v.hedef.hedef_ziyaret || 0, gercek: v.gerceklesen.ziyaret, oran: v.oran.ziyaret, tahmini: Math.round(v.aysonuTahmini.ziyaret) },
                    { etiket: 'Yeni Müşteri', hedef: v.hedef.hedef_yeni_musteri || 0, gercek: v.gerceklesen.yeni_musteri, oran: v.oran.yeni_musteri, tahmini: null },
                    { etiket: 'Teklif', hedef: v.hedef.hedef_teklif || 0, gercek: v.gerceklesen.teklif, oran: v.oran.teklif, tahmini: null },
                    { etiket: 'Onaylanan Teklif', hedef: v.hedef.hedef_onaylanan_teklif || 0, gercek: v.gerceklesen.onaylanan, oran: v.oran.onaylanan, tahmini: null },
                  ].map((k, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">{k.etiket}</p>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Hedef: {k.hedef}</span>
                        <span className={`font-bold ${uyariRengi(k.oran)}`}>{uyariEtiketi(k.oran)}</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 mb-2">{k.gercek}</p>
                      <BarProgress yuzde={k.oran} renk={barRenk(k.oran)} />
                      {k.tahmini && (
                        <p className="text-xs text-slate-400 mt-1">Ay sonu tahmini: {k.tahmini}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Görüşme kalitesi */}
                <div className="border border-slate-100 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-slate-700 mb-3 text-sm">Görüşme Kalitesi</h3>
                  <div className="grid grid-cols-5 gap-3 text-center">
                    {[
                      ['Karar Verici', v.gerceklesen.karar_verici],
                      ['Ürün Sunumu', v.gerceklesen.urun_sunumu],
                      ['Fiyat Konuşma', v.gerceklesen.fiyat],
                      ['Teşhir/Numune', v.gerceklesen.numune],
                      ['Sonraki Adım Net', v.gerceklesen.sonraki_adim],
                    ].map(([etiket, deger]) => (
                      <div key={etiket as string} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-slate-900">{deger}</div>
                        <div className="text-xs text-slate-500 mt-1">{etiket}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-slate-500">Kalite Puanı:</span>
                    <BarProgress yuzde={v.kaliteOran} renk={barRenk(v.kaliteOran)} />
                  </div>
                </div>

                {/* Haftalık detay tablosu */}
                {v.tRaporlar.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Haftalık Detay</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2 text-xs text-slate-500">Hafta</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Ziyaret</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Satış (€)</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Tahsilat (₺)</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Teklif</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Sipariş</th>
                            <th className="text-right px-3 py-2 text-xs text-slate-500">Skor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {v.tRaporlar.map((r, i) => {
                            const hSkor = ((r.satis_tutari_eur/(v.hedef.hedef_satis_eur||1))*0.3) + ((r.tahsilat_tutari_tl/(v.hedef.hedef_tahsilat_tl||1))*0.3) + ((r.toplam_ziyaret/(v.hedef.hedef_ziyaret||1))*0.1) + ((r.yeni_musteri/(v.hedef.hedef_yeni_musteri||1))*0.05) + ((r.verilen_teklif/(v.hedef.hedef_teklif||1))*0.05) + ((r.onaylanan_siparis/(v.hedef.hedef_onaylanan_teklif||1))*0.05)
                            return (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-600">Hafta {i+1}</td>
                                <td className="px-3 py-2 text-right">{r.toplam_ziyaret}</td>
                                <td className="px-3 py-2 text-right">{formatEuro(r.satis_tutari_eur)}</td>
                                <td className="px-3 py-2 text-right">₺{r.tahsilat_tutari_tl?.toLocaleString('tr-TR')}</td>
                                <td className="px-3 py-2 text-right">{r.verilen_teklif}</td>
                                <td className="px-3 py-2 text-right">{r.onaylanan_siparis}</td>
                                <td className={`px-3 py-2 text-right font-semibold ${uyariRengi(hSkor)}`}>%{Math.round(hSkor*100)}</td>
                              </tr>
                            )
                          })}
                          <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                            <td className="px-3 py-2">TOPLAM</td>
                            <td className="px-3 py-2 text-right">{v.gerceklesen.ziyaret}</td>
                            <td className="px-3 py-2 text-right">{formatEuro(v.gerceklesen.satis)}</td>
                            <td className="px-3 py-2 text-right">₺{v.gerceklesen.tahsilat.toLocaleString('tr-TR')}</td>
                            <td className="px-3 py-2 text-right">{v.gerceklesen.teklif}</td>
                            <td className="px-3 py-2 text-right">{v.gerceklesen.onaylanan}</td>
                            <td className={`px-3 py-2 text-right font-bold ${uyariRengi(v.performansPuani)}`}>%{Math.round(v.performansPuani*100)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PDF Butonu */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      const el = document.getElementById(`rapor-${t.id}`)
                      if (!el) return
                      const style = document.createElement('style')
                      style.textContent = '@media print { body > *:not(#print-target) { display: none !important; } #print-target { display: block !important; } }'
                      document.head.appendChild(style)
                      el.id = 'print-target'
                      window.print()
                      el.id = `rapor-${t.id}`
                      document.head.removeChild(style)
                    }}
                    className="btn-secondary text-sm"
                  >
                    🖨️ PDF / Yazdır
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {temsilciler.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            Temsilci bulunamadı
          </div>
        )}
      </div>
    </div>
  )
}
