'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COMPETITOR_BRANDS } from '@/types'

export default function YeniMusteriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    firma_adi: '', kayit_tipi: 'imalatci', sehir: '', bolge: '',
    yetkili_kisi: '', telefon: '', email: '', adres: '',
    aylik_toplam_plaka_pot: 0, aylik_toplam_m2_pot: 0, aylik_toplam_ciro_pot: 0,
    laminam_kullaniyor: false,
    laminam_mevcut_plaka: 0, laminam_mevcut_m2: 0, laminam_mevcut_ciro: 0,
    laminam_pot_plaka: 0, laminam_pot_m2: 0, laminam_pot_ciro: 0,
    notlar: ''
  })

  function guncelle(alan: string, deger: any) {
    setForm(f => ({ ...f, [alan]: deger }))
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('customers').insert({
      ...form,
      sorumlu_id: user.id,
      aylik_toplam_plaka_pot: Number(form.aylik_toplam_plaka_pot),
      aylik_toplam_m2_pot: Number(form.aylik_toplam_m2_pot),
      aylik_toplam_ciro_pot: Number(form.aylik_toplam_ciro_pot),
      laminam_mevcut_plaka: Number(form.laminam_mevcut_plaka),
      laminam_mevcut_m2: Number(form.laminam_mevcut_m2),
      laminam_mevcut_ciro: Number(form.laminam_mevcut_ciro),
      laminam_pot_plaka: Number(form.laminam_pot_plaka),
      laminam_pot_m2: Number(form.laminam_pot_m2),
      laminam_pot_ciro: Number(form.laminam_pot_ciro),
    })

    if (error) {
      setHata('Kayıt sırasında hata oluştu: ' + error.message)
      setYukleniyor(false)
    } else {
      router.push('/musteriler')
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Müşteri / Firma</h1>
        <p className="text-slate-500 text-sm mt-1">Portföyünüze yeni bir firma ekleyin</p>
      </div>

      <form onSubmit={kaydet} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Firma Adı *</label>
              <input className="form-input" value={form.firma_adi} onChange={e => guncelle('firma_adi', e.target.value)} required placeholder="Firma adını girin" />
            </div>
            <div>
              <label className="form-label">Kayıt Tipi *</label>
              <select className="form-input" value={form.kayit_tipi} onChange={e => guncelle('kayit_tipi', e.target.value)}>
                <option value="imalatci">İmalatçı</option>
                <option value="proje">Proje</option>
              </select>
            </div>
            <div>
              <label className="form-label">Şehir *</label>
              <input className="form-input" value={form.sehir} onChange={e => guncelle('sehir', e.target.value)} required placeholder="İzmir" />
            </div>
            <div>
              <label className="form-label">Yetkili Kişi</label>
              <input className="form-input" value={form.yetkili_kisi} onChange={e => guncelle('yetkili_kisi', e.target.value)} placeholder="Ad Soyad" />
            </div>
            <div>
              <label className="form-label">Telefon</label>
              <input className="form-input" value={form.telefon} onChange={e => guncelle('telefon', e.target.value)} placeholder="+90 532 000 0000" />
            </div>
            <div>
              <label className="form-label">E-posta</label>
              <input type="email" className="form-input" value={form.email} onChange={e => guncelle('email', e.target.value)} placeholder="info@firma.com" />
            </div>
            <div>
              <label className="form-label">Bölge</label>
              <input className="form-input" value={form.bolge} onChange={e => guncelle('bolge', e.target.value)} placeholder="Ege" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Potansiyel Bilgileri</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Aylık Toplam Plaka Pot.</label>
              <input type="number" className="form-input" value={form.aylik_toplam_plaka_pot} onChange={e => guncelle('aylik_toplam_plaka_pot', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Aylık Toplam m² Pot.</label>
              <input type="number" className="form-input" value={form.aylik_toplam_m2_pot} onChange={e => guncelle('aylik_toplam_m2_pot', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Aylık Ciro Pot. (€)</label>
              <input type="number" className="form-input" value={form.aylik_toplam_ciro_pot} onChange={e => guncelle('aylik_toplam_ciro_pot', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Laminam Bilgileri</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.laminam_kullaniyor} onChange={e => guncelle('laminam_kullaniyor', e.target.checked)} className="w-4 h-4 rounded text-brand-600" />
              <span className="text-sm text-slate-700">Laminam kullanıyor</span>
            </label>
          </div>
          {form.laminam_kullaniyor && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">Mevcut Plaka</label>
                <input type="number" className="form-input" value={form.laminam_mevcut_plaka} onChange={e => guncelle('laminam_mevcut_plaka', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Mevcut m²</label>
                <input type="number" className="form-input" value={form.laminam_mevcut_m2} onChange={e => guncelle('laminam_mevcut_m2', e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Mevcut Ciro (€)</label>
                <input type="number" className="form-input" value={form.laminam_mevcut_ciro} onChange={e => guncelle('laminam_mevcut_ciro', e.target.value)} placeholder="0" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Pot. Plaka</label>
              <input type="number" className="form-input" value={form.laminam_pot_plaka} onChange={e => guncelle('laminam_pot_plaka', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Pot. m²</label>
              <input type="number" className="form-input" value={form.laminam_pot_m2} onChange={e => guncelle('laminam_pot_m2', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Pot. Ciro (€)</label>
              <input type="number" className="form-input" value={form.laminam_pot_ciro} onChange={e => guncelle('laminam_pot_ciro', e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar} onChange={e => guncelle('notlar', e.target.value)} placeholder="Bu müşteri hakkında notlarınız..." />
        </div>

        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={yukleniyor} className="btn-primary">
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
