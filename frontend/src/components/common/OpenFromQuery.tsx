import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * URL 쿼리로 전역 UI를 여는 진입점.
 *
 * `?open=notifications` 가 붙어 있으면 알림함(헤더의 알림 모달)을 열고 파라미터는 지운다.
 * 관리자 푸시처럼 "특정 화면"이 아니라 "받은 알림 내용을 다시 보게" 하고 싶은 알림이
 * 클릭 시 여기로 온다 (푸시 url = /#/home?open=notifications).
 *
 * 열기는 헤더가 듣고 있는 window 이벤트로 요청한다 — 좌측 레일이 쓰는 것과 같은 경로.
 * 같은 커밋의 effect 들이 모두 흐른 뒤에 쏘도록 한 틱 미룬다 (헤더 리스너 등록이 먼저여야 한다).
 */
const OpenFromQuery = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const target = params.get('open')
    if (!target) return

    if (target === 'notifications') {
      const timer = window.setTimeout(() => {
        window.dispatchEvent(new Event('chambit:open-notifications'))
      }, 0)
      params.delete('open')
      const search = params.toString()
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
        { replace: true, state: location.state },
      )
      return () => window.clearTimeout(timer)
    }
  }, [location.search, location.pathname, location.hash, location.state, navigate])

  return null
}

export default OpenFromQuery
