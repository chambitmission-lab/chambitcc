// 설교 관련 타입 정의

// 성경 구절 참조 타입
export interface BibleReference {
  id: number
  book_number: number
  book_name: string
  chapter: number
  verse: number
  timestamp: number
  segment_text: string
  reference_text: string
  bible_text?: string
  bible_book_name_ko?: string
  bible_book_name_en?: string
}

// 트랜스크립트 분석 응답 타입
export interface TranscriptAnalysisResponse {
  sermon_id: number
  total_references: number
  references_saved: number
  summary_generated: boolean
  summary: string
  references: BibleReference[]
}

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
  bible_references?: BibleReference[]
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

export interface SermonUpdateRequest {
  title?: string
  pastor?: string
  bible_verse?: string
  sermon_date?: string
  content?: string
  audio_url?: string
  video_url?: string
  thumbnail_url?: string
}

export interface AudioUploadResponse {
  audio_url: string
  message: string
}

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'
