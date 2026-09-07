import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '../../../../utils/auth'
import { tokenStore, sessionStore } from '../../../../utils/tokenStore'

export const useLogout = (
  setIsLoggedIn: (value: boolean) => void,
  setIsAdminUser: (value: boolean) => void,
  closeMenu?: () => void,
) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    // 1. 토큰·세션만 먼저 동기로 지운다 (localStorage 몇 줄이라 즉시 끝난다).
    //    '/' 는 HomeGate 가 tokenStore.getAccess() 로 분기하는데(App.tsx),
    //    토큰 제거를 아래 setTimeout 으로 미루면 navigate 시점엔 토큰이 살아 있어
    //    로그아웃했는데 로그인 피드(NewHome)가 그려진다. 반드시 navigate 보다 앞서야 한다.
    //    푸시 구독 해제는 인증이 필요하므로 지우기 전에 스냅샷해 둔다.
    const token = tokenStore.getAccess()
    tokenStore.clear()
    sessionStore.clear()

    // 2. UI를 즉시 로그아웃 상태로 전환한다.
    //    캐시 정리·네트워크 호출을 기다리지 않으므로 화면 전환이 바로 일어난다.
    //    (기존 코드는 cancelQueries를 await로 먼저 기다린 뒤에야 전환됐다)
    setIsLoggedIn(false)
    setIsAdminUser(false)
    closeMenu?.() // 햄버거 메뉴/오버레이를 즉시 닫는다 (라우트 변경 효과에만 의존하지 않음)
    navigate('/', { replace: true }) // 비로그인 → 랜딩

    // 3. 무거운 정리 작업은 페인트 이후로 미룬다.
    //    logout()의 캐시 제거나 removeQueries는 동기로 무겁게(특히 persist의
    //    JSON.stringify) 메인 스레드를 점유할 수 있어, 같은 틱에서 돌리면
    //    클릭→화면전환 사이가 "멈춘 듯" 보인다. setTimeout(0)으로 React가
    //    로그아웃 화면을 먼저 그리게 한 뒤 정리한다.
    setTimeout(() => {
      // persist 캐시 제거 + 푸시 구독 해제(백그라운드) — 공통 logout()을 재사용한다.
      // 토큰은 위에서 이미 지웠으므로 스냅샷을 넘겨 푸시 해제가 인증을 통과하게 한다.
      void logout(token)

      // 메모리 캐시 정리. 진행 중인 요청은 취소하고, 사용자별 데이터는 모두
      // 제거하되 공개·불변인 성경 본문 캐시(['bible', ...])는 남겨 콜드 리페치
      // 범위를 줄인다.
      void queryClient.cancelQueries()
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'bible',
      })
    }, 0)
  }

  return { handleLogout }
}
