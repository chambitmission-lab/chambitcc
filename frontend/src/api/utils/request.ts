/**
 * API 요청 단일 진입점.
 *
 * 55개 API 모듈이 저마다 "apiFetch → response.ok 검사 → JSON 파싱 → Error 던지기"를
 * 손으로 반복하던 것을 한 함수로 모은다. 여기서만 알면 되는 것:
 *  - 인증 헤더를 어디서 가져오는지 (tokenStore)
 *  - 실패 응답을 어떤 에러 타입으로 던지는지 (ApiError — status 가 있어야
 *    config/queryClient 의 createRetry 가 4xx 재시도를 건너뛴다)
 *  - 서버 에러 본문(detail)을 어떻게 메시지로 바꾸는지
 *  - 204/빈 본문을 어떻게 다루는지
 */
import { API_V1, apiFetch } from '../../config/api'
import { tokenStore } from '../../utils/tokenStore'
import { ApiError } from './apiHelpers'

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /**
   * true(기본): 토큰이 있으면 Authorization 을 붙이고, 없으면 익명으로 보낸다.
   * 'required': 토큰이 없으면 요청 전에 '로그인이 필요합니다' 로 실패한다.
   * false: 토큰이 있어도 붙이지 않는다(로그인·회원가입 등).
   */
  auth?: boolean | 'required'
  /** JSON 본문. Content-Type 과 stringify 를 대신 처리한다. */
  json?: unknown
  /** FormData·Blob 등 JSON 이 아닌 본문 */
  body?: BodyInit
  /** 쿼리스트링. undefined/null 값은 제외한다. */
  query?: Record<string, QueryValue>
  headers?: Record<string, string>
  signal?: AbortSignal
  cache?: RequestCache
  /** 서버가 detail 을 주지 않을 때 쓸 메시지 */
  errorMessage?: string
  /** 서버 응답에 상관없이 항상 errorMessage 를 쓴다(사용자에게 원문을 보이고 싶지 않을 때) */
  ignoreServerDetail?: boolean
}

export const LOGIN_REQUIRED_MESSAGE = '로그인이 필요합니다'

const DEFAULT_ERROR = '요청에 실패했습니다'

export const buildQuery = (query?: Record<string, QueryValue>): string => {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** '/bible/books' → `${API_V1}/bible/books`, 절대 URL 은 그대로 */
export const resolveUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${API_V1}${path.startsWith('/') ? path : `/${path}`}`

const buildInit = (options: RequestOptions): RequestInit => {
  const headers: Record<string, string> = { ...(options.headers ?? {}) }
  const auth = options.auth ?? true

  if (auth !== false) {
    const token = tokenStore.getAccess()
    if (token) headers.Authorization = `Bearer ${token}`
    else if (auth === 'required') throw new ApiError(401, LOGIN_REQUIRED_MESSAGE)
  }

  let body: BodyInit | undefined = options.body
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.json)
  }

  return {
    method: options.method ?? (body !== undefined ? 'POST' : 'GET'),
    headers,
    body,
    signal: options.signal,
    cache: options.cache,
  }
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status)

/**
 * 특정 HTTP 상태를 호출부 약속 메시지로 바꿔 던진다.
 * 예) withStatusMessages(request(...), { 404: 'NOT_FOUND' })
 * status 는 그대로 유지되므로 createRetry 의 4xx 판정도 살아 있다.
 */
export const withStatusMessages = async <T>(
  pending: Promise<T>,
  messages: Record<number, string>
): Promise<T> => {
  try {
    return await pending
  } catch (error) {
    if (error instanceof ApiError && messages[error.status]) {
      throw new ApiError(error.status, messages[error.status])
    }
    throw error
  }
}

/** 실패 응답을 ApiError 로 바꾼다. 본문의 detail(문자열)이 있으면 그것을 메시지로 쓴다. */
export const toApiError = async (
  response: Response,
  fallback: string = DEFAULT_ERROR,
  ignoreServerDetail = false
): Promise<ApiError> => {
  let message = fallback
  // 5xx 는 서버 내부 문구("Internal Server Error")가 그대로 사용자에게 보이지 않도록 기본 메시지를 쓴다.
  if (!ignoreServerDetail && response.status < 500) {
    try {
      const data = await response.clone().json()
      const detail = data?.detail ?? data?.message
      if (typeof detail === 'string' && detail.trim()) message = detail
    } catch {
      /* JSON 이 아닌 본문은 기본 메시지 */
    }
  }
  return new ApiError(response.status, message, response)
}

/**
 * 원본 Response 가 필요할 때(blob 다운로드, 204 판별 등). ok 검사까지만 해 준다.
 */
export const requestRaw = async (path: string, options: RequestOptions = {}): Promise<Response> => {
  const url = resolveUrl(path) + buildQuery(options.query)
  const response = await apiFetch(url, buildInit(options))
  if (!response.ok) {
    throw await toApiError(response, options.errorMessage, options.ignoreServerDetail)
  }
  return response
}

/**
 * JSON 응답을 돌려주는 기본 요청. 204·빈 본문은 undefined 로 온다.
 */
export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await requestRaw(path, options)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

/**
 * 마이그레이션 전 `await response.json()` 이 돌려주던 any 와 같은 의미.
 * 응답 타입을 아직 선언하지 않은 호출부의 임시 자리표시자 — 새 코드에서는 쓰지 않는다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UntypedJson = any
