import { useState, useEffect } from 'react'

interface CardContentProps {
  title: string
  content: string
  isExpanded: boolean
  onToggleExpand: () => void
}

const CardContent = ({
  title,
  content,
  isExpanded,
  onToggleExpand,
}: CardContentProps) => {
  const MAX_LENGTH = 120
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(title)
  const [displayContent, setDisplayContent] = useState(content)

  // 언어 전환 애니메이션
  useEffect(() => {
    if (title !== displayTitle || content !== displayContent) {
      setIsTransitioning(true)
      
      // 페이드아웃 후 텍스트 변경
      const timer = setTimeout(() => {
        setDisplayTitle(title)
        setDisplayContent(content)
        setIsTransitioning(false)
      }, 200) // 블러 페이드아웃 시간

      return () => clearTimeout(timer)
    }
  }, [title, content, displayTitle, displayContent])

  const truncateContent = (text: string) => {
    if (text.length <= MAX_LENGTH) return text
    return text.slice(0, MAX_LENGTH) + '...'
  }

  const shouldShowExpandButton = displayContent.length > MAX_LENGTH

  // 애니메이션 스타일
  const transitionStyles: React.CSSProperties = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isTransitioning ? 0 : 1,
    filter: isTransitioning ? 'blur(8px)' : 'blur(0px)',
    transform: isTransitioning ? 'translateY(-4px)' : 'translateY(0)',
  }

  return (
    <>
      <h3 
        className="card-title"
        style={transitionStyles}
      >
        {displayTitle}
      </h3>

      <div className="card-content">
        <p 
          className={`card-text ${isExpanded ? 'expanded' : ''}`}
          style={transitionStyles}
        >
          {isExpanded ? displayContent : truncateContent(displayContent)}
        </p>
        {shouldShowExpandButton && (
          <button className="card-expand" onClick={onToggleExpand}>
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </>
  )
}

export default CardContent
