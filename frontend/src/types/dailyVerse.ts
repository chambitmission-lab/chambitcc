// 오늘의 말씀 타입 정의
export interface DailyVerse {
  id: number
  verse_text: string
  verse_reference: string
  verse_date: string
  created_at: string
  updated_at: string
}

export interface DailyVerseResponse {
  verse_text: string
  verse_reference: string
  verse_date: string
  id: number
  created_at: string
  updated_at: string
}

export interface CreateDailyVerseRequest {
  verse_text: string
  verse_reference: string
  verse_date?: string  // 선택 (기본값: 오늘)
}

export interface UpdateDailyVerseRequest {
  verse_text: string
  verse_reference: string
}
