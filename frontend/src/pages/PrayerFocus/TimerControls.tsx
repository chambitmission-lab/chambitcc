// 포모도로 스타일 컨트롤 바 — 중앙 큰 일시정지/재개 + 양옆 보조 버튼(처음부터 / 5분 연장)
import { useLanguage } from '../../contexts/LanguageContext'
import { CANDLE_CLASS } from './candleTone'

interface TimerControlsProps {
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onExtend: () => void
  /** 배경음 토글 — 무음 선택 시에는 버튼 자체를 숨긴다 */
  showSoundToggle?: boolean
  isMuted?: boolean
  onToggleSound?: () => void
}

const TimerControls = ({
  isPaused,
  onPause,
  onResume,
  onReset,
  onExtend,
  showSoundToggle = false,
  isMuted = false,
  onToggleSound,
}: TimerControlsProps) => {
  const { t } = useLanguage()

  return (
    <div className="flex items-start justify-center gap-7">
      {/* 처음부터 */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onReset}
          className="w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
          aria-label={t('timerRestart')}
        >
          <span className="material-icons-outlined text-xl text-white/70">refresh</span>
        </button>
        <span className="text-[10px] tracking-wider text-white/35">{t('timerRestart')}</span>
      </div>

      {/* 일시정지 / 재개 */}
      <div className="flex flex-col items-center gap-2 -mt-2">
        <button
          onClick={isPaused ? onResume : onPause}
          className={`w-[72px] h-[72px] rounded-full ${CANDLE_CLASS.primary} flex items-center justify-center transition-all active:scale-95 hover:brightness-105 shadow-[0_12px_28px_-10px_rgba(255,170,90,0.55),0_10px_20px_-5px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.45)]`}
          aria-label={isPaused ? t('timerResume') : t('timerPause')}
        >
          <span className="material-icons-outlined text-4xl">
            {isPaused ? 'play_arrow' : 'pause'}
          </span>
        </button>
        <span className="text-[10px] tracking-wider text-white/45">
          {isPaused ? t('timerResume') : t('timerPause')}
        </span>
      </div>

      {/* 5분 연장 */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onExtend}
          className="w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
          aria-label={t('timerExtendFive')}
        >
          <span className="text-sm font-semibold text-white/70 tabular-nums">+5</span>
        </button>
        <span className="text-[10px] tracking-wider text-white/35">{t('timerExtendFive')}</span>
      </div>

      {/* 배경음 켜기/끄기 */}
      {showSoundToggle && onToggleSound && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleSound}
            className="w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/15 transition-all active:scale-95"
            aria-label={t('ambience')}
            aria-pressed={!isMuted}
          >
            <span className={`material-icons-outlined text-xl ${isMuted ? 'text-white/35' : 'text-white/70'}`}>
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
          <span className="text-[10px] tracking-wider text-white/35">{t('ambience')}</span>
        </div>
      )}
    </div>
  )
}

export default TimerControls
