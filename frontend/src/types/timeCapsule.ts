// 타임캡슐 타입 정의 — 개봉 전에는 서버가 content를 내려주지 않는다
export type CapsuleType = 'self' | 'invite'
export type CapsuleRole = 'self' | 'sender' | 'recipient'

export interface CapsuleSnapshotStats {
  meditations?: number
  verses_read?: number
  prayers?: number
  thanks?: number
  meditation_streak?: number
}

export interface CapsuleSnapshot {
  season_label?: string
  verse_reference?: string
  verse_text?: string
  sealed_date?: string
  stats?: CapsuleSnapshotStats
}

export interface CapsuleSummary {
  id: number
  capsule_type: CapsuleType
  role: CapsuleRole
  sender_name: string
  recipient_name: string | null
  title: string | null
  open_at: string
  open_label: string | null
  sealed_at: string
  opened_at: string | null
  openable: boolean
  has_audio: boolean
  has_message: boolean
  claimed: boolean
  invite_code: string | null // 발신자에게만 내려온다
}

export interface CapsuleListResponse {
  sealed: CapsuleSummary[]
  arrived: CapsuleSummary[]
}

export interface CapsulePreview {
  sender_name: string
  recipient_name: string | null
  open_at: string
  open_label: string | null
  sealed_at: string
  has_audio: boolean
  openable: boolean
  claimed: boolean
  is_mine: boolean
}

export interface CapsuleContent {
  title: string | null
  message: string | null
  audio_url: string | null
  audio_duration: number | null
  snapshot: CapsuleSnapshot | null
}

export interface CapsuleDetail extends CapsuleSummary {
  content: CapsuleContent | null
}

export interface CapsuleCreateRequest {
  capsuleType: CapsuleType
  openDate: string // YYYY-MM-DD
  openLabel?: string
  message?: string
  title?: string
  recipientName?: string
  clientSnapshot?: Pick<CapsuleSnapshot, 'season_label' | 'verse_reference' | 'verse_text'>
  audioBlob?: Blob | null
  audioDuration?: number
}
