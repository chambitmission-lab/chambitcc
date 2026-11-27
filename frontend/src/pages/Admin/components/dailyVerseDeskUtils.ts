// 오늘의 말씀 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { DailyVerse } from '../../../types/dailyVerse'

/** 지금 홈에 걸린 말씀 (서버는 is_active 를 1/0 정수로 준다) */
export const isLiveVerse = (v: DailyVerse) => !!v.is_active

/** 보관함 — 지금 걸린 말씀을 뺀 나머지, 검색(구절·말씀) 후 최근 등록 순 */
export const archiveOf = (verses: DailyVerse[], searchTerm: string) => {
  const q = searchTerm.trim().toLowerCase()
  return verses
    .filter((v) => !isLiveVerse(v))
    .filter((v) => !q || v.verse_reference.toLowerCase().includes(q) || v.verse_text.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
