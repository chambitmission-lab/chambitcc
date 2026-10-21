/** 1234567 → "1,234,567" — 한국어 화면의 기본 숫자 표기(점수·절 수·아멘 수) */
export const formatNumberKo = (n: number): string => n.toLocaleString('ko-KR')
