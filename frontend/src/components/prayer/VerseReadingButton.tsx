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
    sm: 'w-8 h-8 text-sm',
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
        transition-all duration-500
        relative
        outline-none focus:outline-none focus-visible:outline-none appearance-none
        ${isReading
          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isReading ? t.reading : t.start}
      style={{
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
        border: 'none',
      }}
    >
      <span className="material-icons-outlined" style={{ fontSize: size === 'sm' ? '1rem' : '1.25rem' }}>
        {isReading ? 'mic' : 'record_voice_over'}
      </span>
    </button>
  )
}

export default VerseReadingButton
