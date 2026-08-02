import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/* SPA 라우트 전환 시 스크롤 관리.
   브라우저는 라우트가 바뀌어도 같은 문서라 스크롤을 그대로 두기 때문에
   ① 새 이동(PUSH/REPLACE)은 맨 위에서 시작하고
   ② 뒤로/앞으로가기(POP)는 떠날 때의 위치로 되돌린다.
   위치는 history 엔트리별 고유값인 location.key로 기억하고,
   sessionStorage에 남겨 새로고침 후의 뒤로가기까지 복원한다.

   주의: 이 앱은 html/body에 overflow-x:hidden이 걸려 있어 overflow-y가
   auto로 계산되고, 그 결과 실제 페이지 스크롤러가 뷰포트(window)가 아니라
   body 요소다. window.scrollY는 항상 0이고 window.scrollTo는 무력하므로
   기록·복원 모두 실제 스크롤러 기준으로 처리해야 한다. */

const STORAGE_KEY = 'scroll-positions'

// 데이터 로딩·lazy 청크로 문서가 아직 짧을 수 있어 복원을 재시도하는 최대 시간
const RESTORE_TIMEOUT_MS = 1000

const getScrollTop = () =>
  window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

const setScrollTop = (y: number) => {
  // html의 scroll-behavior:smooth에 끌려가지 않도록 즉시 이동으로 통일
  window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })
  document.body.scrollTop = y
}

const maxScrollTop = () => {
  const html = document.documentElement
  const body = document.body
  return Math.max(
    html.scrollHeight - html.clientHeight,
    body.scrollHeight - body.clientHeight,
  )
}

function loadPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/** 목표 높이까지 문서가 자라기를 기다리며 복원 스크롤을 반복 시도.
    사용자가 직접 스크롤을 시작하면 즉시 중단해 조작을 방해하지 않는다. */
function restoreScroll(y: number) {
  const deadline = performance.now() + RESTORE_TIMEOUT_MS
  let cancelled = false
  let rafId = 0

  const cancel = () => {
    cancelled = true
    cancelAnimationFrame(rafId)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    window.removeEventListener('keydown', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })
  window.addEventListener('keydown', cancel)

  const attempt = () => {
    if (cancelled) return
    setScrollTop(y)
    if (maxScrollTop() >= y || performance.now() > deadline) {
      cancel()
      return
    }
    rafId = requestAnimationFrame(attempt)
  }
  attempt()
}

export default function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef<Record<string, number>>(loadPositions())
  const currentKey = useRef(location.key)

  useEffect(() => {
    // 브라우저 자체 복원(popstate 시점의 auto 스크롤)과 싸우지 않도록 직접 관리
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const record = () => {
      positions.current[currentKey.current] = getScrollTop()
    }
    // 요소 스크롤(body)은 window까지 버블되지 않으므로 capture로 가로챈다
    window.addEventListener('scroll', record, { passive: true, capture: true })

    // 새로고침·탭 종료 직전 위치를 저장해 두면 복귀 후 뒤로가기도 이어진다
    const persist = () => {
      record()
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions.current))
      } catch {
        /* 저장 불가(시크릿 모드 등)여도 세션 내 복원은 동작 */
      }
    }
    window.addEventListener('pagehide', persist)

    return () => {
      window.removeEventListener('scroll', record, { capture: true })
      window.removeEventListener('pagehide', persist)
    }
  }, [])

  // 라우트 페이지의 자체 스크롤 효과(딥링크 절 이동 등)보다 먼저 실행되도록 layout 시점에 처리
  useLayoutEffect(() => {
    currentKey.current = location.key
    if (navigationType === 'POP') {
      const saved = positions.current[location.key]
      if (saved != null && saved > 0) {
        restoreScroll(saved)
        return
      }
    }
    setScrollTop(0)
  }, [location.key, navigationType])

  return null
}
