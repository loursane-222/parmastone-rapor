import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatEuro(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(tutar)
}
export function formatTL(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(tutar)
}
export function formatSayi(sayi: number): string {
  return new Intl.NumberFormat('tr-TR').format(sayi)
}
export function formatTarih(tarih: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(tarih))
}
export function formatTarihKisa(tarih: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tarih))
}
export function buHaftaninBaslangici(): string {
  const bugun = new Date()
  const gun = bugun.getDay()
  const fark = gun === 0 ? -6 : 1 - gun
  const pazartesi = new Date(bugun)
  pazartesi.setDate(bugun.getDate() + fark)
  return pazartesi.toISOString().split('T')[0]
}
export function projeStatusRengi(durum: string): string {
  const renkler: Record<string, string> = {
    devam_ediyor: 'bg-blue-100 text-blue-800',
    teklif_asamasinda: 'bg-yellow-100 text-yellow-800',
    numune_asamasinda: 'bg-purple-100 text-purple-800',
    karar_bekleniyor: 'bg-orange-100 text-orange-800',
    kazanildi: 'bg-green-100 text-green-800',
    kaybedildi: 'bg-red-100 text-red-800',
    beklemede: 'bg-gray-100 text-gray-800',
    iptal: 'bg-gray-100 text-gray-500',
  }
  return renkler[durum] || 'bg-gray-100 text-gray-800'
}
export function hesaplaPerformansPuani(r: {
  toplam_ziyaret: number; karar_verici_gorusme: number
  sonraki_adim_net: number; onaylanan_siparis: number; yeni_musteri: number
}): number {
  let p = 0
  p += Math.min(25, r.toplam_ziyaret * 2)
  if (r.toplam_ziyaret > 0) {
    p += Math.min(20, (r.karar_verici_gorusme / r.toplam_ziyaret) * 40)
    p += Math.min(20, (r.sonraki_adim_net / r.toplam_ziyaret) * 40)
  }
  p += Math.min(10, r.onaylanan_siparis * 5)
  p += Math.min(5, r.yeni_musteri * 2.5)
  return Math.round(p)
}
export function puanYorumu(puan: number): { mesaj: string; renk: string } {
  if (puan >= 85) return { mesaj: 'Mükemmel hafta! Harika performans 🏆', renk: 'text-green-600' }
  if (puan >= 70) return { mesaj: 'Çok iyi! Hedeflere yaklaşıyorsunuz 💪', renk: 'text-blue-600' }
  if (puan >= 55) return { mesaj: 'İyi hafta, karar verici görüşmelerini artırın 👍', renk: 'text-yellow-600' }
  if (puan >= 40) return { mesaj: 'Ortalama, ziyaret kalitesini yükseltme fırsatı var', renk: 'text-orange-600' }
  return { mesaj: 'Bu haftayı güçlendirelim — plan yapımı önemli', renk: 'text-red-600' }
}
export function aiStratejiOnerisi(params: {
  laminam_payi: number; pot_ciro: number; son_ziyaret_gun?: number | null
  guncel_durum?: string; kaybedilen_marka?: string
}): string[] {
  const oneriler: string[] = []
  const { laminam_payi, pot_ciro, son_ziyaret_gun, guncel_durum, kaybedilen_marka } = params
  if (guncel_durum === 'kaybedildi' && kaybedilen_marka)
    oneriler.push(`${kaybedilen_marka}'dan geri kazanım için referans proje ve teknik karşılaştırma sunun.`)
  if (laminam_payi < 20 && pot_ciro > 30000)
    oneriler.push('Laminam payı düşük — büyük format avantajlarını vurgulayan teknik sunum planlayın.')
  if (son_ziyaret_gun && son_ziyaret_gun > 45)
    oneriler.push('Uzun süredir ziyaret yapılmadı — bu hafta içinde karar vericiyle görüşme kurun.')
  if (guncel_durum === 'teklif_asamasinda')
    oneriler.push('Fiyat odağından çıkın — yaşam döngüsü maliyeti ve dayanıklılık argümanı kullanın.')
  if (oneriler.length === 0)
    oneriler.push('Rutin ziyaret ve ilişki güçlendirme — yeni ürünlerden haberdar edin.')
  return oneriler.slice(0, 3)
}
