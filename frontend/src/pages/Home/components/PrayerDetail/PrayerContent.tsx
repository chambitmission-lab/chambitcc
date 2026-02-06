// 기도 내용 컴포넌트
import { useState, useEffect } from 'react'

interface PrayerContentProps {
  title: string
  content: string
}

const PrayerContent = ({ title, content }: PrayerContentProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(title)
  const [displayContent, setDisplayContent] = useState(content)

  // 🎨 Blur Fade Transition - Apple/Notion 스타일
  // 다른 스타일 원하시면:
  // - slide-fade: 위로 슬라이드하며 사라지는 효과
  // - scale-blur: 축소되며 블러되는 프리미엄 효과
  // - flip-3d: 3D 회전 효과 (화려함)
  useEffect(() => {
    if (title !== displayTitle || content !== displayContent) {
      setIsTransitioning(true)
      
      const timer = setTimeout(() => {
        setDisplayTitle(title)
        setDisplayContent(content)
        setIsTransitioning(false)
      }, 150) // 블러 페이드아웃 시간

      return () => clearTimeout(timer)
    }
  }, [title, content, displayTitle, displayContent])

  // 애니메이션 스타일
  const transitionStyles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  return (
    <div className="relative mb-5">
      {/* 위에서 내려오는 빛 효과 - 테마별 색상 */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-transparent via-purple-400/40 to-purple-500/60 dark:via-white/30 dark:to-white/50 blur-[1px]"></div>
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-gradient-to-b from-transparent via-purple-500/60 to-purple-600/80 dark:via-white/50 dark:to-white/70"></div>
      
      {/* 기도 카드 - 글래스모피즘 */}
      <div className="backdrop-blur-xl bg-white/40 dark:bg-white/10 rounded-xl p-5 border border-white/60 dark:border-white/20 relative overflow-hidden shadow-[0_8px_32px_rgba(168,85,247,0.15),0_-3px_10px_rgba(168,85,247,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_-3px_10px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* 내부 빛 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-purple-300/30 to-transparent dark:from-white/20 dark:to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-white/10 dark:to-white/5 rounded-full blur-2xl"></div>
        
        <h3 
          className="text-base font-extrabold text-gray-900 dark:text-white mb-3 tracking-[0.02em] relative z-10 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] uppercase"
          style={transitionStyles}
        >
          {displayTitle}
        </h3>
        <p 
          className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap relative z-10 drop-shadow-[0_0_6px_rgba(168,85,247,0.2)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
          style={transitionStyles}
        >
          {displayContent}
        </p>
      </div>
    </div>
  )
}

export default PrayerContent
