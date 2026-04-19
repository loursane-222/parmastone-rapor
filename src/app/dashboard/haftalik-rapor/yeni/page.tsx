'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buHaftaninBaslangici, hesaplaPerformansPuani, puanYorumu } from '@/lib/utils'

export default function YeniRaporPage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    hafta_baslangic: buHaftaninBaslangici(),
    toplam_ziyaret: 0, benzersiz_musteri: 0,
    satis_tutari_eur: 0, tahsilat_tutari_tl: 0,
    verilen_teklif: 0, onaylanan_siparis: 0, yeni_musteri: 0,
    karar_verici_gorusme: 0, urun_sunumu: 0, fiyat_konusulan: 0,
    numune_konusulan: 0, sonraki_adim_net: 0,
    genel_degerlendirme: '', hedef_durumu: '',
    rakip_aktiviteleri: '', genel_yorum: ''
  })

  function guncelle(alan: string, deger: any) { setForm(f => ({ ...f, [alan]: deger })) }

  const puan = hesaplaPerformansPuani({
    toplam_ziyaret: Number(form.toplam_ziyaret),
    karar_verici_gorusme: Number(form.karar_verici_gorusme),
    sonraki_adim_net: Number(form.sonraki_adim_net),
    onaylanan_siparis: Number(form.onaylanan_siparis),
    yeni_musteri: Number(form.yeni_musteri),
  })
  const yorum = puanYorumu(puan)

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('weekly_reports').insert({
      ...form, temsilci_id: user.id,
      toplam_ziyaret: Number(form.toplam_ziyaret),
      benzersiz_musteri: Number(form.benzersiz_musteri),
      satis_tutari_eur: Number(form.satis_tutari_eur),
      tahsilat_tutari_tl: Number(form.tahsilat_tutari_tl),
      verilen_teklif: Number(form.verilen_teklif),
      onaylanan_siparis: Number(form.onaylanan_siparis),
      yeni_musteri: Number(form.yeni_musteri),
      karar_verici_gorusme: Number(form.karar_verici_gorusme),
      urun_sunumu: Number(form.urun_sunumu),
      fiyat_konusulan: Number(form.fiyat_konusulan),
      numune_konusulan: Number(form.numune_konusulan),
      sonraki_adim_net: Number(form.sonraki_adim_net),
    })
    if (error) { setHata('Hata: ' + error.message); setYukleniyor(false) }
    else { router.push('/dashboard/haftalik-rapor') }
  }

  const sayisalAlanlar = [
    { alan: 'toplam_ziyaret', etiket: 'Toplam Ziyaret' },
    { alan: 'benzersiz_musteri', etiket: 'Benzersiz Müşteri' },
    { alan: 'verilen_teklif', etiket: 'Verilen Teklif' },
    { alan: 'onaylanan_siparis', etiket: 'Onaylanan Sipariş' },
    { alan: 'yeni_musteri', etiket: 'Yeni Müşteri' },
    { alan: 'karar_verici_gorusme', etiket: 'Karar Verici Görüşme' },
    { alan: 'urun_sunumu', etiket: 'Ürün Sunumu' },
    { alan: 'fiyat_konusulan', etiket: 'Fiyat Konuşulan' },
    { alan: 'numune_konusulan', etiket: 'Numune Konuşulan' },
    { alan: 'sonraki_adim_net', etiket: 'Sonraki Adımı Net' },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Haftalık Rapor Girişi</h1>
      </div>
      <form onSubmit={kaydet} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Hafta Bilgisi</h2>
            <div className="text-right">
              <div className={`text-3xl font-bold ${yorum.renk}`}>{puan}</div>
              <div className="text-xs text-slate-500">anlık puan</div>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Hafta Başlangıç Tarihi</label>
            <input type="date" className="form-input max-w-xs" value={form.hafta_baslangic} onChange={e => guncelle('hafta_baslangic', e.target.value)} />
          </div>
          {puan > 0 && <p className={`text-sm font-medium ${yorum.renk}`}>{yorum.mesaj}</p>}
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Aktivite Metrikleri</h2>
          <div className="grid grid-cols-2 gap-4">
            {sayisalAlanlar.map(({ alan, etiket }) => (
              <div key={alan}>
                <label className="form-label">{etiket}</label>
                <input type="number" min="0" className="form-input"
                  value={form[alan as keyof typeof form] as number}
                  onChange={e => guncelle(alan, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="form-label">Satış Tutarı (€)</label>
              <input type="number" min="0" className="form-input" value={form.satis_tutari_eur} onChange={e => guncelle('satis_tutari_eur', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Tahsilat (₺)</label>
              <input type="number" min="0" className="form-input" value={form.tahsilat_tutari_tl} onChange={e => guncelle('tahsilat_tutari_tl', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Değerlendirme</h2>
          <div className="space-y-4">
            {[
              { alan: 'genel_degerlendirme', etiket: 'Genel Değerlendirme', placeholder: 'Ziyaret edilen bölgeler, müşteriler...' },
              { alan: 'hedef_durumu', etiket: 'Hedeflerin Durumu', placeholder: 'Hedeflere göre neredesiniz?' },
              { alan: 'rakip_aktiviteleri', etiket: 'Rakip Aktiviteleri', placeholder: 'Rakip fiyatlar, kampanyalar...' },
              { alan: 'genel_yorum', etiket: 'Genel Yorum', placeholder: 'Yöneticiye iletmek istedikleriniz...' },
            ].map(({ alan, etiket, placeholder }) => (
              <div key={alan}>
                <label className="form-label">{etiket}</label>
                <textarea className="form-input h-20 resize-none"
                  value={form[alan as keyof typeof form] as string}
                  onChange={e => guncelle(alan, e.target.value)}
                  placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>
        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={yukleniyor} className="btn-primary">{yukleniyor ? 'Kaydediliyor...' : 'Raporu Kaydet'}</button>
          <button type="button" onClick={() => router.push('/dashboard/haftalik-rapor')} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
