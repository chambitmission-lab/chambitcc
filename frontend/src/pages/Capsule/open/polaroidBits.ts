// 폴라로이드 기울기 규칙과 필름 날짜 각인.

// 작성 화면과 같은 규칙의 기울기 — 편지지 위에 놓인 인화지 느낌
const POLAROID_TILTS = ['-2.2deg', '2.4deg', '-1.4deg']

/** 필름 카메라 날짜 각인: 2025-07-26 → '25 7 26 */
const filmStamp = (dateStr: string): string => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return `'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`
}

// ── 분리 전 같은 파일에 있던 형제 모듈이 쓴다 ──
export { POLAROID_TILTS, filmStamp }
