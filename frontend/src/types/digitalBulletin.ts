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
  /** 이 디지털본이 어느 주보(bulletins.id)에서 왔는지 — 예전 저장분은 null */
  bulletin_id?: number | null
  updated_at?: string
}

/** 지난 주보 목록 한 줄 */
export interface DigitalBulletinIssueSummary {
  bulletin_id: number
  date: string
}

export interface DigitalBulletinIssueResponse {
  bulletin_id: number
  data: BulletinData
  updated_at?: string | null
}

/** 내 주보 알림 설정. dawn_days 는 월요일부터 7자리 '0'/'1' */
export interface BulletinNotifySettings {
  new_bulletin: boolean
  item_reminders: boolean
  service: boolean
  services: string[]
  dawn: boolean
  dawn_days: string
}

/** 챙길 일 알림 한 건 — remind_at 은 +09:00 ISO */
export interface BulletinReminder {
  item_key: string
  title: string
  body: string
  remind_at: string
}

/** 종이 주보를 AI 가 읽어 만든 초안(관리자 전용) — 없으면 data 가 null */
export interface DigitalBulletinDraftResponse {
  data: BulletinData | null
  bulletin_id: number | null
  created_at?: string | null
}
