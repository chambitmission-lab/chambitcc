import { useEffect } from 'react'

/**
 * 오버레이(시트·전체화면 읽기·축하 연출)가 떠 있는 동안 뒤 페이지가 같이 굴러가지 않게
 * body 스크롤을 잠근다. body 가 실제 스크롤러라(#root 는 clip) overflow 만 막으면 된다.
 *
 * 내릴 때는 잠그기 전 값을 그대로 되돌린다 — 겹쳐 열린 오버레이가 순서대로 닫히면
 * 바깥 것이 마지막에 원래 값으로 복원한다.
 *
 * @param active 기본 true. 조건부로 뜨는 다이얼로그는 열림 여부를 넘긴다.
 */
export const useBodyScrollLock = (active: boolean = true): void => {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}
