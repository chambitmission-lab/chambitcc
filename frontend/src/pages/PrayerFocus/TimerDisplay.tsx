interface TimerDisplayProps {
  timeLeft: number
  totalSeconds: number
  /** 컴팩트 모드: 작은 타이머 + 진행 % 숨김 (기도 중 몰입용) */
  compact?: boolean
  /** 그라데이션 시작/끝 색. 미지정 시 기존 보라/핑크 */
  ringFrom?: string
  ringTo?: string
}

const TimerDisplay = ({ timeLeft, totalSeconds, compact = false, ringFrom = '#a855f7', ringTo = '#ec4899' }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0

  const size = compact ? 160 : 256
  const radius = compact ? 72 : 120
  const stroke = compact ? 4 : 8
  const cx = size / 2
  const center = compact ? size / 2 : 128

  return (
    <div className="relative flex items-center justify-center">
      {/* 컴팩트 모드일 때는 잔잔한 외곽 파동 추가 */}
      {compact && (
        <div
          className="absolute rounded-full pointer-events-none animate-pulse-slow"
          style={{
            width: size + 60,
            height: size + 60,
            background: `radial-gradient(circle, ${ringFrom}22 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={cx}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={cx}
            cy={center}
            r={radius}
            stroke="url(#timer-gradient)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * radius}`}
            strokeDashoffset={`${2 * Math.PI * radius * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ringFrom} />
              <stop offset="100%" stopColor={ringTo} />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`tabular-nums font-bold ${compact ? 'text-3xl text-white/80' : 'text-6xl'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {!compact && (
            <div className="text-sm text-white/50 mt-2">
              {Math.round(progress)}% 완료
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimerDisplay
