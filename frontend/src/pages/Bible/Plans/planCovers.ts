// 플랜별 실제 커버 사진 — slug 기준 매핑.
// 파일명이 곧 slug라 나중에 사진을 바꾸려면 src/assets/plans/<slug>.jpg 만 교체하면 된다.
// (Unsplash 무료 라이선스 이미지. 새 플랜은 아래 맵에 한 줄만 추가)
import introCover from '../../../assets/plans/intro-7.jpg'
import johnCover from '../../../assets/plans/john-30.jpg'
import overviewCover from '../../../assets/plans/overview-90.jpg'
import ntCover from '../../../assets/plans/nt-120.jpg'
import bibleCover from '../../../assets/plans/bible-365.jpg'

export const PLAN_COVERS: Record<string, string> = {
  'intro-7': introCover, // 새벽 여명 들판 — 새로운 시작·습관
  'john-30': johnCover, // 노을 속 경배 — 복음·그리스도
  'overview-90': overviewCover, // 산·계곡 파노라마 — 구원의 큰 그림
  'nt-120': ntCover, // 운해 위 봉우리 — 평화·초월
  'bible-365': bibleCover, // 성경책 펼친 손 — 통독
}

// 크롭 기준점(object-position) — 5장 모두 왼쪽 40%가 빈 안개(카피 공간)이고
// 주인공(새싹·십자가·강줄기·비둘기·성경책)이 오른쪽에 있는 그림이라,
// 가운데를 자르면 카드 절반이 빈 안개로 채워진다. 그림마다 주인공 위치로 맞춘다.
export const PLAN_COVER_FOCUS: Record<string, string> = {
  'intro-7': '74% 62%', // 새싹 (우하)
  'john-30': '80% 46%', // 언덕 위 십자가 (우중)
  'overview-90': '72% 56%', // 굽이치는 강·해돋이 (우중하)
  'nt-120': '76% 38%', // 나는 비둘기 (우상)
  'bible-365': '72% 66%', // 펼친 성경 (우하)
}

export const planCover = (slug?: string | null): string | undefined =>
  slug ? PLAN_COVERS[slug] : undefined

export const planCoverFocus = (slug?: string | null): string =>
  (slug && PLAN_COVER_FOCUS[slug]) || '70% 50%'
