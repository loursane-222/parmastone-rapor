'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MARKALAR = ['Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime','Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone','Kuvars','Doğaltaş','Diğer']

function hesaplaSegment(plaka: number): string {
  if (plaka > 100) return 'A+'
  if (plaka > 70) return 'A'
  if (plaka > 30) return 'B'
  return 'C'
}
function hesaplaOncelik(segment: string): string {
  if (segment === 'A+') return 'Öncelik 0'
  if (segment === 'A') return 'Öncelik 1'
  if (segment === 'B') return 'Öncelik 2'
  return 'Öncelik 3'
}
function hesaplaSkor(ciro: number, plaka: number, marka: string): number {
  const ciroSkor = Math.min(ciro / 5000, 10) * 6
  const plakaSkor = Math.min(plaka / 20, 10) * 2
  const markaBonus: Record<string, number> = { 'Laminam': 20, 'Dekton': 14, 'Neolith': 14, 'Atlas': 12, 'Materia': 12, 'Infinity': 12, 'Level': 12 }
  const bonus = markaBonus[marka] || 0
  return Math.round(ciroSkor + plakaSkor + bonus)
}

export default function YeniMusteriPage() {
  const router = useRouter()
  const supabase = createClient()
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [form, setForm] = useState({
    firma_adi: '', sehir: '', bolge: '', yetkili_kisi: '',
    telefon: '', email: '', adres: '',
    aylik_toplam_plaka_pot: 0, aylik_toplam_m2_pot: 0, aylik_toplam_ciro_pot: 0,
    en_cok_marka: '',
    laminam_kullaniyor: false,
    laminam_mevcut_plaka: 0, laminam_mevcut_m2: 0, laminam_mevcut_ciro: 0,
    laminam_pot_plaka: 0, laminam_pot_m2: 0, laminam_pot_ciro: 0,
    notlar: ''
  })

  const plaka = Number(form.aylik_toplam_plaka_pot)
  const ciro = Number(form.aylik_toplam_ciro_pot)
  const segment = hesaplaSegment(plaka)
  const oncelik = hesaplaOncelik(segment)
  const skor = hesaplaSkor(ciro, plaka, form.en_cok_marka)

  function guncelle(alan: string, deger: any) { setForm(f => ({ ...f, [alan]: deger })) }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('customers').insert({
      ...form,
      kayit_tipi: 'imalatci',
      sorumlu_id: user.id,
      segment, oncelik,
      oncelik_skoru: skor,
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
    if (error) { setHata('Hata: ' + error.message); setYukleniyor(false) }
    else { router.push('/dashboard/musteriler') }
  }

  const segmentRengi = { 'A+': 'bg-green-100 text-green-800', 'A': 'bg-blue-100 text-blue-800', 'B': 'bg-yellow-100 text-yellow-800', 'C': 'bg-gray-100 text-gray-700' }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni İmalatçı Kaydı</h1>
        <p className="text-slate-500 text-sm mt-1">Portföyünüze yeni firma ekleyin</p>
      </div>
      <form onSubmit={kaydet} className="space-y-6">

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Temel Bilgiler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Firma Adı *</label>
              <input className="form-input" value={form.firma_adi} onChange={e => guncelle('firma_adi', e.target.value)} required placeholder="Firma adı" />
            </div>
            <div>
              <label className="form-label">Şehir *</label>
              <input className="form-input" value={form.sehir} onChange={e => guncelle('sehir', e.target.value)} required placeholder="İzmir" />
            </div>
            <div>
              <label className="form-label">Bölge</label>
              <input className="form-input" value={form.bolge} onChange={e => guncelle('bolge', e.target.value)} placeholder="Ege" />
            </div>
            <div>
              <label className="form-label">Yetkili Kişi</label>
              <input className="form-input" value={form.yetkili_kisi} onChange={e => guncelle('yetkili_kisi', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Telefon</label>
              <input className="form-input" value={form.telefon} onChange={e => guncelle('telefon', e.target.value)} placeholder="+90 532 000 0000" />
            </div>
            <div>
              <label className="form-label">E-posta</label>
              <input type="email" className="form-input" value={form.email} onChange={e => guncelle('email', e.target.value)} />
            </div>
            <div>
              <label className="form-label">En Çok Çalıştığı Marka</label>
              <select className="form-input" value={form.en_cok_marka} onChange={e => guncelle('en_cok_marka', e.target.value)}>
                <option value="">Seçin...</option>
                {MARKALAR.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Kapasite ve Potansiyel</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Aylık İşleme Kapasitesi (Plaka) *</label>
              <input type="number" className="form-input" value={form.aylik_toplam_plaka_pot} onChange={e => guncelle('aylik_toplam_plaka_pot', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Aylık m² Potansiyeli</label>
              <input type="number" className="form-input" value={form.aylik_toplam_m2_pot} onChange={e => guncelle('aylik_toplam_m2_pot', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Aylık Yaklaşık Ciro (€)</label>
              <input type="number" className="form-input" value={form.aylik_toplam_ciro_pot} onChange={e => guncelle('aylik_toplam_ciro_pot', e.target.value)} placeholder="0" />
            </div>
          </div>

          {(plaka > 0 || ciro > 0) && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Segment</div>
                <span className={`badge text-sm font-semibold ${segmentRengi[segment as keyof typeof segmentRengi]}`}>{segment}</span>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Öncelik</div>
                <span className="text-sm font-medium text-slate-700">{oncelik}</span>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Potansiyel Skor</div>
                <span className="text-lg font-bold text-brand-700">{skor}</span>
              </div>
              <div className="text-xs text-slate-400 flex-1">
                Segment: A+ (&gt;100 plaka), A (&gt;70), B (&gt;30), C (≤30)
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Laminam Bilgileri</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.laminam_kullaniyor} onChange={e => guncelle('laminam_kullaniyor', e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">Laminam kullanıyor</span>
            </label>
          </div>
          {form.laminam_kullaniyor && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Mevcut Kullanım</p>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="form-label">Mevcut Plaka/Ay</label><input type="number" className="form-input" value={form.laminam_mevcut_plaka} onChange={e => guncelle('laminam_mevcut_plaka', e.target.value)} /></div>
                <div><label className="form-label">Mevcut m²/Ay</label><input type="number" className="form-input" value={form.laminam_mevcut_m2} onChange={e => guncelle('laminam_mevcut_m2', e.target.value)} /></div>
                <div><label className="form-label">Mevcut Ciro (€)</label><input type="number" className="form-input" value={form.laminam_mevcut_ciro} onChange={e => guncelle('laminam_mevcut_ciro', e.target.value)} /></div>
              </div>
            </div>
          )}
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Hedef Potansiyel</p>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label">Pot. Plaka/Ay</label><input type="number" className="form-input" value={form.laminam_pot_plaka} onChange={e => guncelle('laminam_pot_plaka', e.target.value)} /></div>
            <div><label className="form-label">Pot. m²/Ay</label><input type="number" className="form-input" value={form.laminam_pot_m2} onChange={e => guncelle('laminam_pot_m2', e.target.value)} /></div>
            <div><label className="form-label">Pot. Ciro (€)</label><input type="number" className="form-input" value={form.laminam_pot_ciro} onChange={e => guncelle('laminam_pot_ciro', e.target.value)} /></div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Notlar</h2>
          <textarea className="form-input h-24 resize-none" value={form.notlar} onChange={e => guncelle('notlar', e.target.value)} placeholder="Bu müşteri hakkında notlar..." />
        </div>

        {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={yukleniyor} className="btn-primary">{yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}</button>
          <button type="button" onClick={() => router.push('/dashboard/musteriler')} className="btn-secondary">İptal</button>
        </div>
      </form>
    </div>
  )
}
