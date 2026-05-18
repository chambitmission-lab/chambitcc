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
    <div className="mb-7">
      <h3
        className="text-[22px] font-bold text-gray-900 dark:text-white mb-6 tracking-[-0.015em] leading-[1.3]"
        style={transitionStyles}
      >
        {displayTitle}
      </h3>
      <p
        className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.75] whitespace-pre-wrap tracking-[-0.01em]"
        style={transitionStyles}
      >
        {displayContent}
      </p>
    </div>
  )
}

export default PrayerContent
