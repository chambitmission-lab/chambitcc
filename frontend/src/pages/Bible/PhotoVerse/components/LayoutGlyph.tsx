// 레이아웃 프리셋 도식 썸네일 — 텍스트가 놓이는 구도를 선으로 요약한다.

import type { CardLayoutId } from '../photoVerseCanvas'

/** 레이아웃 프리셋 도식 썸네일 — 텍스트가 놓이는 구도를 선으로 요약한다 */
const LayoutGlyph = ({ id }: { id: CardLayoutId }) => {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    fill: 'none',
  }
  return (
    <svg viewBox="0 0 36 44" aria-hidden="true">
      {id === 'classic' && (
        <g {...common}>
          <line x1="9" y1="17" x2="27" y2="17" />
          <line x1="7" y1="22" x2="29" y2="22" />
          <line x1="11" y1="27" x2="25" y2="27" />
        </g>
      )}
      {id === 'gallery' && (
        <g {...common}>
          <line x1="7" y1="28" x2="13" y2="28" strokeWidth={3} />
          <line x1="7" y1="34" x2="29" y2="34" />
          <line x1="7" y1="39" x2="22" y2="39" />
        </g>
      )}
      {id === 'quote' && (
        <g {...common}>
          <text
            x="18"
            y="17"
            textAnchor="middle"
            fontSize="17"
            fontFamily="Georgia, serif"
            fill="currentColor"
            stroke="none"
          >
            “
          </text>
          <line x1="9" y1="24" x2="27" y2="24" />
          <line x1="12" y1="29" x2="24" y2="29" />
          <line x1="15" y1="35" x2="21" y2="35" strokeWidth={1.6} />
        </g>
      )}
      {id === 'focus' && (
        <g {...common}>
          <line x1="11" y1="17" x2="25" y2="17" strokeWidth={4.4} />
          <line x1="9" y1="26" x2="27" y2="26" strokeWidth={1.8} />
          <line x1="12" y1="31" x2="24" y2="31" strokeWidth={1.8} />
        </g>
      )}
      {id === 'poster' && (
        <g {...common}>
          <rect x="5" y="5" width="26" height="34" rx="1" strokeWidth={1.4} />
          <line x1="18" y1="11" x2="18" y2="16" strokeWidth={1.6} />
          <line x1="16" y1="12.5" x2="20" y2="12.5" strokeWidth={1.6} />
          <line x1="11" y1="22" x2="25" y2="22" />
          <line x1="13" y1="27" x2="23" y2="27" />
          <line x1="14" y1="33" x2="22" y2="33" strokeWidth={1.4} />
        </g>
      )}
      {id === 'vertical' && (
        <g {...common}>
          <line x1="27" y1="9" x2="27" y2="33" />
          <line x1="21" y1="9" x2="21" y2="25" />
          <line x1="8" y1="38" x2="16" y2="38" strokeWidth={1.6} />
        </g>
      )}
    </svg>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { LayoutGlyph }
