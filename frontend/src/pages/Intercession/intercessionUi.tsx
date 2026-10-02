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
 * 유리컵 속 초(votive) 하나 — 집중 기도 CandleHero 를 등불 줄 크기로 옮긴 것.
 * 켜진 초는 촛농이 속에서 빛나고 불꽃이 천천히 흔들린다. 꺼진 초는 식은 촛농 + 그을린 심지.
 * 유리 테두리 색은 CSS 변수(--ic-glass-*)라 라이트(밝은 히어로 면)·다크 모두에서 보인다.
 */
const Votive = ({ lit, order }: { lit: boolean; order: number }) => {
  const id = useId().replace(/:/g, '')
  const g = (name: string) => `ic-v-${name}-${id}`
  return (
    <svg className="ic-votive__svg" viewBox="0 0 56 84" aria-hidden>
      <defs>
        <linearGradient id={g('wax')} x1="0" y1="0" x2="0" y2="1">
          {lit ? (
            <>
              <stop offset="0%" stopColor="#fff4e2" />
              <stop offset="40%" stopColor="#f6e2c8" />
              <stop offset="100%" stopColor="#c9a47f" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#fbf7f0" />
              <stop offset="100%" stopColor="#ddd3c4" />
            </>
          )}
        </linearGradient>
        {/* 원통 음영 — 좌우 가장자리가 어둡다 */}
        <linearGradient id={g('shade')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a2c14" stopOpacity={lit ? 0.36 : 0.22} />
          <stop offset="30%" stopColor="#4a2c14" stopOpacity="0" />
          <stop offset="70%" stopColor="#4a2c14" stopOpacity="0" />
          <stop offset="100%" stopColor="#4a2c14" stopOpacity={lit ? 0.42 : 0.26} />
        </linearGradient>
        <radialGradient id={g('top')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lit ? '#fffaf0' : '#fdfbf7'} />
          <stop offset="100%" stopColor={lit ? '#ebcda8' : '#e4dbcd'} />
        </radialGradient>
        <radialGradient id={g('inner')} cx="50%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#ffc47a" stopOpacity="0.65" />
          <stop offset="60%" stopColor="#ffb060" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffb060" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('glass')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--ic-glass-tint)', stopOpacity: 0.5 }} />
          <stop offset="14%" style={{ stopColor: 'var(--ic-glass-tint)', stopOpacity: 0.12 }} />
          <stop offset="50%" style={{ stopColor: 'var(--ic-glass-tint)', stopOpacity: 0.04 }} />
          <stop offset="86%" style={{ stopColor: 'var(--ic-glass-tint)', stopOpacity: 0.12 }} />
          <stop offset="100%" style={{ stopColor: 'var(--ic-glass-tint)', stopOpacity: 0.42 }} />
        </linearGradient>
        <radialGradient id={g('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc478" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#fb923c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('flame')} cx="50%" cy="74%" r="62%">
          <stop offset="0%" stopColor="#fffdf4" />
          <stop offset="32%" stopColor="#fff0bf" />
          <stop offset="62%" stopColor="#ffc15a" />
          <stop offset="88%" stopColor="#ff8a3d" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff7a2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('blue')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b8dff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6b8dff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 켜진 초 — 불꽃 둘레 빛무리 + 바닥에 비친 불빛 (정적) */}
      {lit ? (
        <g className="ic-votive__light" style={{ animationDelay: `${order * 0.22}s` }}>
          <circle cx="28" cy="38" r="27" fill={`url(#${g('halo')})`} />
          <ellipse cx="28" cy="80.5" rx="26" ry="3.2" fill="#ffbe78" opacity="0.22" />
        </g>
      ) : null}

      {/* 유리컵 뒤쪽 테두리 */}
      <path d="M6 40 A22 4 0 0 0 50 40" fill="none" className="ic-votive__edge" strokeOpacity="0.5" strokeWidth="0.8" />

      {/* 초 몸통 + 윗면 */}
      <path d="M9.5 52 L9.5 75.5 A18.5 3.2 0 0 0 46.5 75.5 L46.5 52 A18.5 3.2 0 0 1 9.5 52 Z" fill={`url(#${g('wax')})`} />
      <path d="M9.5 52 L9.5 75.5 A18.5 3.2 0 0 0 46.5 75.5 L46.5 52 A18.5 3.2 0 0 1 9.5 52 Z" fill={`url(#${g('shade')})`} />
      <ellipse cx="28" cy="52" rx="18.5" ry="3.2" fill={`url(#${g('top')})`} />
      {lit ? (
        <ellipse
          className="ic-votive__light"
          style={{ animationDelay: `${order * 0.22}s` }}
          cx="28"
          cy="56"
          rx="16"
          ry="9"
          fill={`url(#${g('inner')})`}
        />
      ) : null}

      {/* 심지 — 꺼진 초는 그을린 끝 */}
      <path
        d="M28 52.4 Q27.7 49.6 28.4 46.8"
        fill="none"
        stroke="#3a2a1e"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={lit ? 1 : 0.7}
      />
      {lit ? <circle cx="28.4" cy="47" r="0.75" fill="#ff9a4a" /> : null}

      {/* 유리컵 몸통 + 테두리 + 세로 반사광 */}
      <path d="M6 40 L6 78 A22 4 0 0 0 50 78 L50 40 A22 4 0 0 1 6 40 Z" fill={`url(#${g('glass')})`} />
      <path
        d="M6 40 L6 78 A22 4 0 0 0 50 78 L50 40"
        fill="none"
        className="ic-votive__edge"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path d="M6 40 A22 4 0 0 1 50 40" fill="none" className="ic-votive__edge" strokeWidth="1" />
      <rect x="9" y="44" width="1.8" height="30" rx="0.9" className="ic-votive__streak" />
      <rect x="45.6" y="45" width="1" height="24" rx="0.5" className="ic-votive__streak" opacity="0.6" />

      {/* 불꽃 — 겉불꽃(푸른 밑동) + 속불꽃. 켜질 때 천천히 피어오르고 이후 아주 작게 흔들린다 */}
      {lit ? (
        <g className="ic-votive__flame-in" style={{ animationDelay: `${order * 0.22}s` }}>
          <g className="ic-votive__flame">
            <g transform="translate(22.2 18.5) scale(0.53)">
              <path
                d="M11 0 C12.6 13 22 28 22 41 C22 51 17 58 11 58 C5 58 0 51 0 41 C0 28 9.4 13 11 0 Z"
                fill={`url(#${g('flame')})`}
              />
              <ellipse cx="11" cy="52" rx="6" ry="5" fill={`url(#${g('blue')})`} />
            </g>
          </g>
          <g className="ic-votive__core">
            <g transform="translate(25.6 31.5) scale(0.53)">
              <path d="M5 0 C6 7 10 14 10 20 C10 24.5 7.8 28 5 28 C2.2 28 0 24.5 0 20 C0 14 4 7 5 0 Z" fill="#fffef8" />
            </g>
          </g>
        </g>
      ) : null}
    </svg>
  )
}

/**
 * 나를 위한 기도 등불 — 이번 주기의 주마다 초 하나.
 * 켜진 초 = 그 주에 누군가 나를 위해 기도했다. 횟수는 보여 주지 않는다.
 * lg(히어로·월말 회고)는 유리컵 촛불, sm(홈 카드)은 작은 막대 초.
 */
export const Lamp = ({
  weeks,
  size = 'lg',
}: {
  weeks: IntercessionLampWeek[]
  size?: 'lg' | 'sm'
}) =>
  size === 'lg' ? (
    <div className="ic-lamp ic-lamp--lg" role="img" aria-label={lampLabel(weeks)}>
      {weeks.map((w, i) => (
        <span
          key={w.start}
          className={`ic-votive${w.lit ? ' is-lit' : ''}${w.is_current ? ' is-current' : ''}${
            w.is_future ? ' is-future' : ''
          }`}
        >
          <Votive lit={w.lit} order={i} />
          <span className="ic-votive__mark" aria-hidden />
        </span>
      ))}
    </div>
  ) : (
  <div className={`ic-lamp ic-lamp--${size}`} role="img" aria-label={lampLabel(weeks)}>
    {weeks.map((w) => (
      <span
        key={w.start}
        className={`ic-candle${w.lit ? ' is-lit' : ''}${w.is_current ? ' is-current' : ''}${
          w.is_future ? ' is-future' : ''
        }`}
      >
        <span className="ic-candle__glow" aria-hidden />
        <Flame lit={w.lit} size={11} />
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
