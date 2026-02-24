import { useTextToSpeech } from '../../hooks/useTextToSpeech'

interface TextToSpeechButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const TextToSpeechButton = ({ text, className = '', size = 'md' }: TextToSpeechButtonProps) => {
  const { speak, stop, isPlaying, isSupported } = useTextToSpeech({
    lang: 'ko-KR',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  })

  if (!isSupported) {
    return null // 지원하지 않는 브라우저에서는 버튼 숨김
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation() // 부모 클릭 이벤트 방지
    
    if (isPlaying) {
      stop()
    } else {
      speak(text)
    }
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${isPlaying 
          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 animate-pulse' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
        }
        ${className}
      `}
      title={isPlaying ? '음성 정지' : '음성으로 듣기'}
      aria-label={isPlaying ? '음성 정지' : '음성으로 듣기'}
    >
      {isPlaying ? (
        // 정지 아이콘
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
        </svg>
      ) : (
        // 스피커 아이콘
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
        </svg>
      )}
    </button>
  )
}

export default TextToSpeechButton
