export type UserRole = 'admin' | 'imalatci_temsilci' | 'proje_temsilci'
export type CustomerType = 'imalatci' | 'proje'
export type ProjectStatus = 'devam_ediyor' | 'teklif_asamasinda' | 'numune_asamasinda' | 'karar_bekleniyor' | 'kazanildi' | 'kaybedildi' | 'beklemede' | 'iptal'
export type VisitType = 'rutin' | 'teklif' | 'numune' | 'teknik' | 'tahsilat' | 'tanitim'
export type ProjectType = 'konut' | 'ticari' | 'otel' | 'saglik' | 'egitim' | 'endustri' | 'diger'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  devam_ediyor: 'Devam Ediyor', teklif_asamasinda: 'Teklif Aşamasında',
  numune_asamasinda: 'Numune Aşamasında', karar_bekleniyor: 'Karar Bekleniyor',
  kazanildi: 'Kazanıldı', kaybedildi: 'Kaybedildi', beklemede: 'Beklemede', iptal: 'İptal'
}

export const COMPETITOR_BRANDS = [
  'Laminam','Dekton','Neolith','Atlas','Materia','Infinity','Level','Saime',
  'Massimo','Lamar','Inalco','Florim','Kale','Kütahya','Anatolia','Maxtone',
  'Kuvars','Doğaltaş','Diğer'
] as const
export type CompetitorBrand = typeof COMPETITOR_BRANDS[number]

export interface User {
  id: string; email: string; role: UserRole; full_name: string
  phone?: string; avatar_url?: string; created_at: string; updated_at: string
}
export interface Customer {
  id: string; firma_adi: string; kayit_tipi: CustomerType; sorumlu_id: string
  sorumlu?: User; sehir: string; bolge?: string; yetkili_kisi?: string
  telefon?: string; email?: string; adres?: string
  aylik_toplam_plaka_pot: number; aylik_toplam_m2_pot: number; aylik_toplam_ciro_pot: number
  kullandigi_markalar?: string[]; laminam_kullaniyor: boolean
  laminam_mevcut_plaka: number; laminam_mevcut_m2: number; laminam_mevcut_ciro: number
  laminam_pot_plaka: number; laminam_pot_m2: number; laminam_pot_ciro: number
  laminam_payi_yuzde?: number; segment?: string; oncelik_skoru?: number
  notlar?: string; created_at: string; updated_at: string
  son_ziyaret_tarihi?: string; toplam_ziyaret?: number
}
export interface Project {
  id: string; customer_id?: string; customer?: Customer; proje_adi: string
  proje_tipi: ProjectType; guncel_durum: ProjectStatus; sorumlu_id: string
  sorumlu?: User; karar_verici?: string; mimar?: string; yuklenici?: string
  proje_buyuklugu_m2?: number; tahmini_kapanis_tarihi?: string
  teklif_verildi: boolean; numune_verildi: boolean; teknik_calisma_yapildi: boolean
  kaybedilen_marka?: CompetitorBrand; kazanilan_ciro?: number
  kazanilan_plaka?: number; kazanilan_m2?: number
  pot_ciro: number; pot_plaka: number; pot_m2: number
  notlar?: string; created_at: string; updated_at: string
}
export interface Visit {
  id: string; customer_id: string; customer?: Customer; temsilci_id: string
  temsilci?: User; tarih: string; saat?: string; ziyaret_tipi: VisitType
  amac?: string; gerceklesti: boolean; not?: string; created_at: string
}
export interface WeeklyReport {
  id: string; temsilci_id: string; temsilci?: User; hafta_baslangic: string
  toplam_ziyaret: number; benzersiz_musteri: number; satis_tutari_eur: number
  tahsilat_tutari_tl: number; verilen_teklif: number; onaylanan_siparis: number
  yeni_musteri: number; karar_verici_gorusme: number; urun_sunumu: number
  fiyat_konusulan: number; numune_konusulan: number; sonraki_adim_net: number
  genel_degerlendirme?: string; hedef_durumu?: string
  rakip_aktiviteleri?: string; genel_yorum?: string
  karar_verici_orani?: number; sonraki_adim_orani?: number
  ziyaret_teklif_orani?: number; teklif_siparis_orani?: number
  created_at: string; updated_at: string
}
