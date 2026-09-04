// 공동 묵상방 — 추천 코스 · 오늘의 질문 풀 · 반응 칩 정의
// "뭘 읽을지"를 정하지 못해 막히는 초보자를 위해 코스 카드로 먼저 고르게 한다.
// 백엔드는 연속된 한 범위(책·시작장·끝장)만 받으므로 코스도 그 제약 안에서 고른다.
import type { RoomReactionKey } from '../../types/meditationRoom'

export interface RoomCourse {
  id: string
  /** 방 이름으로 그대로 들어간다 (나중에 수정 가능) */
  title: string
  emoji: string
  /** 카드에 보이는 한 줄 — 왜 이 본문인지 */
  tagline: string
  book_number: number
  book_name: string
  chapter_start: number
  chapter_end: number
  days: number
  /** 카드 아래 작은 설명 "요한복음 1–21장 · 21일" 은 자동 생성 */
}

export const ROOM_COURSES: RoomCourse[] = [
  {
    id: 'psalm23',
    title: '시편 23편, 천천히',
    emoji: '🕊️',
    tagline: '가장 사랑받는 시를 하루 두 절씩',
    book_number: 19, book_name: '시편', chapter_start: 23, chapter_end: 23, days: 3,
  },
  {
    id: 'john21',
    title: '요한복음 21일',
    emoji: '🌱',
    tagline: '예수님을 처음 만나는 가장 좋은 길',
    book_number: 43, book_name: '요한복음', chapter_start: 1, chapter_end: 21, days: 21,
  },
  {
    id: 'proverbs31',
    title: '잠언 하루 한 장',
    emoji: '⭐',
    tagline: '한 달, 날짜와 같은 장을 읽어요',
    book_number: 20, book_name: '잠언', chapter_start: 1, chapter_end: 31, days: 31,
  },
  {
    id: 'sermon-mount',
    title: '산상수훈 5일',
    emoji: '🔥',
    tagline: '마태복음 5–7장, 예수님의 가르침 한가운데',
    book_number: 40, book_name: '마태복음', chapter_start: 5, chapter_end: 7, days: 5,
  },
  {
    id: 'philippians',
    title: '빌립보서, 기쁨의 편지',
    emoji: '🌊',
    tagline: '감옥에서 쓴 가장 기쁜 편지를 일주일에',
    book_number: 50, book_name: '빌립보서', chapter_start: 1, chapter_end: 4, days: 7,
  },
  {
    id: 'ruth',
    title: '룻기 4일',
    emoji: '🌙',
    tagline: '하루 한 장, 짧고 따뜻한 이야기',
    book_number: 8, book_name: '룻기', chapter_start: 1, chapter_end: 4, days: 4,
  },
  {
    id: 'jonah',
    title: '요나 4일',
    emoji: '🌊',
    tagline: '도망친 사람을 끝까지 따라가시는 하나님',
    book_number: 32, book_name: '요나', chapter_start: 1, chapter_end: 4, days: 4,
  },
  {
    id: 'genesis11',
    title: '창세기 첫 이야기',
    emoji: '🌱',
    tagline: '창조부터 바벨까지, 1–11장을 2주에',
    book_number: 1, book_name: '창세기', chapter_start: 1, chapter_end: 11, days: 14,
  },
]

export const courseRangeLabel = (c: Pick<RoomCourse, 'book_name' | 'chapter_start' | 'chapter_end' | 'days'>) =>
  `${c.book_name} ${c.chapter_start === c.chapter_end ? `${c.chapter_start}장` : `${c.chapter_start}–${c.chapter_end}장`} · ${c.days}일`

export const DURATION_PRESETS = [3, 5, 7, 14, 21, 31]
export const EMOJI_PRESETS = ['🕊️', '🌱', '🔥', '🌙', '🌊', '⭐']

// ── 오늘의 질문 — 빈 텍스트 상자 대신 답할 거리를 준다 ──
export const DAILY_QUESTIONS = [
  '오늘 본문에서 마음에 남은 한 구절은 무엇인가요?',
  '이 본문에서 하나님은 어떤 분으로 보이셨나요?',
  '오늘 말씀이 지금 내 상황에 건네는 말이 있다면요?',
  '본문 속 인물 중 누구에게 가장 마음이 갔나요? 왜일까요?',
  '읽으면서 걸렸던 부분, 잘 이해되지 않은 부분이 있었나요?',
  '오늘 말씀을 한 문장으로 요약한다면요?',
  '이 말씀을 붙들고 오늘 하루 무엇을 해보고 싶나요?',
  '본문에서 감사할 것 하나를 찾는다면요?',
  '누군가에게 이 본문을 추천한다면 어떤 말을 덧붙일까요?',
  '오늘 말씀을 읽고 드리고 싶은 짧은 기도는요?',
  '본문에서 위로가 된 부분과 도전이 된 부분은 어디였나요?',
  '이 말씀이 우리 방 친구들에게도 필요한 이유가 있다면요?',
]

/** 방·일차마다 다른 질문을 결정적으로 고른다 (같은 방 같은 날은 모두 같은 질문) */
export const pickDailyQuestion = (roomId: number, day: number, offset = 0) =>
  DAILY_QUESTIONS[(roomId * 7 + day * 3 + offset) % DAILY_QUESTIONS.length]

// ── 반응 칩 — 글을 안 써도 한 단어로 참여 ──
export interface ReactionMeta {
  key: RoomReactionKey
  label: string
  /** "N명이 ___" 문장용 */
  sentence: string
}

export const REACTIONS: ReactionMeta[] = [
  { key: 'grace', label: '은혜', sentence: '은혜를 받았어요' },
  { key: 'comfort', label: '위로', sentence: '위로를 받았어요' },
  { key: 'challenge', label: '도전', sentence: '도전을 받았어요' },
  { key: 'question', label: '질문', sentence: '질문이 생겼어요' },
  { key: 'thanks', label: '감사', sentence: '감사가 넘쳤어요' },
]

export const reactionMeta = (key: string) => REACTIONS.find((r) => r.key === key)

// ── 날짜 소품 ──
export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → 로컬 Date (타임존 밀림 없이) */
export const parseYmd = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const formatMd = (ymd: string) => {
  const d = parseYmd(ymd)
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_KO[d.getDay()]})`
}
