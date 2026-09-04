import { API_V1 } from '../config/api'
import type { BibleTTSVoice } from '../types/bible'

/** 절별 낭독 시작 시각(초) — 백엔드가 mp3 생성 시 WordBoundary로 산출해 캐시 */
export interface VerseTiming {
  verse: number
  start: number
}

export interface TtsTimingsResponse {
  verses: VerseTiming[]
  /** true면 스트리밍 생성 중이라 "지금까지 합성된 구간"만 담긴 부분 응답 */
  partial: boolean
}

/**
 * 장 오디오 스트리밍 URL. <audio src>에 직접 건다.
 * 캐시가 없으면 백엔드가 생성되는 즉시 스트리밍하고, 있으면 캐시 파일로 리다이렉트된다.
 */
export const getTtsStreamUrl = (bookNumber: number, chapter: number, voice: BibleTTSVoice): string =>
  `${API_V1}/bible/tts/${bookNumber}/${chapter}?voice=${voice}`

/**
 * 절별 타이밍 조회. 캐시된 장은 첫 응답에 최종본(partial=false)이 온다.
 * 응답이 비정상(HTTP 오류·형식 불일치)이면 null — 호출자가 재시도 여부를 정한다.
 */
export const fetchTtsTimings = async (
  bookNumber: number,
  chapter: number,
  voice: BibleTTSVoice,
  signal?: AbortSignal
): Promise<TtsTimingsResponse | null> => {
  const res = await fetch(`${API_V1}/bible/tts/${bookNumber}/${chapter}/timings?voice=${voice}`, { signal })
  if (!res.ok) return null
  const data = await res.json()
  const verses: VerseTiming[] = Array.isArray(data?.verses) ? data.verses : []
  return { verses, partial: !!data?.partial }
}
