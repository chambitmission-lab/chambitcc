import { useEffect, useState } from 'react'
import { fetchTtsTimings, type VerseTiming } from '../../../api/bibleTts'
import type { BibleTTSVoice } from '../../../types/bible'

/** 부분 응답이 이어질 때 다시 물어보는 간격과 상한(약 5분) */
const POLL_INTERVAL_MS = 2500
const MAX_ATTEMPTS = 120

interface UseTtsTimingsOptions {
  /** 재생을 시작한 뒤에만 조회한다 — 듣지 않는 사람에게 요청을 만들지 않게 */
  enabled: boolean
  bookNumber: number
  chapter: number
  voice: BibleTTSVoice
}

/**
 * 절별 낭독 타이밍. 캐시된 장은 한 번에 최종본이 오고,
 * 첫 재생(스트리밍 생성 중)엔 서버가 부분(partial) 타이밍을 돌려주므로
 * 최종본이 올 때까지 짧은 간격으로 다시 조회한다 —
 * 앞 절들 하이라이트가 생성 완료를 기다리지 않고 거의 바로 붙는다.
 * 음성이 바뀌면 오디오가 달라지므로 타이밍도 다시 받는다(null로 초기화).
 */
export const useTtsTimings = ({ enabled, bookNumber, chapter, voice }: UseTtsTimingsOptions) => {
  const [timings, setTimings] = useState<VerseTiming[] | null>(null)

  useEffect(() => {
    setTimings(null)
    if (!enabled) return
    const controller = new AbortController()
    let timer: number | undefined
    let attempts = 0

    const load = async () => {
      try {
        const data = await fetchTtsTimings(bookNumber, chapter, voice, controller.signal)
        if (controller.signal.aborted) return
        if (data) {
          if (data.verses.length > 0) setTimings(data.verses)
          if (!data.partial) return // 최종본 도착 → 조회 종료
        }
      } catch {
        // 네트워크 오류 → 아래에서 재시도
      }
      if (!controller.signal.aborted && ++attempts < MAX_ATTEMPTS) {
        timer = window.setTimeout(load, POLL_INTERVAL_MS)
      }
    }
    load()

    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [enabled, voice, bookNumber, chapter])

  return timings
}
