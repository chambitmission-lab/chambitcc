/**
 * 도메인별 React Query 키 팩토리 (훅 파일에 팩토리가 없는 도메인만 여기 모은다).
 *
 * 규칙: 화면·훅·유틸 어디서도 `['profile', 'detail']` 같은 리터럴 배열을 직접 쓰지 않는다.
 * - invalidate/cancel 은 prefix 팩토리(all·lists 등)로,
 * - setQueryData/getQueryData 는 화면 쿼리와 "완전히 같은" 키 팩토리로.
 *   (일부 인자를 빼먹은 짧은 키에 setQueryData 하면 존재하지 않는 쿼리에 써져 조용히 무효가 된다)
 * 기도(prayerKeys)·그룹(groupKeys)·커뮤니티(communityKeys) 등은 각 훅 파일의 팩토리를 쓴다.
 *
 * 이 파일은 런타임 import 가 없다(타입만). utils 모듈(notificationStream 등)이 훅 모듈과의
 * 순환 import 걱정 없이 키를 가져다 쓸 수 있게 유지한다.
 */
import type { NoteFilters } from '../api/pastor'
import type { EmotionTag, TimeOfDay } from '../types/meditation'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  stats: () => [...profileKeys.all, 'stats'] as const,
  myPrayers: () => [...profileKeys.all, 'my-prayers', 'infinite'] as const,
  prayingFor: () => [...profileKeys.all, 'praying-for', 'infinite'] as const,
  myReplies: () => [...profileKeys.all, 'my-replies', 'infinite'] as const,
}

/** 전역 크롬(헤더 아바타)용 가벼운 "나" 정보 — profile 과 분리해 길게 캐시한다 */
export const meKeys = {
  all: ['me'] as const,
  identity: () => [...meKeys.all, 'identity'] as const,
}

export const bibleKeys = {
  all: ['bible'] as const,
  books: () => [...bibleKeys.all, 'books'] as const,
  chapter: (bookNumber: number, chapter: number) => [...bibleKeys.all, 'chapter', bookNumber, chapter] as const,
  chapterInfinites: () => [...bibleKeys.all, 'chapter', 'infinite'] as const,
  chapterInfinite: (bookNumber: number, chapter: number) =>
    [...bibleKeys.chapterInfinites(), bookNumber, chapter] as const,
  verse: (book: number | string, chapter: number, verse: number) =>
    [...bibleKeys.all, 'verse', book, chapter, verse] as const,
  searches: () => [...bibleKeys.all, 'search'] as const,
  search: (keyword: string, limit: number) => [...bibleKeys.searches(), keyword, limit] as const,
  searchInfinite: (keyword: string, testament?: 'OLD' | 'NEW' | null, bookNumber?: number | null) =>
    [...bibleKeys.searches(), 'infinite', keyword, testament ?? 'ALL', bookNumber ?? 0] as const,
  storyVerses: (episodeId: string | number) => [...bibleKeys.all, 'story-verses', episodeId] as const,
}

/** 함께 읽기 — 실시간 읽기 현황 + 절 묵상 나눔. SSE 핸들러가 이 키로 캐시를 직접 갱신한다 */
export const readingTogetherKeys = {
  all: ['readingTogether'] as const,
  presence: (bookNumber: number, chapter: number) =>
    [...readingTogetherKeys.all, 'presence', bookNumber, chapter] as const,
  /** 홈 카드 — 지금 붐비는 장 + 오늘 최다 장 */
  live: () => [...readingTogetherKeys.all, 'live'] as const,
  summary: (bookNumber: number, chapter: number) =>
    [...readingTogetherKeys.all, 'summary', bookNumber, chapter] as const,
  reflections: (verseId: number) => [...readingTogetherKeys.all, 'reflections', verseId] as const,
  replies: (reflectionId: number) => [...readingTogetherKeys.all, 'replies', reflectionId] as const,
}

export const sermonKeys = {
  all: ['sermons'] as const,
  /** includeContent=false 는 전문 없는 경량 목록 — 키를 분리해 전문 포함 캐시와 섞이지 않게 한다 */
  list: (skip: number, limit: number, includeContent = true) =>
    includeContent ? ([...sermonKeys.all, skip, limit] as const) : ([...sermonKeys.all, skip, limit, 'light'] as const),
  infinite: () => [...sermonKeys.all, 'infinite'] as const,
  detail: (sermonId: number) => ['sermon', sermonId] as const,
  bibleReferences: (sermonId: number | null) => ['sermon-bible-references', sermonId] as const,
  /** 내가 붙잡은 한 줄 전체 — sermonKeys.all 무효화(설교 등록·수정)에 휩쓸리지 않게 별도 루트 */
  takeaways: () => ['sermon-takeaways'] as const,
}

export const columnKeys = {
  all: ['columns'] as const,
  list: (q: string) => [...columnKeys.all, q] as const,
}

export const dailyVerseKeys = {
  all: ['dailyVerse'] as const,
  today: () => [...dailyVerseKeys.all, 'today'] as const,
  /** ⌘K·랜딩 데모가 쓰는 별도 조회 */
  current: () => ['daily-verse', 'current'] as const,
}

export const weeklyPrayerKeys = {
  all: ['weeklyPrayer'] as const,
  homeBanner: () => [...weeklyPrayerKeys.all, 'current', 'homeBanner'] as const,
}

export const prayerStatsKeys = {
  all: ['prayer-stats'] as const,
  weekly: () => [...prayerStatsKeys.all, 'weekly'] as const,
  summary: () => [...prayerStatsKeys.all, 'summary'] as const,
  answeredTotal: () => [...prayerStatsKeys.all, 'answered-total'] as const,
}

export const worshipKeys = {
  all: ['worship-services'] as const,
  services: () => [...worshipKeys.all, 'all'] as const,
}

/** ⌘K 커맨드 팔레트 검색 — main.tsx 가 'cmdk' 루트를 persist 에서 제외한다 */
export const cmdkKeys = {
  all: ['cmdk'] as const,
  bible: (q: string) => [...cmdkKeys.all, 'bible', q] as const,
  sermon: (q: string) => [...cmdkKeys.all, 'sermon', q] as const,
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'infinite'] as const,
  popups: () => [...notificationKeys.all, 'popups'] as const,
  archive: () => [...notificationKeys.all, 'archive'] as const,
}

/** 신앙 여정 — 묵상 기록 등 다른 도메인의 쓰기가 `all` 로 통째 무효화한다 */
export const growthKeys = {
  all: ['growth'] as const,
  summary: ['growth', 'summary'] as const,
  timeline: ['growth', 'timeline'] as const,
  recent: ['growth', 'recent'] as const,
  insight: ['growth', 'insight'] as const,
}

/** 홈 오늘의 묵상 카드 — 날짜·시간대·감정까지 모두 키에 들어간다(setQueryData 는 card 로) */
export const meditationKeys = {
  today: () => ['meditation', 'today'] as const,
  card: (dateKey: string, timeOfDay: TimeOfDay, emotion?: EmotionTag) =>
    [...meditationKeys.today(), dateKey, timeOfDay, emotion ?? null] as const,
}

export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
}

export const adminKeys = {
  all: ['admin'] as const,
  pushHistory: () => [...adminKeys.all, 'push-history'] as const,
  electionRoster: () => [...adminKeys.all, 'users', 'election-roster'] as const,
  /** 기도 묵상 구절 추천 모드 등 서버 설정 */
  settings: () => ['adminSettings'] as const,
  /** 돌봄 레이더(관리자 범위) — main.tsx 가 이 루트를 persist 에서 제외한다 */
  careRadar: (quietDays: number) => ['admin-care-radar', quietDays] as const,
}

/**
 * 목회자 영역(/pastor). 루트는 전부 'pastor-' 로 시작해야 한다 — main.tsx 의 persist 필터가
 * 이 접두사로 localStorage 저장을 제외한다(맡긴 기도·심방 메모·연락처 보호).
 * 인자 없는 팩토리(members·outlineAll·reports…)는 invalidate 용 prefix 다.
 */
export const pastorKeys = {
  home: () => ['pastor-home'] as const,
  careRadar: (quietDays: number) => ['pastor-care-radar', quietDays] as const,
  roster: () => ['pastor-roster'] as const,
  members: () => ['pastor-member'] as const,
  member: (memberId: number) => [...pastorKeys.members(), memberId] as const,
  briefing: (memberId: number) => ['pastor-briefing', memberId] as const,
  visits: () => ['pastor-visits'] as const,
  agenda: () => ['pastor-agenda'] as const,
  suggestions: () => ['pastor-suggestions'] as const,
  reports: () => ['pastor-report'] as const,
  report: (week: number) => [...pastorKeys.reports(), week] as const,
  sermonPrep: (years: number) => ['pastor-sermon-prep', years] as const,
  sermonOptions: () => ['pastor-sermon-options'] as const,
  /** 설교 메모 목록 — 설교 준비 요약 카드와 메모장 첫 화면이 같은 캐시를 쓴다 */
  notes: () => ['pastor-notes'] as const,
  noteList: (f: NoteFilters = {}) =>
    [...pastorKeys.notes(), f.q?.trim() ?? '', f.kind ?? null, f.tag ?? null, f.topic ?? null, f.book ?? null, !!f.unused] as const,
  relatedNotes: () => ['pastor-note-related'] as const,
  relatedNotesFor: (passage: string) => [...pastorKeys.relatedNotes(), passage] as const,
  noteAnalyze: (body: string, passage: string) => ['pastor-note-analyze', body, passage] as const,
  outlines: () => ['pastor-outlines'] as const,
  outlineAll: () => ['pastor-outline'] as const,
  outline: (outlineId: number) => [...pastorKeys.outlineAll(), outlineId] as const,
}
