import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import './PullToRefresh.css'

/* 토스 스타일 커스텀 당겨서 새로고침.
   브라우저 기본 PTR(전체 페이지 리로드)은 index.css의 overscroll-behavior-y로 차단하고,
   여기서 터치 제스처를 직접 추적해 ① 당김 진행률에 따라 차오르는 원형 버블을 띄우고
   ② 놓으면 리로드 대신 react-query 활성 쿼리만 refetch한다. */

// 감쇠(고무줄) 적용 후 버블이 내려올 수 있는 최대 거리
const MAX_PULL = 110
// 이 거리 이상 당긴 채 놓으면 새로고침 발동
const THRESHOLD = 72
// 스피너 최소 표시 시간 — 캐시 히트로 즉시 끝나면 깜빡임처럼 보여서 되려 어색하다
const MIN_SPIN_MS = 800

const ARC_RADIUS = 7.5
const ARC_LEN = 2 * Math.PI * ARC_RADIUS

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done'

/** 이 터치 지점에서 당겨서 새로고침을 시작해도 되는가 —
    조상 중 스크롤이 내려가 있거나(fixed 오버레이 포함) 문서가 최상단이 아니면 금지.
    fixed 조상 검사로 헤더·모달·바텀시트 안에서의 오발동을 막는다. */
function canStartPull(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  let el: Element | null = target
  while (el && el !== document.documentElement) {
    if (el.scrollTop > 0) return false
    if (window.getComputedStyle(el).position === 'fixed') return false
    el = el.parentElement
  }
  return (document.documentElement.scrollTop || 0) === 0
}

export default function PullToRefresh() {
  const queryClient = useQueryClient()
  const bubbleRef = useRef<HTMLDivElement>(null)
  const arcRef = useRef<SVGCircleElement>(null)
  const [phase, setPhaseState] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')

  useEffect(() => {
    const setPhase = (p: Phase) => {
      phaseRef.current = p
      setPhaseState(p)
    }

    let startX = 0
    let startY = 0
    let tracking = false // 터치 시작점이 유효해 지켜보는 중
    let pulling = false // 실제로 아래로 당기는 중 (버블 표시)
    let buzzed = false // 임계점 햅틱은 제스처당 1회
    let progress = 0

    const paint = (rawDy: number) => {
      const bubble = bubbleRef.current
      const arc = arcRef.current
      if (!bubble || !arc) return
      const d = MAX_PULL * (1 - Math.exp(-rawDy / 140)) // 고무줄 감쇠
      progress = Math.min(d / THRESHOLD, 1)
      bubble.style.transition = 'none'
      bubble.style.opacity = String(Math.min(d / 36, 1))
      // 임계점 도달 순간 살짝 커지는 스냅 — 진동과 함께 "여기서 놓으면 된다"는 신호
      const scale = 0.65 + 0.35 * progress + (progress >= 1 ? 0.06 : 0)
      bubble.style.transform = `translate3d(0, ${16 + d}px, 0) scale(${scale})`
      arc.style.transform = `rotate(${-90 + rawDy * 0.35}deg)`
      arc.style.strokeDashoffset = String(ARC_LEN * (1 - 0.8 * progress))
      if (progress >= 1 && !buzzed) {
        buzzed = true
        navigator.vibrate?.(10)
      }
    }

    const collapse = () => {
      const bubble = bubbleRef.current
      if (bubble) {
        bubble.style.transition = 'transform 0.25s ease, opacity 0.2s ease'
        bubble.style.opacity = '0'
        bubble.style.transform = 'translate3d(0, 6px, 0) scale(0.5)'
      }
      progress = 0
      window.setTimeout(() => setPhase('idle'), 260)
    }

    const exitAfterDone = () => {
      const bubble = bubbleRef.current
      if (bubble) {
        bubble.style.transition = 'transform 0.3s ease, opacity 0.25s ease'
        bubble.style.opacity = '0'
        bubble.style.transform = `translate3d(0, ${8 + THRESHOLD}px, 0) scale(0.5)`
      }
      window.setTimeout(() => setPhase('idle'), 300)
    }

    const startRefresh = async () => {
      setPhase('refreshing')
      progress = 0
      const bubble = bubbleRef.current
      const arc = arcRef.current
      if (bubble) {
        bubble.style.transition =
          'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease'
        bubble.style.opacity = '1'
        bubble.style.transform = `translate3d(0, ${16 + THRESHOLD}px, 0) scale(1)`
      }
      if (arc) {
        // 이후 모양은 CSS 클래스(스피너/체크)가 담당하므로 인라인 값 제거
        arc.style.transform = ''
        arc.style.strokeDashoffset = ''
      }
      // react-query를 안 쓰는 화면도 각자 갱신할 수 있게 이벤트로 알린다
      window.dispatchEvent(new CustomEvent('app:pull-to-refresh'))
      await Promise.allSettled([
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
      ])
      setPhase('done') // 원이 완성되며 체크마크가 그려진다
      window.setTimeout(exitAfterDone, 550)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (phaseRef.current === 'refreshing' || phaseRef.current === 'done') return
      tracking = e.touches.length === 1 && canStartPull(e.target)
      if (!tracking) return
      pulling = false
      buzzed = false
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      if (e.touches.length !== 1) {
        tracking = false
        if (pulling) collapse()
        return
      }
      const dy = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX
      if (!pulling) {
        // 방향이 확정되기 전 — 위로 스크롤이나 가로 스와이프면 이번 제스처는 포기
        if (dy < 0 || Math.abs(dx) > Math.abs(dy)) {
          tracking = false
          return
        }
        if (dy < 8) return
        pulling = true
        setPhase('pulling')
      }
      if (dy <= 0) {
        tracking = false
        pulling = false
        collapse()
        return
      }
      // 최상단에서 아래로 당기는 중일 때만 기본 스크롤(iOS 바운스 등)을 막는다
      if (e.cancelable) e.preventDefault()
      paint(dy)
    }

    const onTouchEnd = () => {
      if (!tracking) return
      tracking = false
      if (!pulling) return
      pulling = false
      if (progress >= 1) void startRefresh()
      else collapse()
    }

    // capture: 페이지 컴포넌트가 stopPropagation해도 제스처 추적이 끊기지 않게
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
    window.addEventListener('touchend', onTouchEnd, { capture: true })
    window.addEventListener('touchcancel', onTouchEnd, { capture: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true })
      window.removeEventListener('touchmove', onTouchMove, { capture: true })
      window.removeEventListener('touchend', onTouchEnd, { capture: true })
      window.removeEventListener('touchcancel', onTouchEnd, { capture: true })
    }
  }, [queryClient])

  return (
    <div ref={bubbleRef} className={`ptr-bubble ptr-${phase}`} aria-hidden="true">
      <svg className="ptr-svg" viewBox="0 0 20 20">
        <circle
          ref={arcRef}
          className="ptr-arc"
          cx="10"
          cy="10"
          r={ARC_RADIUS}
          fill="none"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN}
        />
        <path className="ptr-check" d="M6.5 10.2l2.4 2.4 4.6-4.9" fill="none" />
      </svg>
    </div>
  )
}
