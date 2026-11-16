// 공동(주간) 기도제목 타입
export interface WeeklyPrayerItem {
  id?: number
  sort_order?: number
  title: string
  body?: string | null
  scripture?: string | null
  amen_count?: number
  is_amened?: boolean
}

export interface WeeklyPrayerAmenResponse {
  item_id: number
  is_amened: boolean
  amen_count: number
}

export interface WeeklyPrayer {
  id: number
  week_date: string // YYYY-MM-DD (주일 날짜)
  title: string
  is_published: boolean
  items: WeeklyPrayerItem[]
  prayed_user_count?: number
  created_at?: string | null
  updated_at?: string | null
}

export interface WeeklyPrayerListItem {
  id: number
  week_date: string
  title: string
  is_published: boolean
  item_count: number
  /** 첫 기도 한 줄 — 백엔드 배포 전에는 없을 수 있다 */
  preview?: string | null
  /** 그 주 아멘 합계 — 백엔드 배포 전에는 없을 수 있다 */
  amen_total?: number
}

export interface WeeklyPrayerCreateRequest {
  week_date: string
  title?: string
  is_published?: boolean
  items: WeeklyPrayerItem[]
}

export interface WeeklyPrayerUpdateRequest {
  week_date?: string
  title?: string
  is_published?: boolean
  items?: WeeklyPrayerItem[]
}
