import { APOSTLE_BY_ID, APOSTLE_GROUPS, type ApostleId } from '../../apostles'

// 열두 제자 화면(관계도·순서 흐름·인물 이야기)이 함께 쓰는 색·이름 규칙.
// 묶음 색은 원 노드·순서 그래프 점·이야기 머리에 같이 쓰여 "같은 사람"이 한눈에 이어진다.

export type ApostleTone = 1 | 2 | 3 | 'fallen' | 'replacement'

export const toneOf = (id: ApostleId): ApostleTone => {
  const a = APOSTLE_BY_ID.get(id)!
  if (a.special === 'fallen') return 'fallen'
  if (a.special === 'replacement') return 'replacement'
  const i = APOSTLE_GROUPS.findIndex((g) => g.members.includes(id))
  return (i + 1) as 1 | 2 | 3
}

/** 노드·점 채움색 — 흰 글씨가 올라가므로 라이트·다크 공통 */
export const TONE_COLOR: Record<ApostleTone, string> = {
  1: 'var(--brand)',
  2: '#14b8a6',
  3: '#7c6cf2',
  fallen: '#9aa3ad',
  replacement: '#e0a106',
}

/** 인물 이야기 머리 배경(흰 글씨). 떠난 자리(유다)는 색면 없이 회색 면 + 점선 */
export const TONE_HERO: Record<Exclude<ApostleTone, 'fallen'>, string> = {
  1: 'linear-gradient(150deg, #4f9bff, #1b64da)',
  2: 'linear-gradient(150deg, #2cc9b4, #0d8a7b)',
  3: 'linear-gradient(150deg, #9a8cff, #5646d1)',
  replacement: 'linear-gradient(150deg, #f5c84c, #b97f00)',
}

export const TONE_LABEL: Record<ApostleTone, string> = {
  1: '첫째 묶음',
  2: '둘째 묶음',
  3: '셋째 묶음',
  fallen: '떠난 자리',
  replacement: '채운 자리',
}

/** 야고보가 둘이라 화면에서는 알패오의 아들을 구분해 부른다 */
export const shortName = (id: ApostleId) => (id === 'jamesAlphaeus' ? '알패오 야고보' : APOSTLE_BY_ID.get(id)!.name)

/** 원 안 한 글자 */
export const initialOf = (id: ApostleId) => APOSTLE_BY_ID.get(id)!.name.replace('가룟 ', '')[0]
