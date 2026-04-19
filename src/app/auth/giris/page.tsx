'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const supabase = createClient()

  async function girisYap(e: React.FormEvent) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password: sifre 
    })
    
    if (error) {
      setHata('Giriş başarısız: ' + error.message)
      setYukleniyor(false)
      return
    }

    if (data.session) {
      window.location.replace('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Slab CRM</h1>
          <p className="text-brand-200 text-sm">Bölge Satış Yönetim Sistemi</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Giriş Yapın</h2>
          <form onSubmit={girisYap} className="space-y-4">
            <div>
              <label className="form-label">E-posta</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="e-posta@firma.com" required />
            </div>
            <div>
              <label className="form-label">Şifre</label>
              <input type="password" value={sifre} onChange={e => setSifre(e.target.value)} className="form-input" placeholder="••••••••" required />
            </div>
            {hata && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{hata}</div>}
            <button type="submit" disabled={yukleniyor} className="btn-primary w-full justify-center py-2.5">
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
        <p className="text-center text-brand-300 text-xs mt-6">Laminam Türkiye — Ege Bölgesi © 2024</p>
      </div>
    </div>
  )
}
