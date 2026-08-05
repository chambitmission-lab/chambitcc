// 타임캡슐 타입 정의 — 개봉 전에는 서버가 content를 내려주지 않는다
// self: 미래의 나 / invite: 초대 링크 전달 / direct: 앱 사용자에게 바로
export type CapsuleType = 'self' | 'invite' | 'direct'
export type CapsuleRole = 'self' | 'sender' | 'recipient'

// 받는 사람 검색 결과 (direct 캡슐 수신자 선택용)
export interface CapsuleRecipient {
  id: number
  display_name: string
  username: string
  avatar_url: string | null
}

export interface CapsuleSnapshotStats {
  meditations?: number
  verses_read?: number
  prayers?: number
  thanks?: number
  meditation_streak?: number
}

// 기도→묵상→캡슐 흐름으로 봉인된 그날의 기도 (서버가 봉인 시점에 채운다)
export interface CapsuleSnapshotPrayer {
  id?: number
  title?: string
  content?: string
  verses?: { reference: string; text: string }[]
}

export interface CapsuleSnapshot {
  season_label?: string
  verse_reference?: string
  verse_text?: string
  sealed_date?: string
  stats?: CapsuleSnapshotStats
  prayer?: CapsuleSnapshotPrayer
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
  photo_count: number // 동봉 사진 수 (내용은 개봉 전 비공개)
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
  photo_count: number
  openable: boolean
  claimed: boolean
  is_mine: boolean
}

export interface CapsulePhoto {
  url: string
  caption: string | null
}

export interface CapsuleContent {
  title: string | null
  message: string | null
  audio_url: string | null
  audio_duration: number | null
  photos: CapsulePhoto[]
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
  recipientUserId?: number // direct 전용 — 받는 앱 사용자
  prayerId?: number // 기도→캡슐 흐름 — 그날의 기도를 함께 봉인
  clientSnapshot?: Pick<CapsuleSnapshot, 'season_label' | 'verse_reference' | 'verse_text'>
  audioBlob?: Blob | null
  audioDuration?: number
  photos?: CapsuleDraftPhoto[]
}

// 작성 중 첨부한 사진 — 리사이즈된 Blob + 프리뷰 URL + 캡션
export interface CapsuleDraftPhoto {
  blob: Blob
  previewUrl: string
  caption: string
}
