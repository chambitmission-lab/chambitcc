// 설교 관련 타입 정의
export interface Sermon {
  id: number
  title: string
  pastor: string
  bible_verse: string
  sermon_date: string
  content: string
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  views: number
  is_published: number
  created_at: string
  updated_at: string
}

export interface SermonCreateRequest {
  title: string
  pastor: string
  bible_verse: string
  sermon_date: string
  content: string
  audio_url?: string
  video_url?: string
  thumbnail_url?: string
}

export interface AudioUploadResponse {
  audio_url: string
  message: string
}

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'
