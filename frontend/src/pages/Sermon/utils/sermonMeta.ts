// 설교 목록 화면용 메타 유틸 — 성구 참조 파싱 · 예배 유형 유추 · 월별 그룹핑
import type { Sermon } from '../../../types/sermon'

export interface ParsedReference {
  book: string
  chapter: number
  verse: number | null
  verseEnd: number | null
}

// "요한복음 12장 20~33절" / "요한복음 3:16" / "요한1서 2장" 등을 허용.
// 장 번호 뒤에 반드시 '장' 또는 ':'가 와야 "요한1서" 같은 책 이름의 숫자를 장으로 오인하지 않는다.
const REFERENCE_RE = /^(.+?)\s*(\d+)\s*(?:장|:)\s*(\d+)?(?:\s*[~\-–—〜]\s*(\d+))?\s*절?/

export const parseBibleReference = (raw: string): ParsedReference | null => {
  if (!raw) return null
  const match = raw.trim().match(REFERENCE_RE)
  if (!match) return null

  const book = match[1].trim()
  const chapter = parseInt(match[2], 10)
  if (!book || !chapter) return null

  return {
    book,
    chapter,
    verse: match[3] ? parseInt(match[3], 10) : null,
    verseEnd: match[4] ? parseInt(match[4], 10) : null,
  }
}

// "요한복음 12:20–33" 형태로 정돈된 참조 문자열
export const formatReference = (parsed: ParsedReference): string => {
  const { book, chapter, verse, verseEnd } = parsed
  if (verse == null) return `${book} ${chapter}장`
  if (verseEnd == null) return `${book} ${chapter}:${verse}`
  return `${book} ${chapter}:${verse}–${verseEnd}`
}

// 예배 유형은 별도 필드가 없어 제목 관례에서 유추한다 (기존 데이터에도 소급 적용)
export const WORSHIP_TYPES = ['주일예배', '수요예배', '새벽기도', '금요기도', '특별예배'] as const
export type WorshipType = (typeof WORSHIP_TYPES)[number]

export const deriveWorshipType = (title: string): WorshipType => {
  if (/주일|성수/.test(title)) return '주일예배'
  if (/수요/.test(title)) return '수요예배'
  if (/새벽/.test(title)) return '새벽기도'
  if (/금요|철야/.test(title)) return '금요기도'
  return '특별예배'
}

// 제목 끝의 "(3월 15일)" 류 날짜 꼬리표 제거 — 날짜는 날짜 칩이 담당
export const stripTitleDate = (title: string): string =>
  title.replace(/\s*[(（]\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*[)）]\s*$/, '').trim()

// YouTube URL/ID에서 video ID 추출 — 상세·폼에서 공용
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // 직접 Video ID인 경우
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }

  return null
}

export const youtubeThumbnailUrl = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

export interface SermonMonthGroup {
  key: string
  label: string
  items: Sermon[]
}

export const groupSermonsByMonth = (sermons: Sermon[]): SermonMonthGroup[] => {
  const groups: SermonMonthGroup[] = []
  let current: SermonMonthGroup | null = null

  for (const sermon of sermons) {
    const date = new Date(sermon.sermon_date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!current || current.key !== key) {
      current = {
        key,
        label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
        items: [],
      }
      groups.push(current)
    }
    current.items.push(sermon)
  }

  return groups
}
