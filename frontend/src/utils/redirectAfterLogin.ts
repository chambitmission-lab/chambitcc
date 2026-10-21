/**
 * "로그인하고 나면 이 화면으로 돌아온다" — 비로그인 진입(초대 코드·캡슐·선거 등)과
 * 토큰 만료(config/api) 가 적어 두고, 로그인 화면이 한 번 읽고 지운다.
 *
 * 키 문자열은 여기에만 둔다. 저장이 막힌 환경(인앱 웹뷰 등)이면 조용히 홈으로 돌아갈 뿐,
 * 로그인 화면으로 가는 흐름 자체는 막지 않는다.
 */
import { safeSessionStorage } from './safeStorage'

const KEY = 'redirect_after_login'

export const redirectAfterLogin = {
  /** 로그인 뒤 돌아갈 앱 내 경로(해시 라우트 기준 '/rooms/3' 꼴) */
  set: (path: string): void => {
    safeSessionStorage.set(KEY, path)
  },
  /** 저장된 경로를 꺼내고 지운다. 없으면 null */
  consume: (): string | null => {
    const path = safeSessionStorage.get(KEY)
    safeSessionStorage.remove(KEY)
    return path
  },
}
