import { useEffect } from 'react'

// 잠금은 개수로 센다 — 겹쳐 열린 오버레이가 어떤 순서로 닫혀도 마지막 하나가 내려갈 때만 풀린다.
// (예전엔 각자 "잠그기 전 값"을 기억했다가 되돌려서, 바깥 것이 먼저 닫히면 안쪽이 떠 있는데도 풀렸다)
let lockCount = 0
let overflowBeforeLock = ''

/**
 * body 스크롤을 잠그고, 푸는 함수를 돌려준다. body 가 실제 스크롤러라(#root 는 clip) overflow 만 막으면 된다.
 * 돌려받은 함수는 여러 번 불러도 한 번만 센다.
 */
export const lockBodyScroll = (): (() => void) => {
  if (lockCount === 0) {
    overflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    lockCount -= 1
    if (lockCount === 0) document.body.style.overflow = overflowBeforeLock
  }
}

/**
 * 지금 화면 전체를 덮는 fixed 층(모달 배경·전체화면 시트)이 떠 있는가.
 *
 * useModalBackButton 이 "이 호출이 진짜 오버레이인지" 가리는 데 쓴다 — 그 훅은 검색어 지우기·
 * PC 도킹 패널·모바일 상세 전환처럼 화면을 덮지 않는 곳에서도 쓰여, 무조건 잠그면 본문이 멈춘다.
 * 화면 한가운데에 쌓인 요소들 중 뷰포트를 다 덮는 position:fixed 조상이 있으면 오버레이로 본다
 * (헤더·하단 독·플로팅 버튼은 화면을 다 덮지 않고, pointer-events:none 장식 층은 애초에 안 잡힌다).
 */
export const hasViewportOverlay = (): boolean => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const seen = new Set<Element>()
  for (const hit of document.elementsFromPoint(vw / 2, vh / 2)) {
    for (let el: Element | null = hit; el && el !== document.body && !seen.has(el); el = el.parentElement) {
      seen.add(el)
      if (getComputedStyle(el).position !== 'fixed') continue
      const r = el.getBoundingClientRect()
      if (r.left <= 1 && r.top <= 1 && r.right >= vw - 1 && r.bottom >= vh - 1) return true
    }
  }
  return false
}

/**
 * 오버레이(시트·전체화면 읽기·축하 연출)가 떠 있는 동안 뒤 페이지가 같이 굴러가지 않게
 * body 스크롤을 잠근다.
 *
 * @param active 기본 true. 조건부로 뜨는 다이얼로그는 열림 여부를 넘긴다.
 */
export const useBodyScrollLock = (active: boolean = true): void => {
  useEffect(() => {
    if (!active) return
    return lockBodyScroll()
  }, [active])
}
