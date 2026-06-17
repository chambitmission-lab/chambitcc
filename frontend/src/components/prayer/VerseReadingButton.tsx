import { useLanguage } from '../../contexts/LanguageContext'

interface VerseReadingButtonProps {
  isReading: boolean
  isSupported: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

const VerseReadingButton = ({
  isReading,
  isSupported,
  onClick,
  size = 'sm',
  disabled = false
}: VerseReadingButtonProps) => {
  const { language } = useLanguage()

  if (!isSupported) {
    return null
  }

  const texts = {
    ko: {
      start: '음성으로 읽기',
      reading: '읽는 중...'
    },
    en: {
      start: 'Read aloud',
      reading: 'Reading...'
    }
  }

  const t = texts[language]

  const sizeClasses = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-10 h-10 text-base'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-300
        relative
        outline-none focus:outline-none focus-visible:outline-none appearance-none
        ${isReading
          ? 'bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
          : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
      `}
      title={isReading ? t.reading : t.start}
      style={{
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        border: 'none',
        boxShadow: isReading
          ? '0 4px 14px rgba(236, 72, 153, 0.4)'
          : '0 4px 14px rgba(168, 85, 247, 0.4)',
      }}
    >
      <span
        className="material-icons-outlined"
        style={{ fontSize: size === 'sm' ? '1.0625rem' : '1.25rem' }}
      >
        {isReading ? 'graphic_eq' : 'record_voice_over'}
      </span>
    </button>
  )
}

export default VerseReadingButton
