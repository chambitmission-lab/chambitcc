// 예배 시간 관련 타입 정의

export interface WorshipService {
  id?: number
  order: number // 1부, 2부, 3부, 4부
  name: string // 예: "주일낮예배 1부"
  name_en?: string
  time: string // 예: "오전 7시 30분"
  time_en?: string
  location?: string // 예: "오렌엘 홀"
  location_en?: string
  subtitle?: string // 예: "(이른예배)"
  subtitle_en?: string
  is_active: boolean
  service_type: 'sunday' | 'weekday' // 주일 예배 or 평일 예배
}

export interface WeekdayService {
  id?: number
  name: string // 예: "새벽기도회"
  name_en?: string
  day: string // 예: "월-금"
  day_en?: string
  time: string // 예: "오전 5시 30분"
  time_en?: string
  time_detail?: string // 추가 시간 정보
  time_detail_en?: string
  location?: string
  location_en?: string
  is_active: boolean
}

export interface CreateWorshipServiceRequest {
  order: number
  name: string
  name_en?: string
  time: string
  time_en?: string
  location?: string
  location_en?: string
  subtitle?: string
  subtitle_en?: string
  service_type: 'sunday' | 'weekday'
}

export interface UpdateWorshipServiceRequest {
  order?: number
  name?: string
  name_en?: string
  time?: string
  time_en?: string
  location?: string
  location_en?: string
  subtitle?: string
  subtitle_en?: string
  is_active?: boolean
}
