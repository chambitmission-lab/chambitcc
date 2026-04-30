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
  groups: GroupItem[]
  weeklySchedule: WeeklyScheduleItem[]
}

export interface DigitalBulletinResponse {
  data: BulletinData
  updated_at?: string
}
