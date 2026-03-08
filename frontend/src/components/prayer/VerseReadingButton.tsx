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
        transition-all duration-300
        ${isReading
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse'
          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isReading ? t.reading : t.start}
    >
      <span className="material-icons-outlined" style={{ fontSize: size === 'sm' ? '1rem' : '1.25rem' }}>
        {isReading ? 'mic' : 'record_voice_over'}
      </span>
      
      {/* 읽는 중 애니메이션 */}
      {isReading && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse"></span>
        </>
      )}
    </button>
  )
}

export default VerseReadingButton
