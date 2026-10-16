import { API_V1 } from '../config/api'
import type { BibleTTSVoice } from '../types/bible'
import { isApiError, request, requestRaw } from './utils/request'

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
  // 공용 request 경로를 탄다 — 동시 요청 제한(utils/requestPriority)에 줄을 서야 본문 요청과 경쟁하지 않는다
  let res: Response
  try {
    res = await requestRaw(`/bible/tts/${bookNumber}/${chapter}/timings`, { query: { voice }, signal, auth: false })
  } catch (e) {
    if (isApiError(e)) return null
    throw e
  }
  const data = await res.json()
  const verses: VerseTiming[] = Array.isArray(data?.verses) ? data.verses : []
  return { verses, partial: !!data?.partial }
}

/** 장을 열 때 미리 묻는 캐시 상태 — url 이 있으면 R2 mp3 를 직접 재생(백엔드 왕복 없음) */
export interface TtsResolveResponse {
  url: string | null
  /** mp3 와 나란히 캐시된 절 타이밍(최종본). mp3 만 있는 레거시 장은 null */
  timings: { verses: VerseTiming[] } | null
}

export const fetchTtsResolve = async (
  bookNumber: number,
  chapter: number,
  voice: BibleTTSVoice,
  signal?: AbortSignal
): Promise<TtsResolveResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await request<any>(`/bible/tts/${bookNumber}/${chapter}/resolve`, { query: { voice }, signal, auth: false })
  return {
    url: typeof data?.url === 'string' && data.url ? data.url : null,
    timings: Array.isArray(data?.timings?.verses) ? { verses: data.timings.verses } : null,
  }
}

/**
 * 다음 장을 백그라운드에서 미리 생성해 달라는 요청 — 응답은 즉시 온다.
 * cached | started | in_progress. 실패해도 재생엔 지장 없으니 호출자는 무시해도 된다.
 */
export const prewarmTts = async (
  bookNumber: number,
  chapter: number,
  voice: BibleTTSVoice
): Promise<'cached' | 'started' | 'in_progress' | null> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request<any>(`/bible/tts/${bookNumber}/${chapter}/prewarm`, { method: 'POST', query: { voice }, auth: false })
    return data?.status ?? null
  } catch (e) {
    if (isApiError(e)) return null
    throw e
  }
}
