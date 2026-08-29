/**
 * 칭호 글리프 — 칭호 key → 인라인 선화 SVG.
 *
 * 백엔드 TITLE_REGISTRY 의 icon(이모지)은 그대로 두고, 렌더 시점에 key 로
 * 선화 아이콘을 골라 그린다(같은 방식: PlanGlyph · EduGlyph · HistoryGlyph).
 * 매핑에 없는 key 는 원래 이모지를 폴백으로 출력해 새 칭호가 추가돼도 깨지지 않는다.
 *
 * - viewBox 24 / stroke 1.8 / round cap·join — 앱 선화 문법(ActionIcons)과 동일
 * - 크기는 1em 이라 기존 font-size 규칙(.title-medal-icon 등)이 그대로 먹는다
 * - 색은 currentColor → 감싸는 요소에서 티어 색을 준다
 */
import type { CSSProperties, ReactElement } from 'react'

type GlyphProps = { className?: string; style?: CSSProperties }

const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** 살짝 채운 면 — 티어 색 12% 로 볼륨감 */
const soft = { fill: 'currentColor', opacity: 0.14, stroke: 'none' }

const GLYPHS: Record<string, ReactElement> = {
  // 📅 시간과 꾸준함 ───────────────────────
  dawn_riser: (
    <>
      <path {...soft} d="M6 15a6 6 0 0 1 12 0z" />
      <path {...P} d="M6 15a6 6 0 0 1 12 0M3 15h18M12 4v2M5.6 8.6 7 10M18.4 8.6 17 10M2.5 19h6M15.5 19h6" />
    </>
  ),
  night_owl: (
    <>
      <path {...soft} d="M7 9c0-3 2.2-5 5-5s5 2 5 5v6a5 5 0 0 1-10 0z" />
      <path {...P} d="M7 9c0-3 2.2-5 5-5s5 2 5 5v6a5 5 0 0 1-10 0z" />
      <path {...P} d="M7 8 5 4.5 8.5 6M17 8l2-3.5L15.5 6" />
      <circle {...P} cx="9.5" cy="10.5" r="1.8" />
      <circle {...P} cx="14.5" cy="10.5" r="1.8" />
      <path {...P} d="m12 12.5-.9 1.6h1.8zM9 20.5v1M15 20.5v1" />
    </>
  ),
  faithful_watchman: (
    <>
      <path {...soft} d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z" />
      <path {...P} d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z" />
      <path {...P} d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  unbroken_month: (
    <>
      <path {...soft} d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.3 1.2 1 2 2 2.3C11 8 11 5 12 3z" />
      <path {...P} d="M8 20c-2-1.5-3-3.5-3-6 0-2.5 1-4.5 2.5-6 .3 2 1.3 3.2 2.5 3.7C9.5 8 10 5.5 12.5 3c.5 3.5 4 5 5.5 8.5 1 2.8.4 6-2.5 8.5" />
      <path {...P} d="M10 21c-1.2-.9-1.8-2-1.8-3.4 0-1.8 1.5-3 2.3-4.5.8 1.2 2.5 2 2.5 4 0 1.5-.6 2.9-1.8 3.9" />
    </>
  ),
  day_and_night: (
    <>
      <path {...soft} d="M12 5a7 7 0 0 0 0 14z" />
      <circle {...P} cx="12" cy="12" r="7" />
      <path {...P} d="M12 5v14M12 2.5v1M12 20.5v1M3.5 12h1M19.5 12h1M5.5 5.5l.7.7M17.8 17.8l.7.7" />
      <path {...P} d="M15.5 9.5a3 3 0 0 0 0 5" />
    </>
  ),
  three_meals: (
    <>
      <path {...soft} d="M4 12h16c0 4-3 7-8 7s-8-3-8-7z" />
      <path {...P} d="M4 12h16c0 4-3 7-8 7s-8-3-8-7zM9 3.5c-1 1.5 1 2.5 0 4M12.5 3.5c-1 1.5 1 2.5 0 4M16 3.5c-1 1.5 1 2.5 0 4M8 19l-1 2M16 19l1 2" />
    </>
  ),
  keep_sabbath: (
    <>
      <path {...soft} d="M6 21v-8l6-4 6 4v8z" />
      <path {...P} d="M6 21v-8l6-4 6 4v8zM12 9V4M10 6h4M3 21h18M12 21v-4M10 17h4v4" />
    </>
  ),
  attendance_king: (
    <>
      <path {...soft} d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path {...P} d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9h16M8 3v4M16 3v4M9 14.5l2 2 4-4.5" />
    </>
  ),
  hundred_days: (
    <>
      <circle {...soft} cx="12" cy="12" r="9" />
      <circle {...P} cx="12" cy="12" r="9" />
      <path {...P} d="M6.5 15V9.5L5 10.5" />
      <rect {...P} x="9" y="9.5" width="3.2" height="5.5" rx="1.6" />
      <rect {...P} x="14.3" y="9.5" width="3.2" height="5.5" rx="1.6" />
    </>
  ),
  // 📖 읽기 패턴 ───────────────────────────
  story_graduate: (
    <>
      <path {...soft} d="M12 5 2 10l10 5 10-5z" />
      <path {...P} d="M12 5 2 10l10 5 10-5zM6 12v5c1.8 1.8 4 2.5 6 2.5s4.2-.7 6-2.5v-5M22 10v6" />
    </>
  ),
  moses_companion: (
    <>
      <path {...soft} d="M4 21V9a4 4 0 0 1 8 0v12zM12 21V9a4 4 0 0 1 8 0v12z" />
      <path {...P} d="M4 21V9a4 4 0 0 1 8 0v12zM12 21V9a4 4 0 0 1 8 0v12zM3 21h18M6.5 12h3M6.5 15h3M14.5 12h3M14.5 15h3" />
    </>
  ),
  wisdom_king: (
    <>
      <path {...soft} d="M4 18 3 7l5 3.5L12 5l4 5.5L21 7l-1 11z" />
      <path {...P} d="M4 18 3 7l5 3.5L12 5l4 5.5L21 7l-1 11zM4 18h16M4 21h16" />
      <circle {...P} cx="12" cy="13.5" r="1.3" />
    </>
  ),
  gospel_witness: (
    <>
      <path {...soft} d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z" />
      <path {...P} d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z" />
    </>
  ),
  seen_the_end: (
    <>
      <path {...soft} d="M5 4h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5z" />
      <path {...P} d="M5 4h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5zM5 4v16M5 6H4v12h1" />
      <path {...P} d="M14 3v8l-2-1.5L10 11V3M9 15h6" />
    </>
  ),
  storm_reader: (
    <>
      <path {...soft} d="M4 5h16l-2.5 3H6.5z" />
      <path {...P} d="M3 5h18M5 9h14M7 13h11M10 17h7M12 21h4" />
    </>
  ),
  plan_finisher: (
    <>
      <path {...soft} d="M5 4h14v10H5z" />
      <path {...P} d="M5 21V4M5 4h14v10H5" />
      <path {...P} d="M5 7.3h3.5v3.4H12V7.3h3.5v3.4H19M8.5 4v3.3M12 10.7V14M15.5 4v3.3" />
    </>
  ),
  plan_collector: (
    <>
      <circle {...soft} cx="12" cy="15" r="5.5" />
      <circle {...P} cx="12" cy="15" r="5.5" />
      <path {...P} d="M8.5 10 6 3h4.5l1.5 4 1.5-4H18l-2.5 7" />
      <path {...P} d="m12 12.5.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
    </>
  ),
  word_marathoner: (
    <>
      <circle {...soft} cx="15" cy="5" r="2.2" />
      <circle {...P} cx="15" cy="5" r="2.2" />
      <path {...P} d="m4 21 4.5-4.5L11 13l-3-2 2.5-4h4l1.5 3 3.5 1M8 11l-4 1.5M11.5 13l3.5 3.5-1 4.5" />
    </>
  ),
  bible_conqueror: (
    <>
      <path {...soft} d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path {...P} d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 21h8M9.5 17h5v4" />
    </>
  ),
  living_legend: (
    <>
      <path {...soft} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="m12 3 2.5 5.6 6 .6-4.5 4.1 1.3 6-5.3-3.1-5.3 3.1 1.3-6L3.5 9.2l6-.6z" />
      <path {...P} d="M20 2v3M18.5 3.5h3" />
    </>
  ),
  // 🎉 특별한 순간 ────────────────────────
  returned_prodigal: (
    <>
      <path {...soft} d="M5 21v-7a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v7z" />
      <circle {...P} cx="9" cy="6" r="2.5" />
      <circle {...P} cx="16" cy="7" r="2" />
      <path {...P} d="M4 21v-6a4 4 0 0 1 4-4h2.5a3.5 3.5 0 0 1 3.5 3.5V21M20 21v-5.5a3.5 3.5 0 0 0-3.5-3.5h-1" />
      <path {...P} d="M13 12.5 16.5 15" />
    </>
  ),
  streak_breaker: (
    <>
      <path {...soft} d="M6 6h5v4H6zM13 14h5v4h-5z" />
      <path {...P} d="M9 8H7a3 3 0 0 0 0 6h2M15 16h2a3 3 0 0 0 0-6h-2M9 11h2M13 13h2" />
      <path {...P} d="M13.5 4.5 12 8M8.5 20 10 16.5M18 4l-2 2M6 20l2-2" />
    </>
  ),
  leviticus_survivor: (
    <>
      <path {...soft} d="M12 4 2 20h20z" />
      <path {...P} d="M12 4 2 20h20zM12 4l-2-1.5M12 4l2-1.5M12 12l-4 8M12 12l4 8" />
    </>
  ),
  eutychus_escape: (
    <>
      <path {...soft} d="M5 3h14v18H5z" />
      <path {...P} d="M5 3h14v18H5zM5 12h14M12 3v9M3 21h18" />
      <path {...P} d="M13 16.5c1.5 0 2.5-1 4-1" />
    </>
  ),
  obadiah_finder: (
    <>
      <circle {...soft} cx="10.5" cy="10.5" r="6.5" />
      <circle {...P} cx="10.5" cy="10.5" r="6.5" />
      <path {...P} d="m15.5 15.5 5 5M8 9a3 3 0 0 1 2.5-2" />
    </>
  ),
  everest_climber: (
    <>
      <path {...soft} d="m3 20 6-11 3 4 2-3 7 10z" />
      <path {...P} d="m3 20 6-11 3 4 2-3 7 10zM9 9l1.5-2.5L12 9M14 3v6M14 3h4l-4 2" />
    </>
  ),
  // 폴백 ─────────────────────────────────
  lock: (
    <>
      <rect {...soft} x="5" y="10" width="14" height="10" rx="2" />
      <rect {...P} x="5" y="10" width="14" height="10" rx="2" />
      <path {...P} d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5" />
    </>
  ),
}

type TitleGlyphProps = GlyphProps & {
  /** 칭호 key — 'lock' 은 미획득 히든 칭호 */
  titleKey: string
  /** 매핑에 없을 때 출력할 원래 이모지 */
  fallback?: string
}

export const TitleGlyph = ({ titleKey, fallback, className, style }: TitleGlyphProps) => {
  const glyph = GLYPHS[titleKey]
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
