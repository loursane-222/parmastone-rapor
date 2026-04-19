'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

const ikonlar: Record<string, string> = {
  dashboard: '◼',
  musteriler: '🏢',
  projeler: '📐',
  haftalik: '📋',
  ziyaret: '📅',
  raporlar: '📊',
  admin: '⚙️',
}

export default function Sidebar({ kullanici }: { kullanici: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const menuler = [
    { href: '/dashboard', etiket: 'Dashboard', ikon: ikonlar.dashboard },
    { href: '/musteriler', etiket: kullanici.role === 'proje_temsilci' ? 'Müşteriler' : 'İmalatçılar', ikon: ikonlar.musteriler },
    { href: '/projeler', etiket: 'Projeler', ikon: ikonlar.projeler },
    { href: '/haftalik-rapor', etiket: 'Haftalık Rapor', ikon: ikonlar.haftalik },
    { href: '/ziyaret-planlama', etiket: 'Ziyaret Planlama', ikon: ikonlar.ziyaret },
    { href: '/raporlar', etiket: 'Raporlar', ikon: ikonlar.raporlar },
    ...(kullanici.role === 'admin' ? [{ href: '/admin', etiket: 'Yönetici Paneli', ikon: ikonlar.admin }] : []),
  ]

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push('/auth/giris')
    router.refresh()
  }

  const rolEtiketi = {
    admin: 'Yönetici',
    imalatci_temsilci: 'İmalatçı Temsilcisi',
    proje_temsilci: 'Proje Temsilcisi',
  }[kullanici.role]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Slab CRM</p>
            <p className="text-xs text-slate-500">Ege Bölgesi</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuler.map(m => (
          <Link
            key={m.href}
            href={m.href}
            className={pathname.startsWith(m.href) ? 'nav-item-active' : 'nav-item'}
          >
            <span className="text-base">{m.ikon}</span>
            <span>{m.etiket}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-brand-700 font-semibold text-xs">
              {kullanici.full_name?.charAt(0) || 'K'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{kullanici.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{rolEtiketi}</p>
          </div>
        </div>
        <button onClick={cikisYap} className="w-full text-left text-xs text-slate-500 hover:text-red-600 transition-colors px-2 py-1">
          Çıkış Yap →
        </button>
      </div>
    </aside>
  )
}
