// 오디오북 진행바·별의 부드러운 이동.
// BibleAudioPlayer 에서 분리: 플레이어는 재생 상태만 다루고, 진행 표시를 매 프레임 어떻게
// 움직일지(DOM 직접 조작·보간)는 여기서 담당한다.
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

interface UseSmoothProgressOptions {
  audioRef: RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  /** 총길이(초). 모르면(스트리밍) 0 이하 */
  duration: number
  /** 멈춰 있을 때 그릴 진행률(0~1) — 상태값 기준 */
  progress: number
}

/**
 * 진행바·별은 리렌더 없이 DOM 을 직접 움직인다(재생 중엔 매 프레임).
 * - currentTime 상태는 초 단위로만 바뀌어(리렌더 절약) 그대로 그리면 1초마다 뚝뚝 끊긴다.
 * - width/left 는 정수 픽셀로 스냅돼 장 하나(수 분)를 수백 px 에 그리면 초당 1~2px 씩
 *   계단처럼 움직인다 → transform(translateX)으로 서브픽셀 합성 이동.
 * - audio.currentTime 은 브라우저에 따라 수십~수백 ms 단위로만 갱신돼 → 값이 그대로인
 *   프레임은 마지막 값에서 경과 시간 × 배속으로 보간한다.
 *
 * 돌려주는 ref 를 채움 요소(본 카드·접힌 띠·미니)와 별 래퍼에 붙이면 된다.
 * 붙지 않은(렌더되지 않은) ref 는 건너뛴다.
 */
export const useSmoothProgress = ({ audioRef, isPlaying, duration, progress }: UseSmoothProgressOptions) => {
  const fillRef = useRef<HTMLDivElement>(null)
  const starRef = useRef<HTMLDivElement>(null)
  const collapsedFillRef = useRef<HTMLSpanElement>(null)
  const miniFillRef = useRef<HTMLDivElement>(null)
  const applyProgress = (p: number) => {
    const fill = `translate3d(${(p - 1) * 100}%,0,0)`
    if (fillRef.current) fillRef.current.style.transform = fill
    if (collapsedFillRef.current) collapsedFillRef.current.style.transform = fill
    if (miniFillRef.current) miniFillRef.current.style.transform = fill
    if (starRef.current) starRef.current.style.transform = `translate3d(${p * 100}%,0,0)`
  }
  // 멈춰 있을 때(일시정지·위치 이동·마운트)는 상태값으로 맞춘다.
  // 의존성 없이 매 렌더 — 접기/펼치기·미니 전환으로 새로 붙은 요소도 바로 맞춰야 한다.
  useLayoutEffect(() => {
    if (!isPlaying) applyProgress(progress)
  })
  useEffect(() => {
    if (!isPlaying || duration <= 0) return
    let raf = 0
    let lastMedia = -1
    let lastAt = 0
    const tick = (now: number) => {
      const a = audioRef.current
      if (a) {
        let t = a.currentTime
        if (t !== lastMedia) {
          lastMedia = t
          lastAt = now
        } else if (!a.paused) {
          // 갱신 주기 사이 보간 — 최대 0.5초까지만(버퍼링 멈춤 시 앞서 달리지 않게)
          t += Math.min(0.5, ((now - lastAt) / 1000) * a.playbackRate)
        }
        applyProgress(Math.min(1, Math.max(0, t / duration)))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, duration, audioRef])

  return { fillRef, starRef, collapsedFillRef, miniFillRef }
}
