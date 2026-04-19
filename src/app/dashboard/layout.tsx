'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Sidebar() {
  const pathname = usePathname()
  const menuler = [
    { href: '/dashboard', etiket: 'Dashboard', ikon: '◼' },
    { href: '/dashboard/musteriler', etiket: 'İmalatçılar', ikon: '🏢' },
    { href: '/dashboard/projeler', etiket: 'Projeler', ikon: '📐' },
    { href: '/dashboard/haftalik-rapor', etiket: 'Haftalık Rapor', ikon: '📋' },
    { href: '/dashboard/ziyaret-planlama', etiket: 'Ziyaret Planlama', ikon: '📅' },
    { href: '/dashboard/kpi-rapor', etiket: 'KPI Raporu', ikon: '🎯' },
    { href: '/dashboard/raporlar', etiket: 'Raporlar', ikon: '📊' },
    { href: '/dashboard/admin', etiket: 'Yönetici Paneli', ikon: '⚙️' },
    { href: '/dashboard/admin/hedefler', etiket: 'Hedef Yönetimi', ikon: '🏹' },
  ]

  const aktif = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center flex-shrink-0">
            <div style={{
              color: 'white',
              fontSize: '7.5px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              lineHeight: '1.2',
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
            }}>
              PARMA<br/>STONE
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Parmastone Rapor</p>
            <p className="text-xs text-slate-500">Ege Bölgesi</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuler.map(m => (
          <Link key={m.href} href={m.href}
            className={aktif(m.href) ? 'nav-item-active' : 'nav-item'}>
            <span>{m.ikon}</span>
            <span>{m.etiket}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client')
            await createClient().auth.signOut()
            window.location.href = '/auth/giris'
          }}
          className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 block w-full text-left"
        >
          Çıkış Yap →
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
