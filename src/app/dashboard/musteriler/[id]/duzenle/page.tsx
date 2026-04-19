'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MusteriDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState<any>(null)

  useEffect(() => { params.then(p => setId(p.id)) }, [])

  useEffect(() => {
    if (!id) return
    supabase.from('customers').select('*').eq('id', id).single()
      .then(({ data }) => { setForm(data); setYukleniyor(false) })
  }, [id])

  function guncelle(alan: string, deger: any) { setForm((f: any) => ({ ...f, [alan]: deger })) }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setKaydediyor(true)
    const { error } = await supabase.from('customers').update({
      firma_adi: form.firma_adi, kayit_tipi: form.kayit_tipi,
      sehir: form.sehir, bolge: form.bolge, yetkili_kisi: form.yetkili_kisi,
      telefon: form.telefon, email: form.email, adres: form.adres,
      aylik_toplam_plaka_pot: Number(form.aylik_toplam_plaka_pot),
      aylik_toplam_m2_pot: Number(form.aylik_toplam_m2_pot),
      aylik_toplam_ciro_pot: Number(form.aylik_toplam_ciro_pot),
      laminam_kullaniyor: form.laminam_kullaniyor,
      laminam_mevcut_plaka: Number(form.laminam_mevcut_plaka),
      laminam_mevcut_m2: Number(form.laminam_mevcut_m2),
      laminam_mevcut_ciro: Number(form.laminam_mevcut_ciro),
      laminam_pot_plaka: Number(form.laminam_pot_plaka),
      laminam_pot_m2: Number(form.laminam_pot_m2),
      laminam_pot_ciro: Number(form.laminam_pot_ciro),
      notlar: form.notlar,
    }).eq('id', id)
    if (error) { setHata('Hata: ' + error.message); setKaydediyor(false) }
    else { router.push(`/dashboard/musteriler/${id}`) }
  }

  if (yukleniyor) return <div className="flex items-center justify-center h-64"><p className="text-slate-400">Yükleniyor...</p></div>
  if (!form) return <div className="text-center py-12 text-slate-400">Müşteri bulunamadı</div>

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Müşteri Düzenle</h1>
        <p className="text-slate-500 text-sm mt-1">{form.firma_adi}</p>
      </div>
      <form onSubmit={kaydet} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="form-label">Firma Adı *</label><input className="form-input" value={form.firma_adi || ''} onChange={e => guncelle('firma_adi', e.target.value)} required /></div>
            <div>
              <label className="form-label">Kayıt Tipi</label>
              <select className="form-input" value={form.kayit_tipi} onChange={e => guncelle('kayit_tipi', e.target.value)}>
                <option value="imalatci">İmalatçı</option>
                <option value="proje">Proje</option>
              </select>
            </div>
            <div><label className="form-label">Şehir *</label><input className="form-input" value={form.sehir || ''} onChange={e => guncelle('sehir', e.target.value)} required /></div>
            <div><label className="form-label">Yetkili Kişi</label><input className="form-input" value={form.yetkili_kisi || ''} onChange={e => guncelle('yetkili_kisi', e.target.value)} /></div>
            <div><label className="form-label">Telefon</label><input className="form-input" value={form.telefon || ''} onChange={e => guncelle('telefon', e.target.value)} /></div>
            <div><label className="form-label">E-posta</label><input type="email" className="form-input" value={form.email || ''} onChange={e => guncelle('email', e.target.value)} /></div>
            <div><label className="form-label">Bölge</label><input className="form-input" value={form.bolge || ''} onChange={e => guncelle('bolge', e.target.value)} /></div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Potansiyel Bilgileri</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Aylık Plaka Pot.</label><input type="number" className="form-input" value={form.aylik_toplam_plaka_pot || 0} onChange={e => guncelle('aylik_toplam_plaka_pot', e.target.value)} /></div>
            <div><label className="form-label">Aylık m² Pot.</label><input type="number" className="form-input" value={form.aylik_toplam_m2_pot || 0} onChange={e => guncelle('aylik_toplam_m2_pot', e.target.value)} /></div>
            <div><label className="form-label">Aylık Ciro Pot. (€)</label><input type="number" className="form-input" value={form.aylik_toplam_ciro_pot || 0} onChange={e => guncelle('aylik_toplam_ciro_pot', e.target.value)} /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Laminam Bilgileri</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.laminam_kullaniyor || false} onChange={e => guncelle('laminam_kullaniyor', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">Laminam kullanıyor</span>
            </label>
          </div>
          {form.laminam_kullaniyor && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="form-label">Mevcut Plaka</label><input type="number" className="form-input" value={form.laminam_mevcut_plaka || 0} onChange={e => guncelle('laminam_mevcut_plaka', e.target.value)} /></div>
              <div><label className="form-label">Mevcut m²</label><input type="number" className="form-input" value={form.laminam_mevcut_m2 || 0} onChange={e => guncelle('laminam_mevcut_m2', e.target.value)} /></div>
              <div><label className="form-label">Mevcut Ciro (€)</label><input type="number" className="form-input" value={form.laminam_mevcut_ciro || 0} onChange={e => guncelle('laminam_mevcut_ciro', e.target.value)} /></div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Pot. Plaka</label><input type="number" className="form-input" value={form.laminam_pot_plaka || 0} onChange={e => guncelle('laminam_pot_plaka', e.target.value)} /></div>
            <div><label className="form-label">Pot. m²</label><input type="number" className="form-input" value={form.laminam_pot_m2 || 0} onChange={e => guncelle('laminam_pot_m2', e.target.value)} /></div>
            <div><label className="form-label">Pot. Ciro (€)</label><input type="number" className="form-input" value={form.laminam_pot_ciro || 0} onChange={e => guncelle('laminam_pot_ciro', e.target.value)} /></div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar || ''} onChange={e => guncelle('notlar', e.target.value)} placeholder="Notlar..." />
        </div>
        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={kaydediyor} className="btn-primary">{kaydediyor ? 'Kaydediliyor...' : 'Güncelle'}</button>
          <button type="button" onClick={() => router.push(`/dashboard/musteriler/${id}`)} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
