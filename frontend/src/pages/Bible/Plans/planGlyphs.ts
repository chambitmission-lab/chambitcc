/**
 * 플랜 아이콘의 '데이터' 조각 — 이모지 정규화 + admin 선택 목록.
 * 컴포넌트(PlanIcons.tsx)와 파일을 나눈 이유는 react-refresh 규칙 때문이다
 * (컴포넌트 파일에서 상수를 함께 export 하면 fast refresh 가 깨진다).
 * ★ 아래 목록의 이모지는 PlanIcons.tsx 의 GLYPHS 키와 짝이 맞아야 한다 —
 *   여기에만 추가하면 아이콘 대신 원래 이모지 글자가 그대로 나온다.
 */
/** 변이 선택자(FE0F)를 떼서 DB에 저장된 '✝️' 같은 값도 매핑에 맞춘다 */
export const normalizeGlyph = (e: string) => e.replace(/️/g, '').trim()

/** admin 이 고를 수 있는 아이콘 — GLYPHS 중 '플랜'에 어울리는 것만.
 *  📭(빈 목록) 😢(불러오기 실패)는 화면 상태 표시 전용이라 뺐다. */
export const PLAN_GLYPH_OPTIONS: { emoji: string; label: string }[] = [
  { emoji: '🌱', label: '시작·입문' },
  { emoji: '📖', label: '한 권 정독' },
  { emoji: '📚', label: '여러 권 읽기' },
  { emoji: '✝', label: '복음·십자가' },
  { emoji: '🗺', label: '성경 개관' },
  { emoji: '🕊', label: '성령·평안' },
  { emoji: '🌍', label: '전체 통독' },
  { emoji: '⛰', label: '모세오경' },
  { emoji: '📜', label: '율법·구약' },
  { emoji: '🎵', label: '시편·찬양' },
  { emoji: '🌅', label: '새벽 묵상' },
  { emoji: '🔥', label: '매일 습관' },
  { emoji: '🔑', label: '핵심 구절' },
  { emoji: '✨', label: '은혜·묵상' },
  { emoji: '🙏', label: '기도' },
  { emoji: '💙', label: '사랑' },
  { emoji: '🤝', label: '함께 읽기' },
  { emoji: '👥', label: '공동체' },
  { emoji: '💬', label: '나눔·대화' },
  { emoji: '📝', label: '기록·노트' },
  { emoji: '🎉', label: '완주 도전' },
]
