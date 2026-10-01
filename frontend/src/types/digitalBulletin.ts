// 디지털 주보 타입 정의

export interface WorshipServiceItem {
  name: string
  time: string
  preacher: string
}

export interface SermonInfo {
  title: string
  subtitle: string
}

export interface WorshipSection {
  schedule: WorshipServiceItem[]
  offering: string
  prayer: string
  sermon: SermonInfo
}

export interface AnnouncementItem {
  title: string
  content: string
}

/**
 * 교회 소식 아래 자유 안내 블록 — 종이 주보 하단의 요약 정보(당회 결정사항·헌금 계좌·봉사표 등).
 * kind 에 따라 쓰는 필드만 다르다: list=items / table=columns+rows / note=content
 */
export type ExtraBlockKind = 'list' | 'table' | 'note'

export interface ExtraBlock {
  kind: ExtraBlockKind
  title: string
  items: string[]
  columns: string[]
  rows: string[][]
  content: string
}

export interface GroupItem {
  name: string
  leader: string
  members: number
  meeting: string
}

export interface WeeklyScheduleItem {
  day: string
  event: string
  time: string
  location: string
}

export interface BulletinData {
  date: string
  title: string
  subtitle: string
  worship: WorshipSection
  announcements: AnnouncementItem[]
  /** 예전 저장분엔 없음 — 읽을 때 `?? []` */
  extras?: ExtraBlock[]
  groups: GroupItem[]
  weeklySchedule: WeeklyScheduleItem[]
}

export interface DigitalBulletinResponse {
  data: BulletinData
  updated_at?: string
}
