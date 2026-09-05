/**
 * 도메인별 React Query 키 팩토리 (훅 파일에 팩토리가 없는 도메인만 여기 모은다).
 *
 * 규칙: 화면·훅·유틸 어디서도 `['profile', 'detail']` 같은 리터럴 배열을 직접 쓰지 않는다.
 * - invalidate/cancel 은 prefix 팩토리(all·lists 등)로,
 * - setQueryData/getQueryData 는 화면 쿼리와 "완전히 같은" 키 팩토리로.
 *   (일부 인자를 빼먹은 짧은 키에 setQueryData 하면 존재하지 않는 쿼리에 써져 조용히 무효가 된다)
 * 기도(prayerKeys)·그룹(groupKeys)·커뮤니티(communityKeys) 등은 각 훅 파일의 팩토리를 쓴다.
 */

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

export const sermonKeys = {
  all: ['sermons'] as const,
  /** includeContent=false 는 전문 없는 경량 목록 — 키를 분리해 전문 포함 캐시와 섞이지 않게 한다 */
  list: (skip: number, limit: number, includeContent = true) =>
    includeContent ? ([...sermonKeys.all, skip, limit] as const) : ([...sermonKeys.all, skip, limit, 'light'] as const),
  infinite: () => [...sermonKeys.all, 'infinite'] as const,
  detail: (sermonId: number) => ['sermon', sermonId] as const,
  bibleReferences: (sermonId: number | null) => ['sermon-bible-references', sermonId] as const,
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
