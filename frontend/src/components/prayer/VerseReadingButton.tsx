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
        ${isReading
          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white shadow-lg shadow-amber-500/30'
          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isReading ? t.reading : t.start}
      style={isReading ? {
        animation: 'gentleGlow 2s ease-in-out infinite'
      } : undefined}
    >
      <span className="material-icons-outlined relative z-10" style={{ fontSize: size === 'sm' ? '1rem' : '1.25rem' }}>
        {isReading ? 'mic' : 'record_voice_over'}
      </span>
      
      {/* 읽는 중 은은한 빛 효과 */}
      {isReading && (
        <>
          <span 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/40 to-yellow-400/40 blur-md"
            style={{
              animation: 'gentleExpand 3s ease-in-out infinite'
            }}
          ></span>
          <span 
            className="absolute inset-0 rounded-full bg-white/20"
            style={{
              animation: 'softPulse 2s ease-in-out infinite'
            }}
          ></span>
        </>
      )}
      
      <style>{`
        @keyframes gentleGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(251, 191, 36, 0.3), 0 0 30px rgba(251, 191, 36, 0.15);
          }
          50% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.2);
          }
        }
        
        @keyframes gentleExpand {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.3;
          }
        }
        
        @keyframes softPulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </button>
  )
}

export default VerseReadingButton
