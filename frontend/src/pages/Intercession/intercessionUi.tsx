// 누군가의 기도 — 공용 조각 (등불·불꽃·날짜 표기)
//
// 색 규칙: 화면 바탕·버튼·숫자는 브랜드 토큰. 따뜻한 불꽃색은 "기도가 닿은 순간"(켜진 불꽃)
// 에만 쓴다 — 기도 카드 🙏 버튼에만 골드를 쓰는 규칙과 같은 결이다.
import { useId } from 'react'
import type { IntercessionLampWeek } from '../../api/intercession'

/** 불꽃 하나 — lit 이면 따뜻한 불꽃, 아니면 꺼진 심지 */
export const Flame = ({ lit, size = 22 }: { lit: boolean; size?: number }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 20 27"
      className={`ic-flame${lit ? ' is-lit' : ''}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`ic-f-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {lit ? (
        <>
          <path
            d="M10 1.5C12.8 6 16.5 9.2 16.5 15.2A6.5 6.5 0 0 1 3.5 15.2C3.5 11 6.4 9 7.6 5.6 8.6 7.6 9.4 8.3 10.3 8.6 10.6 6 10.4 3.8 10 1.5Z"
            fill={`url(#ic-f-${id})`}
          />
          <path d="M10 12.2c1.5 1.8 2.6 3 2.6 4.7a2.6 2.6 0 0 1-5.2 0c0-1.5 1.2-2.7 2.6-4.7Z" fill="#fffbeb" opacity="0.9" />
        </>
      ) : (
        <path d="M10 19.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  )
}

/**
 * 나를 위한 기도 등불 — 이번 주기의 주마다 초 하나.
 * 켜진 초 = 그 주에 누군가 나를 위해 기도했다. 횟수는 보여 주지 않는다.
 */
export const Lamp = ({
  weeks,
  size = 'lg',
}: {
  weeks: IntercessionLampWeek[]
  size?: 'lg' | 'sm'
}) => (
  <div className={`ic-lamp ic-lamp--${size}`} role="img" aria-label={lampLabel(weeks)}>
    {weeks.map((w) => (
      <span
        key={w.start}
        className={`ic-candle${w.lit ? ' is-lit' : ''}${w.is_current ? ' is-current' : ''}${
          w.is_future ? ' is-future' : ''
        }`}
      >
        <span className="ic-candle__glow" aria-hidden />
        <Flame lit={w.lit} size={size === 'lg' ? 22 : 11} />
        <span className="ic-candle__stick" aria-hidden />
      </span>
    ))}
  </div>
)

const lampLabel = (weeks: IntercessionLampWeek[]) => {
  const lit = weeks.filter((w) => w.lit).length
  return lit > 0
    ? `이번 달 ${weeks.length}주 중 ${lit}주에 누군가의 기도가 닿았어요`
    : '아직 켜진 등불이 없어요'
}

/** 작은 불꽃 아이콘 (라벨·버튼용) — 브랜드 색을 따른다 */
export const FlameGlyph = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2.8c2.6 4.2 6 7.1 6 12.4a6 6 0 0 1-12 0c0-3.8 2.6-5.7 3.7-8.8.9 1.8 1.7 2.5 2.5 2.8.3-2.4.2-4.4-.2-6.4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M12 13.2c1.3 1.6 2.3 2.7 2.3 4.2a2.3 2.3 0 0 1-4.6 0c0-1.3 1-2.4 2.3-4.2Z" fill="currentColor" />
  </svg>
)
