import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { logout } from '../../../../utils/auth'

export const useLogout = (setIsLoggedIn: (value: boolean) => void, setIsAdminUser: (value: boolean) => void) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    // 1. UI를 즉시 로그아웃 상태로 전환한다.
    //    토큰/캐시 정리·네트워크 호출을 기다리지 않으므로 화면 전환이 바로 일어난다.
    //    (기존 코드는 cancelQueries를 await로 먼저 기다린 뒤에야 전환됐다)
    setIsLoggedIn(false)
    setIsAdminUser(false)
    navigate('/', { replace: true })

    // 2. 토큰·persist 캐시 제거 + 푸시 구독 해제(백그라운드) — 공통 logout()을 재사용한다.
    //    헤더 경로에서 빠져 있던 푸시 구독 해제를 여기서 함께 처리한다.
    //    (logout 내부의 localStorage 제거는 동기로 즉시 끝나고, 푸시 해제만 백그라운드)
    void logout()

    // 3. 메모리 캐시 정리 — 네비게이션을 막지 않도록 await 하지 않는다.
    //    진행 중인 요청은 취소하고, 사용자별 데이터는 모두 제거하되
    //    공개·불변인 성경 본문 캐시(['bible', ...])는 남겨 콜드 리페치 범위를 줄인다.
    void queryClient.cancelQueries()
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'bible',
    })
  }

  return { handleLogout }
}
