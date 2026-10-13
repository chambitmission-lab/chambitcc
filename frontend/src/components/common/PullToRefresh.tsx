import { useEffect, useRef, useState } from 'react'
import { useQueryClient, type InfiniteData, type Query } from '@tanstack/react-query'
import './PullToRefresh.css'

/* 토스 스타일 커스텀 당겨서 새로고침.
   브라우저 기본 PTR(전체 페이지 리로드)은 index.css의 overscroll-behavior-y로 차단하고,
   여기서 터치 제스처를 직접 추적해 ① 당김 진행률에 따라 차오르는 원형 버블을 띄우고
   ② 놓으면 리로드 대신 react-query 활성 쿼리만 refetch한다. */

// 감쇠(고무줄) 적용 후 버블이 내려올 수 있는 최대 거리
const MAX_PULL = 110
// 감쇠 거리 기준 발동 임계점. 감쇠식(MAX_PULL·(1-e^(-dy/140)))을 거꾸로 풀면
// 손가락 실제 이동 약 100px — 72 였을 때는 150px 을 끌어야 해서 "당겼는데 안 된다"가 잦았다
const THRESHOLD = 56
// 새로고침 중 버블이 머무는 자리(헤더 바로 아래). 임계점과 분리해 둬야 임계점을 낮춰도 위치가 안 올라간다
const REST_Y = 88
// 스피너 최소 표시 시간 — 캐시 히트로 즉시 끝나면 깜빡임처럼 보여서 되려 어색하다
const MIN_SPIN_MS = 500
// 체크마크가 보이는 시간
const DONE_MS = 400
// 요청이 매달려도 스피너가 이보다 오래 돌지 않는다 — 나머지는 뒤에서 조용히 끝난다
const MAX_WAIT_MS = 3000

/* 새로고침을 두 단계로 나눈다.
   백엔드(단일 uvicorn)는 동시 요청을 거의 순서대로 처리해서, 홈의 20여 개 쿼리를 한꺼번에
   다시 받으면 단독 100ms 짜리 기도 목록이 맨 뒤로 밀려 1초 넘게 걸린다(utils/requestPriority 와
   같은 현상). 그래서 화면의 중심 목록(기도·감사·알림)만 먼저 받아 스피너를 거기에 묶고,
   끝난 뒤에 나머지 위젯 쿼리를 출발시켜 뒤에서 갈아끼운다.
   이 접두사가 활성 쿼리에 하나도 없는 화면(성경·소식 등)은 예전처럼 전부 기다린다. */
const PRIMARY_KEY_PREFIXES = new Set(['prayers', 'thanks', 'notifications'])
const isPrimaryQuery = (query: Query) => PRIMARY_KEY_PREFIXES.has(String(query.queryKey[0]))

const ARC_RADIUS = 7.5
const ARC_LEN = 2 * Math.PI * ARC_RADIUS

type Phase = 'idle' | 'pulling' | 'refreshing' | 'done'

/** 이 터치 지점에서 당겨서 새로고침을 시작해도 되는가 —
    조상 중 스크롤이 내려가 있거나(fixed 오버레이 포함) 문서가 최상단이 아니면 금지.
    fixed 조상 검사로 헤더·모달·바텀시트 안에서의 오발동을 막는다. */
function canStartPull(target: EventTarget | null): boolean {
  // 문서가 최상단이 아니면 조상 순회 자체가 필요 없다 — 가장 흔한 경우를 먼저 자른다
  if ((document.documentElement.scrollTop || 0) !== 0) return false
  if (!(target instanceof Element)) return false
  let el: Element | null = target
  while (el && el !== document.documentElement) {
    if (el.scrollTop > 0) return false
    // getComputedStyle 은 요소마다 강제 스타일 계산을 일으킨다 — 스크롤이 내려간 조상이
    // 없을 때만(위에서 걸러짐) 여기 도달하므로 비용이 제스처당 한 번으로 제한된다
    if (window.getComputedStyle(el).position === 'fixed') return false
    el = el.parentElement
  }
  return true
}

const isInfiniteData = (data: unknown): data is InfiniteData<unknown> =>
  !!data &&
  typeof data === 'object' &&
  Array.isArray((data as InfiniteData<unknown>).pages) &&
  Array.isArray((data as InfiniteData<unknown>).pageParams)

const withTimeout = (pending: Promise<unknown>, ms: number) =>
  Promise.race([pending, new Promise((resolve) => setTimeout(resolve, ms))])

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
        bubble.style.transform = `translate3d(0, ${REST_Y - 8}px, 0) scale(0.5)`
      }
      window.setTimeout(() => setPhase('idle'), 300)
    }

    /* 무한 쿼리는 refetch 때 받아 둔 페이지를 전부 "순차로" 다시 요청한다 — 5페이지 내려갔다
       올라와 당기면 5번 왕복. usePrayersQuery 의 refetchIfFewPages 가드는 refetchQueries 에는
       적용되지 않으므로 여기서 첫 페이지만 남기고 자른다. 당김은 항상 최상단에서만 시작되니
       뒷 페이지가 사라져도 화면에 보이던 것은 그대로고, 내려가면 다시 채워진다. */
    const trimActiveInfiniteQueries = () => {
      for (const query of queryClient.getQueryCache().findAll({ type: 'active' })) {
        const data = query.state.data
        if (!isInfiniteData(data) || data.pages.length <= 1) continue
        queryClient.setQueryData(query.queryKey, {
          pages: data.pages.slice(0, 1),
          pageParams: data.pageParams.slice(0, 1),
        })
      }
    }

    const refetchInStages = async () => {
      trimActiveInfiniteQueries()
      const active = queryClient.getQueryCache().findAll({ type: 'active' })
      const staged = active.some(isPrimaryQuery)
      const primary = staged
        ? queryClient.refetchQueries({ type: 'active', predicate: isPrimaryQuery })
        : queryClient.refetchQueries({ type: 'active' })
      await withTimeout(primary.catch(() => undefined), MAX_WAIT_MS)
      // 중심 목록이 도착한 뒤에야 나머지를 보낸다 — 기다리지 않고 뒤에서 갈아끼운다
      if (staged) {
        void queryClient
          .refetchQueries({ type: 'active', predicate: (q) => !isPrimaryQuery(q) })
          .catch(() => undefined)
      }
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
        bubble.style.transform = `translate3d(0, ${REST_Y}px, 0) scale(1)`
      }
      if (arc) {
        // 이후 모양은 CSS 클래스(스피너/체크)가 담당하므로 인라인 값 제거
        arc.style.transform = ''
        arc.style.strokeDashoffset = ''
      }
      // react-query를 안 쓰는 화면도 각자 갱신할 수 있게 이벤트로 알린다
      window.dispatchEvent(new CustomEvent('app:pull-to-refresh'))
      await Promise.allSettled([
        refetchInStages(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
      ])
      setPhase('done') // 원이 완성되며 체크마크가 그려진다
      window.setTimeout(exitAfterDone, DONE_MS)
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

    // touchmove 는 기본적으로 passive 로 듣는다 — non-passive 전역 리스너는 모든 화면의
    // 모든 스크롤을 JS 핸들러가 끝날 때까지 붙잡아 "스크롤이 늦게 시작되는" 원인이 된다.
    // preventDefault 가 필요한 건 최상단에서 실제로 당기는 동안뿐이므로, 그때만
    // non-passive 리스너를 잠깐 달았다가 제스처가 끝나면 뗀다.
    let activeMoveAttached = false
    const onActiveMove = (e: TouchEvent) => {
      if (pulling && e.cancelable) e.preventDefault()
    }
    const attachActiveMove = () => {
      if (activeMoveAttached) return
      activeMoveAttached = true
      window.addEventListener('touchmove', onActiveMove, { capture: true, passive: false })
    }
    const detachActiveMove = () => {
      if (!activeMoveAttached) return
      activeMoveAttached = false
      window.removeEventListener('touchmove', onActiveMove, { capture: true })
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      if (e.touches.length !== 1) {
        tracking = false
        detachActiveMove()
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
        attachActiveMove()
        setPhase('pulling')
      }
      if (dy <= 0) {
        tracking = false
        pulling = false
        detachActiveMove()
        collapse()
        return
      }
      // 최상단에서 아래로 당기는 중일 때만 기본 스크롤(iOS 바운스 등)을 막는다
      // (이 리스너는 passive 라 여기선 못 막고, onActiveMove 가 대신 막는다)
      paint(dy)
    }

    const onTouchEnd = () => {
      detachActiveMove()
      if (!tracking) return
      tracking = false
      if (!pulling) return
      pulling = false
      if (progress >= 1) void startRefresh()
      else collapse()
    }

    // capture: 페이지 컴포넌트가 stopPropagation해도 제스처 추적이 끊기지 않게
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true })
    window.addEventListener('touchend', onTouchEnd, { capture: true })
    window.addEventListener('touchcancel', onTouchEnd, { capture: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true })
      window.removeEventListener('touchmove', onTouchMove, { capture: true })
      detachActiveMove()
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
