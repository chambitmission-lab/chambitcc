import { useLanguage } from '../../contexts/LanguageContext'

interface VoiceInputButtonProps {
  isListening: boolean
  isSupported: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const VoiceInputButton = ({
  isListening,
  isSupported,
  onClick,
  size = 'md',
  className = '',
}: VoiceInputButtonProps) => {
  const { t } = useLanguage()

  if (!isSupported) {
    return null
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        transition-all duration-300
        ${isListening
          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse'
          : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
        }
        ${className}
      `}
      title={isListening ? t('stopVoiceInput') || '음성 입력 중지' : t('startVoiceInput') || '음성 입력 시작'}
    >
      <span className="material-icons-outlined">
        {isListening ? 'mic' : 'mic_none'}
      </span>
      
      {/* 음성 인식 중 애니메이션 */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
          <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse"></span>
        </>
      )}
    </button>
  )
}

export default VoiceInputButton
