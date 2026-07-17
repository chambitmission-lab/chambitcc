import { useLanguage } from '../../contexts/LanguageContext'

interface VerseReadingButtonProps {
  isReading: boolean
  isSupported: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  disabled?: boolean
  isStarting?: boolean
  // 첫 탭 지연을 줄이기 위해, 누르기 직전(pointerdown)에 마이크 권한을 미리 확보한다.
  onPrime?: () => void
}

const VerseReadingButton = ({
  isReading,
  isSupported,
  onClick,
  size = 'sm',
  disabled = false,
  isStarting = false,
  onPrime
}: VerseReadingButtonProps) => {
  const { language } = useLanguage()

  if (!isSupported) {
    return null
  }

  const texts = {
    ko: {
      start: '음성으로 읽기',
      starting: '준비 중...',
      reading: '읽는 중...'
    },
    en: {
      start: 'Read aloud',
      starting: 'Preparing...',
      reading: 'Reading...'
    }
  }

  const t = texts[language]

  // 시작 중이거나 듣는 중이면 "활성" 외형으로 즉시 전환해 탭에 바로 반응하게 한다.
  const active = isReading || isStarting

  const sizeClasses = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-10 h-10 text-base'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => { if (!active && !disabled) onPrime?.() }}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-300
        relative
        outline-none focus:outline-none focus-visible:outline-none appearance-none
        ${active
          ? 'bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
          : 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
      `}
      title={isStarting ? t.starting : isReading ? t.reading : t.start}
      style={{
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        border: 'none',
        boxShadow: active
          ? '0 4px 14px rgba(236, 72, 153, 0.4)'
          : '0 4px 14px rgba(49, 130, 246, 0.4)',
      }}
    >
      <span
        className={`material-icons-outlined ${isStarting ? 'animate-spin' : ''}`}
        style={{ fontSize: size === 'sm' ? '1.0625rem' : '1.25rem' }}
      >
        {isStarting ? 'autorenew' : isReading ? 'graphic_eq' : 'record_voice_over'}
      </span>
    </button>
  )
}

export default VerseReadingButton
