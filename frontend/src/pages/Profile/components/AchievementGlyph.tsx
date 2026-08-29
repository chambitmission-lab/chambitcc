/**
 * 업적 글리프 — 업적 id → 인라인 선화 SVG (TitleGlyph 와 같은 문법).
 *
 * ACHIEVEMENTS 의 icon(이모지)은 데이터로 남겨 두고 렌더 시점에 id 로 선화를 고른다.
 * 매핑에 없는 id 는 이모지 폴백. 색은 currentColor — 감싸는 요소에서
 * achievement.glowColor 를 불투명하게 바꾼 잉크(achievementInk)를 준다.
 * viewBox 24 / stroke 1.8 / round, 크기 1em.
 */
import type { CSSProperties, ReactElement } from 'react'

const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const soft = { fill: 'currentColor', opacity: 0.14, stroke: 'none' }

const GLYPHS: Record<string, ReactElement> = {
  // 기도 시간
  prayer_time_30: (
    <>
      <path {...soft} d="M9 10h6v11H9z" />
      <path {...P} d="M9 10h6v11H9zM7 21h10M12 10V7.5" />
      <path {...P} d="M12 7c-1.5-1.3-1.5-3 0-4.5 1.5 1.5 1.5 3.2 0 4.5z" />
    </>
  ),
  prayer_time_100: (
    <>
      <path {...soft} d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.3 1.2 1 2 2 2.3C11 8 11 5 12 3z" />
      <path {...P} d="M8 20c-2-1.5-3-3.5-3-6 0-2.5 1-4.5 2.5-6 .3 2 1.3 3.2 2.5 3.7C9.5 8 10 5.5 12.5 3c.5 3.5 4 5 5.5 8.5 1 2.8.4 6-2.5 8.5" />
      <path {...P} d="M10 21c-1.2-.9-1.8-2-1.8-3.4 0-1.8 1.5-3 2.3-4.5.8 1.2 2.5 2 2.5 4 0 1.5-.6 2.9-1.8 3.9" />
    </>
  ),
  prayer_time_300: (
    <>
      <path {...soft} d="M13 2 4 13h6l-1 9 9-11h-6z" />
      <path {...P} d="M13 2 4 13h6l-1 9 9-11h-6z" />
    </>
  ),
  // 성경 읽기
  bible_genesis: (
    <>
      <path {...soft} d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2z" />
      <path {...P} d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2M12 6c2-1.5 4.5-2 8-2v14c-3.5 0-6 .5-8 2M12 6v14" />
      <path {...P} d="M15 8.5c1-.3 2-.5 3-.5M15 11.5c1-.3 2-.5 3-.5" />
    </>
  ),
  bible_100: (
    <>
      <path {...soft} d="M4 5h4v15H4zM9 5h4v15H9z" />
      <path {...P} d="M4 5h4v15H4zM9 5h4v15H9zM4 9h4M9 9h4" />
      <path {...P} d="m14 7 3.8-1 3.7 13.5-3.8 1z" />
    </>
  ),
  bible_500: (
    <>
      <path {...soft} d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path {...P} d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path {...P} d="M19.5 16.5v3M18 18h3M5 18.5v2M4 19.5h2" />
    </>
  ),
  // 연속 기도
  streak_7: (
    <>
      <path {...soft} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
    </>
  ),
  streak_30: (
    <>
      <path {...soft} d="m12 4 2 4.5 4.8.5-3.6 3.3 1 4.8L12 14.7l-4.2 2.4 1-4.8L5.2 9l4.8-.5z" />
      <path {...P} d="m12 4 2 4.5 4.8.5-3.6 3.3 1 4.8L12 14.7l-4.2 2.4 1-4.8L5.2 9l4.8-.5z" />
      <path {...P} d="M3 18.5c3 1.7 6 2.5 9 2.5s6-.8 9-2.5" />
    </>
  ),
  // 기도 횟수
  prayer_count_50: (
    <>
      <path {...soft} d="M12 4c-1.5 3-3 6-3 9.5 0 3 1.3 5.5 3 7.5 1.7-2 3-4.5 3-7.5C15 10 13.5 7 12 4z" />
      <path {...P} d="M12 4c-1.5 3-3 6-3 9.5 0 3 1.3 5.5 3 7.5 1.7-2 3-4.5 3-7.5C15 10 13.5 7 12 4z" />
      <path {...P} d="M9 13.5C7 11 5.5 8 6 5c2 1.5 3.5 3.5 4.5 5.5M15 13.5c2-2.5 3.5-5.5 3-8.5-2 1.5-3.5 3.5-4.5 5.5" />
    </>
  ),
  prayer_count_200: (
    <>
      <path {...soft} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <circle {...P} cx="12" cy="11.5" r="2" />
    </>
  ),
  // 커뮤니티
  community_active: (
    <>
      <path {...soft} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3.5V16H6a2 2 0 0 1-2-2z" />
      <path {...P} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3.5V16H6a2 2 0 0 1-2-2z" />
      <path {...P} d="M8 8.5h8M8 11.5h5" />
    </>
  ),
  // 묵상 노트
  bible_note_first: (
    <>
      <path {...soft} d="M6 3h9l4 4v14H6z" />
      <path {...P} d="M6 3h9l4 4v14H6zM15 3v4h4M9 11h6M9 14.5h6M9 18h3" />
    </>
  ),
  bible_note_20: (
    <>
      <path {...soft} d="m14.5 5 4.5 4.5-9 9H5.5v-4.5z" />
      <path {...P} d="m14.5 5 4.5 4.5-9 9H5.5v-4.5zM12.5 7l4.5 4.5M4 21h16" />
    </>
  ),
  // 하이라이트
  bible_highlight_100: (
    <>
      <circle {...soft} cx="12" cy="12" r="3" />
      <circle {...P} cx="12" cy="12" r="3" />
      <path {...P} d="M12 3a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5zM12 16a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5zM3 12a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-5 0zM16 12a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-5 0z" />
      <path {...P} d="M5.6 5.6a2.5 2.5 0 0 1 3.6 3.6 2.5 2.5 0 0 1-3.6-3.6zM14.8 14.8a2.5 2.5 0 0 1 3.6 3.6 2.5 2.5 0 0 1-3.6-3.6zM18.4 5.6a2.5 2.5 0 0 1-3.6 3.6 2.5 2.5 0 0 1 3.6-3.6zM9.2 14.8a2.5 2.5 0 0 1-3.6 3.6 2.5 2.5 0 0 1 3.6-3.6z" />
    </>
  ),
  // 블루마블
  bm_correct_10: (
    <>
      <circle {...soft} cx="12" cy="12" r="8" />
      <circle {...P} cx="12" cy="12" r="8" />
      <circle {...P} cx="12" cy="12" r="4.5" />
      <circle {...P} cx="12" cy="12" r="1" />
      <path {...P} d="M12 4V2M20 12h2" />
    </>
  ),
  bm_correct_50: (
    <>
      <path {...soft} d="M12 4a6 6 0 0 0-6 6v1.5A3.5 3.5 0 0 0 7.5 18H9v3h6v-3h1.5a3.5 3.5 0 0 0 1.5-6.5V10a6 6 0 0 0-6-6z" />
      <path {...P} d="M12 4a6 6 0 0 0-6 6v1.5A3.5 3.5 0 0 0 7.5 18H9v3h6v-3h1.5a3.5 3.5 0 0 0 1.5-6.5V10a6 6 0 0 0-6-6z" />
      <path {...P} d="M12 4v14M8.5 8.5c1 .5 2 .5 3.5 0M12 12c1.5.5 2.5.5 3.5 0" />
    </>
  ),
  bm_lap_3: (
    <>
      <path {...soft} d="M6 8c-1.5 0-2.5 1.5-2.5 3.5 0 3 1.5 5 3 5s2.5-2 2.5-5C9 9.5 7.5 8 6 8zM18 4c-1.5 0-2.5 1.5-2.5 3.5 0 3 1.5 5 3 5s2.5-2 2.5-5C21 5.5 19.5 4 18 4z" />
      <path {...P} d="M6 8c-1.5 0-2.5 1.5-2.5 3.5 0 3 1.5 5 3 5s2.5-2 2.5-5C9 9.5 7.5 8 6 8zM18 4c-1.5 0-2.5 1.5-2.5 3.5 0 3 1.5 5 3 5s2.5-2 2.5-5C21 5.5 19.5 4 18 4z" />
      <path {...P} d="M5 19.5v1M7 19.5v1M17 15.5v1M19 15.5v1M12 21c-1 0-1.8-.8-1.8-1.8" />
    </>
  ),
  bm_clear_1: (
    <>
      <path {...soft} d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path {...P} d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 21h8M9.5 17h5v4" />
    </>
  ),
  bm_score_1000: (
    <>
      <path {...soft} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="M10.5 15.5v-5l-1 .8M14.5 15.5v-5l-1 .8" />
    </>
  ),
  bm_score_3000: (
    <>
      <path {...soft} d="M4 18 3 7l5 3.5L12 5l4 5.5L21 7l-1 11z" />
      <path {...P} d="M4 18 3 7l5 3.5L12 5l4 5.5L21 7l-1 11zM4 18h16M4 21h16" />
      <circle {...P} cx="12" cy="13.5" r="1.3" />
    </>
  ),
}

type AchievementGlyphProps = {
  achievementId: string
  /** 매핑에 없을 때 출력할 원래 이모지 */
  fallback?: string
  className?: string
  style?: CSSProperties
}

export const AchievementGlyph = ({ achievementId, fallback, className, style }: AchievementGlyphProps) => {
  const glyph = GLYPHS[achievementId]
  if (!glyph) return <span className={className} style={style}>{fallback ?? '✦'}</span>
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      style={{ display: 'block', ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  )
}
