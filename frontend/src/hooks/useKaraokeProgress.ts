import { useEffect, useRef, useState } from 'react'
import {
  advanceKaraokeMatch,
  splitIndexForProgress,
  INITIAL_KARAOKE_STATE,
  type KaraokeMatchState,
} from '../utils/karaokeMatch'

interface UseKaraokeProgressOptions {
  /** 음성 인식 진행 중 여부 — false가 되면 진행률이 초기화된다 */
  isReading: boolean
  /** 낭독 대상 본문 */
  verseText: string
  /** 인식 엔진이 지금까지 들려준 발화 (interim 포함) */
  spokenText: string
}

/**
 * 노래방식 낭독 하이라이트 — 색칠 경계(원본 텍스트 인덱스)를 돌려준다.
 * 인식 결과는 목표 진행률만 갱신하고(utils/karaokeMatch), 실제 경계는
 * rAF 보간으로 목표를 향해 부드럽게 따라간다.
 */
export const useKaraokeProgress = ({
  isReading,
  verseText,
  spokenText,
}: UseKaraokeProgressOptions): number => {
  const matchRef = useRef<KaraokeMatchState>(INITIAL_KARAOKE_STATE)
  const displayProgressRef = useRef(0) // 화면에 그려지는 진행률 — rAF로 목표를 따라감
  const [splitIndex, setSplitIndex] = useState(0)

  // 읽기 종료 시 진행률 초기화 (다음 세션이 0에서 시작하도록)
  useEffect(() => {
    if (!isReading) {
      matchRef.current = INITIAL_KARAOKE_STATE
      displayProgressRef.current = 0
    }
  }, [isReading])

  // splitIndex 리셋은 렌더 단계에서 — effect 내 setState로 인한 연쇄 렌더를 피한다.
  // (React 공식 "props 변화에 따른 state 조정" 패턴)
  const [prevReading, setPrevReading] = useState(isReading)
  if (prevReading !== isReading) {
    setPrevReading(isReading)
    if (!isReading) setSplitIndex(0)
  }

  // 1/2 — 인식 결과(spokenText)로 목표 진행률 갱신
  useEffect(() => {
    if (!isReading || !verseText || !spokenText) {
      return
    }
    matchRef.current = advanceKaraokeMatch(verseText, spokenText, matchRef.current)
  }, [isReading, spokenText, verseText])

  // 2/2 — rAF 보간으로 경계를 "스르륵" 전진.
  // 모바일은 인식 이벤트 간격이 듬성듬성해(iOS interim 빈도 낮음, Android는
  // continuous=false 재시작 공백) 경계가 여러 글자씩 점프하는데, 프레임마다
  // 남은 거리에 비례해 전진(멀수록 빠르게, 가까울수록 살살)하며 그 사이를 메운다.
  // setState는 경계 "글자"가 실제로 바뀔 때만 값이 달라져 리렌더 부담이 없다.
  useEffect(() => {
    if (!isReading || !verseText) {
      return
    }
    if (verseText.replace(/\s+/g, '').length === 0) {
      return
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1) // 백그라운드 복귀 시 순간이동 방지
      last = now
      const target = matchRef.current.progress
      const current = displayProgressRef.current
      if (current < target) {
        // 남은 거리의 400%/s + 최소 8%/s(자연 낭독 속도 ~7%/s보다 살짝 빠르게)
        const speed = Math.max((target - current) * 4, 8)
        displayProgressRef.current = Math.min(target, current + speed * dt)
        setSplitIndex(splitIndexForProgress(verseText, displayProgressRef.current))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isReading, verseText])

  return splitIndex
}
