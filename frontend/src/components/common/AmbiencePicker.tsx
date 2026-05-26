import { useLanguage } from '../../contexts/LanguageContext'
import type { AmbienceTrack } from '../../data/ambienceTracks'

interface AmbiencePickerProps {
  tracks: AmbienceTrack[]
  ambienceId: string
  onChange: (id: string) => void
  /** 카드 상단 라벨 (default: "함께 들어요") */
  title?: string
  /** 카드 컨테이너 패딩 제어용 클래스 */
  className?: string
}

/**
 * 신앙 여정·주간 스토리 등 묵상 화면에서 배경음을 고르는 토글.
 * 트랙 클릭만으로 자동 재생되도록 호출자가 useAmbience(id, { autoplay: true }) 와 함께 사용한다.
 */
const AmbiencePicker = ({
  tracks,
  ambienceId,
  onChange,
  title = '함께 들어요',
  className = '',
}: AmbiencePickerProps) => {
  const { t } = useLanguage()
  const tx = t as unknown as (k: string) => string

  return (
    <div className={`px-4 py-2 ${className}`}>
      <div
        className="
          relative overflow-hidden
          rounded-2xl px-4 py-3
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.08]
          shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(168,85,247,0.10)]
        "
      >
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-purple-400/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2 mb-2">
          <span className="material-icons-outlined text-purple-500 dark:text-purple-300 text-base">
            music_note
          </span>
          <span className="text-[12px] font-semibold text-gray-700 dark:text-white/85 tracking-[-0.01em]">
            {title}
          </span>
        </div>
        <div className="relative flex flex-wrap gap-1.5">
          {tracks.map((track) => {
            const active = ambienceId === track.id
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onChange(track.id)}
                className={`
                  px-3 py-1.5 rounded-full text-[11px] font-medium
                  flex items-center gap-1.5 border transition-all
                  ${
                    active
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-white/30 text-white shadow-[0_4px_12px_rgba(168,85,247,0.30)]'
                      : 'bg-gray-100/70 dark:bg-white/[0.04] border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-white/65 hover:bg-gray-200/70 dark:hover:bg-white/[0.08]'
                  }
                `}
              >
                <span className="material-icons-outlined text-sm">
                  {track.icon}
                </span>
                {tx(track.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AmbiencePicker
