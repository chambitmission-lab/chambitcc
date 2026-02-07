import { useState, useRef, useEffect } from 'react'
import type { Bulletin } from '../../../types/bulletin'
import './InstagramBulletinViewer.css'

interface InstagramBulletinViewerProps {
  bulletin: Bulletin
  onClose: () => void
}

const InstagramBulletinViewer = ({ bulletin, onClose }: InstagramBulletinViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 })
  const lastTapRef = useRef(0)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const pages = bulletin.pages?.sort((a, b) => a.page_number - b.page_number) || []
  const totalPages = pages.length

  // 컨트롤 자동 숨김
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, currentPage])

  // 화면 터치로 컨트롤 토글
  const handleScreenTap = () => {
    setShowControls(!showControls)
  }

  // 더블탭 줌
  const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (scale === 1) {
        setScale(2)
      } else {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }
    lastTapRef.current = now
  }

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0
      }
      if (scale > 1) {
        setIsDragging(true)
        dragStartRef.current = { x: position.x, y: position.y }
      }
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      touchStartRef.current = { x: 0, y: 0, distance }
    }
  }

  // 터치 이동
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 핀치 줌
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = distance / touchStartRef.current.distance
      const newScale = Math.min(Math.max(scale * delta, 1), 4)
      setScale(newScale)
      touchStartRef.current.distance = distance
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && scale > 1 && isDragging) {
      // 드래그
      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      setPosition({
        x: dragStartRef.current.x + deltaX,
        y: dragStartRef.current.y + deltaY
      })
    }
  }

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && scale === 1 && !isDragging) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y)
      
      // 수평 스와이프 감지
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0 && currentPage > 0) {
          goToPreviousPage()
        } else if (deltaX < 0 && currentPage < totalPages - 1) {
          goToNextPage()
        }
      }
    }
    setIsDragging(false)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      resetZoom()
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      resetZoom()
    }
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage()
      if (e.key === 'ArrowRight') goToNextPage()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages])

  if (totalPages === 0) {
    return (
      <div className="instagram-viewer">
        <div className="viewer-error">페이지를 불러올 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="instagram-viewer" ref={containerRef}>
      {/* 헤더 */}
      <div className={`instagram-header ${showControls ? 'visible' : 'hidden'}`}>
        <button onClick={onClose} className="close-button">
          <span className="material-icons-outlined">close</span>
        </button>
        <div className="header-info">
          <h2>{bulletin.title}</h2>
          <p>{new Date(bulletin.bulletin_date).toLocaleDateString('ko-KR')}</p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className={`progress-bars ${showControls ? 'visible' : 'hidden'}`}>
        {pages.map((_, index) => (
          <div key={index} className="progress-bar-container">
            <div 
              className={`progress-bar ${index < currentPage ? 'completed' : index === currentPage ? 'active' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* 이미지 컨테이너 */}
      <div 
        className="image-container"
        onClick={handleScreenTap}
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={pages[currentPage]?.image_url}
          alt={`페이지 ${currentPage + 1}`}
          className="bulletin-image"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? 'grab' : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* 페이지 인디케이터 */}
      <div className={`page-indicator ${showControls ? 'visible' : 'hidden'}`}>
        {currentPage + 1} / {totalPages}
      </div>

      {/* 네비게이션 버튼 */}
      {scale === 1 && (
        <>
          {currentPage > 0 && (
            <button 
              className={`nav-button prev ${showControls ? 'visible' : 'hidden'}`}
              onClick={goToPreviousPage}
            >
              <span className="material-icons-outlined">chevron_left</span>
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button 
              className={`nav-button next ${showControls ? 'visible' : 'hidden'}`}
              onClick={goToNextPage}
            >
              <span className="material-icons-outlined">chevron_right</span>
            </button>
          )}
        </>
      )}

      {/* 줌 컨트롤 */}
      <div className={`zoom-controls ${showControls ? 'visible' : 'hidden'}`}>
        <button 
          onClick={() => {
            if (scale > 1) {
              setScale(Math.max(scale - 0.5, 1))
              if (scale - 0.5 <= 1) setPosition({ x: 0, y: 0 })
            }
          }}
          disabled={scale <= 1}
        >
          <span className="material-icons-outlined">remove</span>
        </button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button 
          onClick={() => setScale(Math.min(scale + 0.5, 4))}
          disabled={scale >= 4}
        >
          <span className="material-icons-outlined">add</span>
        </button>
      </div>

      {/* 도움말 제거 */}
    </div>
  )
}

export default InstagramBulletinViewer
