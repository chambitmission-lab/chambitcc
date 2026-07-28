// 기도 중 화면의 포모도로 스타일 집중 다이얼
// - 60개 눈금(5분 단위 굵은 눈금) 시계 문법 + 남은 시간이 줄어드는 카운트다운 아크
// - 아크 끝에 발광 노브가 붙어 시간의 흐름을 시각화 (Time Timer 계열 벤치마킹)
interface TimerDisplayProps {
  timeLeft: number
  totalSeconds: number
  /** 일시정지 상태 — 아크를 디밍하고 호흡 할로를 멈춘다 */
  isPaused?: boolean
  /** 시간 아래 표시할 상태 라벨 (테마명 · 기도중 · 일시정지 등) */
  statusLabel?: string
  /** 그라데이션 시작/끝 색. 미지정 시 기존 보라/핑크 */
  ringFrom?: string
  ringTo?: string
  /** 구간 안내 기도(ACTS) — 아크 위 4분할 경계 마커 표시 */
  segmented?: boolean
}

const SIZE = 300
const CENTER = SIZE / 2
const TICK_COUNT = 60
const TICK_OUTER = 146
const ARC_RADIUS = 118
const ARC_STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS

const TimerDisplay = ({
  timeLeft,
  totalSeconds,
  isPaused = false,
  statusLabel,
  ringFrom = '#a855f7',
  ringTo = '#ec4899',
  segmented = false,
}: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const remaining = totalSeconds > 0 ? timeLeft / totalSeconds : 0
  const remainingAngle = remaining * 360

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const deg = i * (360 / TICK_COUNT)
    const major = i % 5 === 0
    const rad = ((deg - 90) * Math.PI) / 180
    const inner = major ? TICK_OUTER - 10 : TICK_OUTER - 5
    // 남은 시간 구간의 눈금은 밝게, 이미 지나간 구간은 어둡게
    const active = deg <= remainingAngle
    return {
      key: i,
      x1: CENTER + Math.cos(rad) * inner,
      y1: CENTER + Math.sin(rad) * inner,
      x2: CENTER + Math.cos(rad) * TICK_OUTER,
      y2: CENTER + Math.sin(rad) * TICK_OUTER,
      major,
      active,
    }
  })

  return (
    <div className="relative flex items-center justify-center">
      {/* 호흡 할로 — 일시정지 시 정지 */}
      <div
        className={`absolute rounded-full pointer-events-none transition-opacity duration-700 ${
          isPaused ? 'opacity-30' : 'animate-breathe'
        }`}
        style={{
          width: SIZE + 70,
          height: SIZE + 70,
          background: `radial-gradient(circle, ${ringFrom}26 0%, transparent 68%)`,
        }}
      />

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full">
          {/* 눈금 다이얼 */}
          {ticks.map((tick) => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#ffffff"
              strokeWidth={tick.major ? 2.5 : 1.5}
              strokeLinecap="round"
              className="transition-opacity duration-1000"
              opacity={tick.active ? (tick.major ? 0.55 : 0.28) : 0.08}
            />
          ))}

          {/* 아크 트랙 */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ARC_RADIUS}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth={ARC_STROKE}
            fill="none"
          />

          {/* 남은 시간 아크 — 위에서 시작해 시계방향으로, 시간이 갈수록 줄어든다 */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ARC_RADIUS}
            stroke="url(#timer-gradient)"
            strokeWidth={ARC_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={`${CIRCUMFERENCE * (1 - remaining)}`}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            className={`transition-all duration-1000 ease-linear ${isPaused ? 'opacity-40' : ''}`}
          />

          {/* ACTS 4분할 경계 마커 (경배→회개→감사→간구) */}
          {segmented &&
            [90, 180, 270].map((deg) => {
              const rad = ((deg - 90) * Math.PI) / 180
              return (
                <circle
                  key={deg}
                  cx={CENTER + Math.cos(rad) * ARC_RADIUS}
                  cy={CENTER + Math.sin(rad) * ARC_RADIUS}
                  r={3}
                  fill="#ffffff"
                  opacity={0.6}
                />
              )
            })}

          {/* 아크 끝 발광 노브 */}
          {remaining > 0 && (
            <g
              style={{
                transform: `rotate(${remainingAngle}deg)`,
                transformOrigin: '50% 50%',
                transition: 'transform 1s linear',
              }}
              className={isPaused ? 'opacity-40' : ''}
            >
              <circle cx={CENTER} cy={CENTER - ARC_RADIUS} r={12} fill={ringTo} opacity={0.3} />
              <circle cx={CENTER} cy={CENTER - ARC_RADIUS} r={5.5} fill="#ffffff" opacity={0.95} />
            </g>
          )}

          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringFrom} />
              <stop offset="100%" stopColor={ringTo} />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`tabular-nums font-extralight text-[56px] leading-none tracking-tight transition-colors duration-500 ${
              isPaused ? 'text-white/50' : 'text-white/95'
            }`}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {statusLabel && (
            <div
              className={`mt-3 text-[11px] tracking-[0.25em] uppercase transition-colors duration-500 ${
                isPaused ? 'text-white/60 animate-pulse-slow' : 'text-white/35'
              }`}
            >
              {statusLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimerDisplay
