import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../hooks/useModalBackButton'
import './AvatarZoomModal.css'

interface AvatarZoomModalProps {
  /** 확대해서 보여줄 프로필 사진 URL */
  src: string
  /** 사진 아래 표시할 이름 (선택) */
  name?: string
  onClose: () => void
}

/**
 * 프로필 사진 확대 라이트박스 (인스타그램식 탭-확대).
 *
 * 피드/상세 어디서든 아바타 이미지를 클릭했을 때 원본 사진을 크게 볼 수
 * 있게 한다. 배경 탭·ESC·안드로이드 뒤로가기로 닫힌다. 실제 업로드
 * 사진이 있을 때만 띄우고, 이니셜/익명 아바타에는 쓰지 않는다.
 */
const AvatarZoomModal = ({ src, name, onClose }: AvatarZoomModalProps) => {
  useModalBackButton(onClose)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="avatar-zoom-backdrop fixed inset-0 z-[130] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8"
      // 포털은 React 트리(= 이 모달을 연 카드)를 따라 이벤트가 버블링되므로,
      // 배경 탭으로 닫을 때 전파를 막지 않으면 카드 onClick(상세보기)까지 열린다.
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={name ? `${name} 프로필 사진` : '프로필 사진'}
    >
      <figure
        className="avatar-zoom-figure m-0 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={name ? `${name} 프로필 사진` : '프로필 사진'}
          className="h-[min(78vw,340px)] w-[min(78vw,340px)] rounded-full object-cover ring-1 ring-white/15 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)]"
          draggable={false}
        />
        {name && (
          <figcaption className="text-[15px] font-semibold tracking-[-0.01em] text-white/90">
            {name}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body,
  )
}

export default AvatarZoomModal
