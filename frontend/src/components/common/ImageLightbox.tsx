/**
 * 이미지 라이트박스 — 포스터 한 장을 전체화면으로 크게 보는 공용 뷰어.
 *
 * 공지 팝업처럼 카드 안에 작게 들어가는 이미지는 "글씨가 안 읽힌다"가 곧 내용 손실이라
 * 탭 한 번으로 화면 전체를 쓰는 확대 보기를 띄운다.
 *  - 모바일: 핀치 확대 · 두 번 탭 확대 · 끌어서 이동 · (원본 크기일 때) 아래로 밀어 닫기
 *  - PC: 휠 확대(커서 지점 기준) · 드래그 이동 · +/-/0 · Esc
 * 확대 기준점은 항상 손가락/커서 자리 — 화면 중앙으로 튀면 보려던 글씨를 놓친다.
 *
 * 오버레이는 body 로 포털한다. 호출부(공지 팝업 등)가 이미 z-index 를 쌓은
 * 고정 레이어 안이라, 그 안에서 렌더하면 부모의 stacking context 에 갇힌다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../hooks/useModalBackButton'

const MIN_SCALE = 1
const MAX_SCALE = 6
/** 두 번 탭했을 때의 배율 — 포스터 본문 글씨가 읽히기 시작하는 지점 */
const TAP_SCALE = 2.6
/** 원본 크기에서 아래로 이만큼 밀면 닫는다 */
const DISMISS_PX = 110

type View = { scale: number; x: number; y: number }

interface ImageLightboxProps {
  src: string
  /** 상단에 남기는 설명 — 어떤 공지의 포스터인지 */
  caption?: string
  alt?: string
  onClose: () => void
}

const ImageLightbox = ({ src, caption, alt, onClose }: ImageLightboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 })
  const [dismissY, setDismissY] = useState(0)
  // 아래로 미는 중 이동량 — 제스처 리스너는 한 번만 붙어야 해서 ref 로도 읽는다
  const dismissRef = useRef(0)
  const [loaded, setLoaded] = useState(false)
  const [showHint, setShowHint] = useState(true)
  // 안내 문구는 기기 말투에 맞춘다 — PC에서 "손가락을 벌려"는 알아들을 수 없는 안내다
  const [pointerHint] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  // 핀치/드래그 중에는 transition 을 꺼야 손가락에 붙어 움직인다
  const [animating, setAnimating] = useState(false)

  // 네이티브 리스너(휠·터치는 passive:false 가 필요)에서 최신 값을 읽기 위한 거울.
  // 커밋 후에 갱신되므로 사용자 입력이 들어오는 시점에는 항상 최신이다.
  const viewRef = useRef(view)
  const closeRef = useRef(onClose)
  useEffect(() => {
    viewRef.current = view
    closeRef.current = onClose
  })

  useModalBackButton(onClose)

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(false), 2600)
    return () => window.clearTimeout(t)
  }, [])

  /** 이미지가 화면 밖으로 달아나지 않게 이동량을 가둔다 */
  const clamp = useCallback((x: number, y: number, scale: number) => {
    const img = imgRef.current
    const box = containerRef.current
    if (!img || !box) return { x, y }
    const maxX = Math.max(0, (img.offsetWidth * scale - box.clientWidth) / 2)
    const maxY = Math.max(0, (img.offsetHeight * scale - box.clientHeight) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }, [])

  /**
   * focal(컨테이너 중앙 기준 좌표)을 고정한 채 배율만 바꾼다.
   * 화면점 p = t + s·u 이므로, u 를 유지하려면 t' = p - (p - t)·(s'/s).
   */
  const zoomAround = useCallback(
    (nextRaw: number, focal?: { x: number; y: number }, base?: View) => {
      const from = base ?? viewRef.current
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextRaw))
      const fx = focal?.x ?? 0
      const fy = focal?.y ?? 0
      const ratio = next / from.scale
      const moved =
        next === MIN_SCALE
          ? { x: 0, y: 0 }
          : clamp(fx - (fx - from.x) * ratio, fy - (fy - from.y) * ratio, next)
      setView({ scale: next, ...moved })
    },
    [clamp],
  )

  const reset = useCallback(() => {
    setAnimating(true)
    setView({ scale: 1, x: 0, y: 0 })
  }, [])

  /** 클라이언트 좌표 → 컨테이너 중앙 기준 좌표 */
  const toFocal = useCallback((clientX: number, clientY: number) => {
    const box = containerRef.current
    if (!box) return { x: 0, y: 0 }
    const rect = box.getBoundingClientRect()
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 }
  }, [])

  const toggleZoomAt = useCallback(
    (clientX: number, clientY: number) => {
      setAnimating(true)
      if (viewRef.current.scale > 1.05) zoomAround(MIN_SCALE)
      else zoomAround(TAP_SCALE, toFocal(clientX, clientY))
    },
    [toFocal, zoomAround],
  )

  // 휠 확대 + 핀치/드래그 — 브라우저 기본 스크롤·확대를 막아야 해서 네이티브로 붙인다
  useEffect(() => {
    const box = containerRef.current
    if (!box) return

    const g = {
      pinch: false,
      dragging: false,
      startDist: 0,
      startView: { scale: 1, x: 0, y: 0 } as View,
      startPoint: { x: 0, y: 0 },
      focal: { x: 0, y: 0 },
      moved: false,
      lastTap: 0,
    }

    const midpoint = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    })
    const distance = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setAnimating(false)
      // 트랙패드/휠 모두 자연스럽게 — 지수 스케일이라 방향이 바뀌어도 대칭이다
      zoomAround(viewRef.current.scale * Math.exp(-e.deltaY * 0.0022), toFocal(e.clientX, e.clientY))
    }

    const onTouchStart = (e: TouchEvent) => {
      setAnimating(false)
      g.moved = false
      g.startView = viewRef.current
      if (e.touches.length === 2) {
        g.pinch = true
        g.dragging = false
        g.startDist = distance(e.touches)
        const mid = midpoint(e.touches)
        g.startPoint = mid
        g.focal = toFocal(mid.x, mid.y)
      } else if (e.touches.length === 1) {
        g.pinch = false
        g.dragging = true
        g.startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && g.pinch) {
        e.preventDefault()
        const dist = distance(e.touches)
        if (!g.startDist) return
        const mid = midpoint(e.touches)
        const next = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, g.startView.scale * (dist / g.startDist)),
        )
        const ratio = next / g.startView.scale
        // 확대 기준점 유지 + 두 손가락 중심이 움직인 만큼 같이 끌린다
        const panX = mid.x - g.startPoint.x
        const panY = mid.y - g.startPoint.y
        const moved = clamp(
          g.focal.x - (g.focal.x - g.startView.x) * ratio + panX,
          g.focal.y - (g.focal.y - g.startView.y) * ratio + panY,
          next,
        )
        g.moved = true
        setView({ scale: next, ...moved })
        return
      }

      if (e.touches.length !== 1 || !g.dragging) return
      const dx = e.touches[0].clientX - g.startPoint.x
      const dy = e.touches[0].clientY - g.startPoint.y
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true

      if (g.startView.scale > 1.02) {
        e.preventDefault()
        setView({ scale: g.startView.scale, ...clamp(g.startView.x + dx, g.startView.y + dy, g.startView.scale) })
      } else if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
        // 원본 크기에서 아래로 미는 동작은 '닫기'로 — 사진 앱과 같은 감각
        e.preventDefault()
        dismissRef.current = dy
        setDismissY(dy)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (g.pinch && e.touches.length === 0) {
        g.pinch = false
        // 손을 떼는 순간 1배 근처면 딱 맞춰 정렬
        if (viewRef.current.scale <= 1.05) reset()
        return
      }
      if (e.touches.length > 0) return

      const wasDragging = g.dragging
      g.dragging = false

      if (dismissRef.current > DISMISS_PX) {
        closeRef.current()
        return
      }
      if (dismissRef.current !== 0) {
        setAnimating(true)
        dismissRef.current = 0
        setDismissY(0)
      }

      if (wasDragging && !g.moved) {
        const touch = e.changedTouches[0]
        const now = Date.now()
        if (now - g.lastTap < 300) {
          g.lastTap = 0
          toggleZoomAt(touch.clientX, touch.clientY)
        } else {
          g.lastTap = now
        }
      }
    }

    box.addEventListener('wheel', onWheel, { passive: false })
    box.addEventListener('touchstart', onTouchStart, { passive: false })
    box.addEventListener('touchmove', onTouchMove, { passive: false })
    box.addEventListener('touchend', onTouchEnd)
    box.addEventListener('touchcancel', onTouchEnd)
    return () => {
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('touchstart', onTouchStart)
      box.removeEventListener('touchmove', onTouchMove)
      box.removeEventListener('touchend', onTouchEnd)
      box.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [clamp, reset, toFocal, toggleZoomAt, zoomAround])

  // PC 드래그 이동
  useEffect(() => {
    if (view.scale <= 1.02) return
    let start: { x: number; y: number; view: View } | null = null

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      start = { x: e.clientX, y: e.clientY, view: viewRef.current }
      setAnimating(false)
    }
    const onMove = (e: MouseEvent) => {
      if (!start) return
      e.preventDefault()
      const { view: base } = start
      setView({
        scale: base.scale,
        ...clamp(base.x + (e.clientX - start.x), base.y + (e.clientY - start.y), base.scale),
      })
    }
    const onUp = () => {
      start = null
    }

    const box = containerRef.current
    box?.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      box?.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [clamp, view.scale])

  // 키보드 — 확대 보기는 PC에서 오래 들여다보는 화면이라 단축키가 실제로 쓰인다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      } else if (e.key === '+' || e.key === '=') {
        setAnimating(true)
        zoomAround(viewRef.current.scale * 1.4)
      } else if (e.key === '-' || e.key === '_') {
        setAnimating(true)
        zoomAround(viewRef.current.scale / 1.4)
      } else if (e.key === '0') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset, zoomAround])

  const zoomed = view.scale > 1.02
  const dismissing = dismissY > 0

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{
        background: `rgba(8, 8, 10, ${dismissing ? Math.max(0.5, 1 - dismissY / 320) : 0.96})`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={caption ? `${caption} 확대 보기` : '이미지 확대 보기'}
    >
      {/* 상단 — 무엇을 보고 있는지 + 닫기 */}
      <div
        className="relative z-10 flex shrink-0 items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3"
        style={{ opacity: dismissing ? 0.3 : 1, transition: 'opacity 0.15s' }}
      >
        {caption && (
          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white/85">
            {caption}
          </p>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            원본
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="확대 보기 닫기"
            autoFocus
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 이미지 무대 — 여기서만 제스처를 받는다 */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: 'none', cursor: zoomed ? 'grab' : 'zoom-in' }}
        onDoubleClick={(e) => toggleZoomAt(e.clientX, e.clientY)}
        onClick={(e) => {
          // 포스터 바깥 여백을 누르면 닫기 — 원본 크기일 때만 (확대 중엔 이동이 우선)
          if (e.target === e.currentTarget && !zoomed) onClose()
        }}
      >
        {!loaded && (
          <span
            className="absolute h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white/80"
            aria-hidden
          />
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? caption ?? ''}
          draggable={false}
          onLoad={() => setLoaded(true)}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate3d(${view.x}px, ${view.y + dismissY}px, 0) scale(${view.scale})`,
            transition: animating && !dismissing ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            opacity: loaded ? 1 : 0,
          }}
        />
      </div>

      {/* 하단 — 배율 조절. 손가락으로도 되지만 PC에선 이게 유일한 확대 손잡이다 */}
      <div
        className="relative z-10 flex shrink-0 items-center justify-center gap-2 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3"
        style={{ opacity: dismissing ? 0 : 1, transition: 'opacity 0.15s' }}
      >
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
          <button
            type="button"
            aria-label="축소"
            disabled={view.scale <= MIN_SCALE + 0.01}
            onClick={() => {
              setAnimating(true)
              zoomAround(view.scale / 1.4)
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={reset}
            className="min-w-[54px] px-1 text-center text-[12.5px] font-bold tabular-nums text-white/85"
            aria-label="원래 크기로"
          >
            {Math.round(view.scale * 100)}%
          </button>
          <button
            type="button"
            aria-label="확대"
            disabled={view.scale >= MAX_SCALE - 0.01}
            onClick={() => {
              setAnimating(true)
              zoomAround(view.scale * 1.4)
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* 처음 2.6초만 뜨는 사용법 — 계속 떠 있으면 포스터를 가린다 */}
      {showHint && !zoomed && (
        <span
          className="pointer-events-none absolute bottom-[86px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-3.5 py-1.5 text-[11.5px] font-medium text-white/80"
          style={{ animation: 'notice-zoom-hint 2.6s ease-out forwards' }}
        >
          {pointerHint
            ? '휠로 확대 · 두 번 클릭 · 끌어서 이동'
            : '두 번 탭하거나 손가락을 벌려 확대 · 아래로 밀면 닫기'}
        </span>
      )}
      <style>{`
        @keyframes notice-zoom-hint {
          0% { opacity: 0; transform: translate(-50%, 6px); }
          12%, 78% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>,
    document.body,
  )
}

export default ImageLightbox
