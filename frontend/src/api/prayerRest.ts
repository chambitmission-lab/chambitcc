// 기도멍(창가) — "지금 함께 깨어 있는 사람" 수
//
// 서버는 숫자만 안다. 향연 화면에서 쓴 기도 글은 이 API 를 포함해 어디로도 보내지 않는다.
import { request, requestRaw } from './utils/request'

export interface RestPresence {
  /** 지금 기도멍 화면에 머무는 사람 수 */
  total: number
  /** total 에 내가 들어있는지 (하트비트 응답은 true, 비로그인 조회는 false) */
  me_included: boolean
}

export const sendRestHeartbeat = (): Promise<RestPresence> =>
  request<RestPresence>('/prayer-rest/presence', {
    method: 'POST',
    auth: 'required',
    errorMessage: '함께 머무는 자리를 알리지 못했습니다',
  })

export const getRestPresence = (): Promise<RestPresence> =>
  request<RestPresence>('/prayer-rest/presence', {
    auth: false,
    errorMessage: '함께 머무는 사람 수를 불러오지 못했습니다',
  })

/** 떠나기 — 탭이 닫히는 순간에도 나가야 하므로 keepalive */
export const leaveRest = (): Promise<void> =>
  requestRaw('/prayer-rest/presence', {
    method: 'DELETE',
    auth: 'required',
    keepalive: true,
    errorMessage: '떠남을 알리지 못했습니다',
  }).then(() => undefined)
