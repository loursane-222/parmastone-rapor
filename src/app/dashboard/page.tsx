'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [profil, setProfil] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function yukle() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/giris'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!p) { router.push('/auth/giris'); return }
      setProfil(p)
      setYukleniyor(false)
    }
    yukle()
  }, [])

  if (yukleniyor) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400">Yükleniyor...</p>
    </div>
  )

  const rolEtiketi: Record<string, string> = {
    admin: 'Yönetici',
    imalatci_temsilci: 'İmalatçı Temsilcisi',
    proje_temsilci: 'Proje Temsilcisi',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Merhaba, {profil.full_name} 👋</h1>
        <p className="text-slate-500 mt-1">{rolEtiketi[profil.role]} — Ege Bölgesi</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <a href="/dashboard/musteriler" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-2xl mb-2">🏢</div>
          <p className="font-semibold text-slate-900">Müşteriler</p>
          <p className="text-sm text-slate-500 mt-1">Portföyünüzü yönetin</p>
        </a>
        <a href="/dashboard/projeler" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-2xl mb-2">📐</div>
          <p className="font-semibold text-slate-900">Projeler</p>
          <p className="text-sm text-slate-500 mt-1">Proje takibi</p>
        </a>
        <a href="/dashboard/haftalik-rapor" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-2xl mb-2">📋</div>
          <p className="font-semibold text-slate-900">Haftalık Rapor</p>
          <p className="text-sm text-slate-500 mt-1">Rapor girin</p>
        </a>
        <a href="/dashboard/ziyaret-planlama" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-2xl mb-2">📅</div>
          <p className="font-semibold text-slate-900">Ziyaret Planlama</p>
          <p className="text-sm text-slate-500 mt-1">Planlarınızı görün</p>
        </a>
        <a href="/dashboard/raporlar" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-2xl mb-2">📊</div>
          <p className="font-semibold text-slate-900">Raporlar</p>
          <p className="text-sm text-slate-500 mt-1">Analiz ve raporlar</p>
        </a>
        {profil.role === 'admin' && (
          <a href="/dashboard/admin" className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="font-semibold text-slate-900">Yönetici Paneli</p>
            <p className="text-sm text-slate-500 mt-1">Tüm bölge özeti</p>
          </a>
        )}
      </div>
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">⚡ Hızlı Eylemler</h2>
        <div className="flex gap-3 flex-wrap">
          <a href="/dashboard/musteriler/yeni" className="btn-primary">+ Yeni Müşteri</a>
          <a href="/dashboard/projeler/yeni" className="btn-secondary">+ Yeni Proje</a>
          <a href="/dashboard/haftalik-rapor/yeni" className="btn-secondary">+ Haftalık Rapor</a>
          <a href="/dashboard/ziyaret-planlama/yeni" className="btn-secondary">+ Ziyaret Planla</a>
        </div>
      </div>
    </div>
  )
}
