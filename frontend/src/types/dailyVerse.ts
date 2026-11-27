// 오늘의 말씀 타입 정의
//
// 백엔드(daily_verses)는 날짜별 예약이 아니라 "한 번에 하나만 걸리는" 구조다 —
// 새로 등록하면 그 말씀이 바로 걸리고(is_active=1) 나머지는 내려간다. 지난 말씀은
// PUT /daily-verse/{id}/activate 로 다시 걸 수 있다. 게시일(verse_date) 컬럼은 없다.
export interface DailyVerse {
  id: number
  verse_text: string
  verse_reference: string
  /** 1 = 지금 걸린 말씀 (서버는 정수로 준다) */
  is_active: number | boolean
  created_at: string
  updated_at: string
}

export interface DailyVerseResponse {
  verse_text: string
  verse_reference: string
  id: number
  created_at: string
  updated_at: string
}

export interface CreateDailyVerseRequest {
  verse_text: string
  verse_reference: string
}

export interface UpdateDailyVerseRequest {
  verse_text: string
  verse_reference: string
}
