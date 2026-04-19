'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function KorunanSayfa({ children }: { children: React.ReactNode }) {
  const [hazir, setHazir] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth/giris')
      else setHazir(true)
    })
  }, [])

  if (!hazir) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-400">Yükleniyor...</p>
    </div>
  )

  return <>{children}</>
}
