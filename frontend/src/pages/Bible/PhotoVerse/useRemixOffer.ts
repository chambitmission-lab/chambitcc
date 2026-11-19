// 받은 스타일 링크(?remix=) — 들어올 때 한 번 읽어 두고 주소에서는 지운다.
// remixIn 은 처음 읽은 값(스타일 초깃값에 쓴다), remixOffer 는 아직 답하지 않은 제안이다.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { REMIX_PARAM, decodeRemix } from './remix'

export const useRemixOffer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [remixIn] = useState(() => decodeRemix(new URLSearchParams(location.search).get(REMIX_PARAM)))
  const [remixOffer, setRemixOffer] = useState(() => remixIn)

  // 주소의 ?remix= 는 한 번 읽고 지운다 — 새로고침·뒤로 가기 때 다시 덮어쓰지 않게
  useEffect(() => {
    if (!new URLSearchParams(location.search).has(REMIX_PARAM)) return
    navigate({ pathname: location.pathname, search: '' }, { replace: true, state: location.state })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { remixIn, remixOffer, setRemixOffer }
}
