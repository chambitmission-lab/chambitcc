// SSE(Server-Sent Events) fetch 클라이언트
// EventSource는 Authorization 헤더를 실을 수 없어서(토큰이 URL에 노출됨),
// fetch의 ReadableStream으로 text/event-stream을 직접 파싱한다.
// apiFetch를 재사용하므로 만료 토큰 선제 갱신 / 401 재시도도 그대로 적용된다.
import { apiFetch } from '../config/api'

export interface SSEOptions {
  method?: 'GET' | 'POST'
  /** JSON 직렬화되어 body로 전송 */
  body?: unknown
  signal?: AbortSignal
}

export type SSEEventHandler = (event: string, data: string) => void

/**
 * SSE 스트림을 열고 종료될 때까지 이벤트를 콜백으로 전달한다.
 * - HTTP 에러(non-2xx)면 응답의 detail 메시지로 throw
 * - 주석 라인(하트비트 `: ping`)은 무시된다
 * - 취소하려면 AbortController의 signal을 넘긴다 (abort 시 DOMException throw)
 */
export const streamSSE = async (
  url: string,
  options: SSEOptions,
  onEvent: SSEEventHandler,
): Promise<void> => {
  const { method = 'GET', body, signal } = options

  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = { Accept: 'text/event-stream' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await apiFetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    let detail = '요청에 실패했습니다'
    try {
      const err = await response.json()
      if (err?.detail) detail = err.detail
    } catch {
      // JSON이 아닌 에러 응답은 기본 메시지 유지
    }
    throw new Error(detail)
  }

  if (!response.body) {
    throw new Error('이 환경에서는 스트리밍을 지원하지 않습니다')
  }

  const dispatch = (frame: string) => {
    let event = 'message'
    const dataLines: string[] = []
    for (const rawLine of frame.split('\n')) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
      if (line.startsWith('event:')) {
        event = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''))
      }
      // ':'로 시작하는 주석(하트비트) 라인은 무시
    }
    if (dataLines.length > 0) onEvent(event, dataLines.join('\n'))
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let idx: number
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        dispatch(frame)
      }
    }
    if (buffer.trim()) dispatch(buffer)
  } finally {
    // onEvent가 throw(error 이벤트 등)해도 연결을 정리한다
    void reader.cancel().catch(() => {})
  }
}
