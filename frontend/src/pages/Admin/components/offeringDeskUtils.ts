// 온라인 헌금 관리 데스크 규칙 — 실제 화면과 dev 미리보기가 같이 쓴다
import type { OfferingAccount, OfferingGuide } from '../../../types/offering'

/** 왼쪽 목록에서 고른 것 — 안내 문구(한 장) 또는 계좌 하나 */
export type OfferingSel = { kind: 'guide' } | { kind: 'account'; id: number }

/** 안내 문구 칸 — 성도 화면에 나오는 순서. 빈 칸('')은 화면에서 그 줄을 숨긴다 */
export const GUIDE_FIELDS = [
  ['title_ko', '제목'],
  ['intro_ko', '안내 글'],
  ['method_title_ko', '입금 방법 제목'],
  ['deposit_format_ko', '입금자명 형식'],
  ['deposit_desc_ko', '입금 설명'],
  ['note_ko', '유의사항'],
  ['verse_text_ko', '말씀'],
  ['verse_ref_ko', '말씀 출처'],
] as const satisfies readonly (readonly [keyof OfferingGuide, string])[]

/** 성도가 꼭 봐야 하는 칸 — 비면 '채울 곳' */
const KEY_GUIDE_FIELDS: (keyof OfferingGuide)[] = ['deposit_format_ko', 'note_ko']

export const guideMissing = (g: OfferingGuide | null | undefined) =>
  KEY_GUIDE_FIELDS.filter((k) => !String(g?.[k] ?? '').trim()).map(
    (k) => GUIDE_FIELDS.find(([f]) => f === k)?.[1] ?? k,
  )

/** 예금주가 비면 이체 화면에서 확인할 수가 없다 */
export const accountMissing = (a: OfferingAccount) => !a.holder_ko?.trim()
