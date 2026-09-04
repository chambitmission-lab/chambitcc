// 온라인 헌금 안내(/news?tab=offering) 타입 — offering_guide / offering_accounts
//
// 레거시 홈페이지의 "교회소식 > 온라인 헌금 안내" 한 장짜리 페이지를
// 안내 문구(단일 행) + 계좌 목록(다건)으로 편 구조.
// 텍스트는 education 과 같이 ko/en 컬럼 쌍. en 이 비면 ko 로 폴백한다.
// 빈 문자열('')은 '미확인' 규약 — 화면은 그 줄을 숨기고 지어내지 않는다.

export interface OfferingGuide {
  id: number
  title_ko: string
  title_en?: string | null
  intro_ko?: string | null
  intro_en?: string | null
  method_title_ko?: string | null
  method_title_en?: string | null
  /** 강조 칩으로 표시되는 입금자명 형식 — "헌금자명 + 핸드폰 뒷번호 4자리" */
  deposit_format_ko?: string | null
  deposit_format_en?: string | null
  deposit_desc_ko?: string | null
  deposit_desc_en?: string | null
  note_ko?: string | null
  note_en?: string | null
  verse_text_ko?: string | null
  verse_text_en?: string | null
  verse_ref_ko?: string | null
  verse_ref_en?: string | null
  updated_at?: string | null
}

export interface OfferingAccount {
  id: number
  label_ko: string
  label_en?: string | null
  bank_ko: string
  bank_en?: string | null
  /** 하이픈 포함 원문 — 복사 버튼이 하이픈을 걷어낸다 */
  account_number: string
  holder_ko?: string | null
  holder_en?: string | null
  note_ko?: string | null
  note_en?: string | null
  sort_order: number
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface OfferingData {
  guide: OfferingGuide
  accounts: OfferingAccount[]
}

export type GuideTextField =
  | 'title'
  | 'intro'
  | 'method_title'
  | 'deposit_format'
  | 'deposit_desc'
  | 'note'
  | 'verse_text'
  | 'verse_ref'

export type AccountTextField = 'label' | 'bank' | 'holder' | 'note'

export type GuideUpdatePayload = Partial<Omit<OfferingGuide, 'id' | 'updated_at'>>

export type AccountPayload = Partial<
  Omit<OfferingAccount, 'id' | 'sort_order' | 'created_at' | 'updated_at'>
> & { label_ko: string; bank_ko: string; account_number: string }

export type AccountUpdatePayload = Partial<
  Omit<OfferingAccount, 'id' | 'sort_order' | 'created_at' | 'updated_at'>
>

type Lang = 'ko' | 'en'

/** 현재 언어 값, 비어 있으면 한국어 폴백 (영문은 선택 입력) */
const pick = (row: Record<string, unknown>, field: string, language: Lang): string => {
  const primary = row[`${field}_${language}`]
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  const fallback = row[`${field}_ko`]
  return typeof fallback === 'string' ? fallback : ''
}

export const guideText = (
  guide: OfferingGuide | null | undefined,
  field: GuideTextField,
  language: Lang,
): string => (guide ? pick(guide as unknown as Record<string, unknown>, field, language) : '')

export const accountText = (
  account: OfferingAccount | null | undefined,
  field: AccountTextField,
  language: Lang,
): string => (account ? pick(account as unknown as Record<string, unknown>, field, language) : '')

/** 계좌번호에서 하이픈·공백을 걷어낸 복사용 문자열 */
export const plainAccountNumber = (value: string): string => value.replace(/[^0-9]/g, '')
