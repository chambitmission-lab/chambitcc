interface TimerDisplayProps {
  timeLeft: number
  totalSeconds: number
}

const TimerDisplay = ({ timeLeft, totalSeconds }: TimerDisplayProps) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0

  return (
    <div className="relative">
      {/* 원형 프로그레스 */}
      <div className="relative w-64 h-64 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          {/* 배경 원 */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* 프로그레스 원 */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* 타이머 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-sm text-white/50 mt-2">
            {Math.round(progress)}% 완료
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimerDisplay
