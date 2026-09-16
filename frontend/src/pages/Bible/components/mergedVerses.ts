/**
 * 절 병합 구간 도우미
 *
 * 개역 계열은 히브리어·헬라어 절 경계가 한국어 어순과 맞지 않는 몇 군데에서
 * 두세 절을 묶어 '18,19'처럼 번호 하나에 본문 하나로 인쇄한다(신 6:18-19,
 * 렘 32:3-5, 롬 9:1-2 등 9곳). 우리 본문 데이터는 1절=1행이라 뒤따르는 절
 * 자리에 '(18절과 같음)' 같은 편집자 메모가 들어 있었다 — 성경책에 없는 표기다.
 *
 * 백엔드(app/lib/bible_merged_verses.py)가 그 행의 본문을 비우고 표기 정보를
 * 실어 보낸다. 화면에서는 자리표시자 행을 감추고, 묶음 첫 절에 범위를 찍는다.
 * 행 자체는 남겨 둔다 — verse_id 에 북마크·묵상 노트·읽음 기록이 매달려 있다.
 */
import type { BibleVerse } from '../../../types/bible'

type VerseLike = Pick<BibleVerse, 'verse'> & Partial<Pick<BibleVerse, 'verse_label' | 'merged_into'>>

/** 화면에 그릴 절만 — 앞 절이 품고 있는 자리표시자 행은 걸러낸다 */
export const visibleVerses = <T extends { merged_into?: number | null }>(verses: T[]): T[] =>
  verses.filter((v) => !v.merged_into)

/** 번호 자리에 찍을 값 — 묶음 첫 절은 '18-19', 보통은 절 번호 */
export const verseNumberLabel = (v: VerseLike): string =>
  v.verse_label ? v.verse_label : String(v.verse)

/** 묶음에서 이어지는 절(렘 32:4) — 번호를 다시 찍지 않는다 */
export const isMergedContinuation = (v: VerseLike): boolean => v.verse_label === ''
