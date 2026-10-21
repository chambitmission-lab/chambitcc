// 목회자 영역 공통 요청 — 전부 로그인 필수, 서버가 is_pastor 로 지킨다 (관리자라도 목회자가 아니면 403)
import { requestData, requestRaw } from '../utils/request'

export const pastorGet = <T>(path: string, errorMessage: string): Promise<T> =>
  requestData<T>(path, { auth: 'required', errorMessage })

export const pastorSend = <T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH',
  json: unknown,
  errorMessage: string,
): Promise<T> => requestData<T>(path, { method, json, auth: 'required', errorMessage })

export const pastorDelete = async (path: string, errorMessage: string): Promise<void> => {
  await requestRaw(path, { method: 'DELETE', auth: 'required', errorMessage })
}
