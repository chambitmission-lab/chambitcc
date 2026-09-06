import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchBibleChapter } from '../../hooks/useBible'
import { prefetchAboutContent } from '../../hooks/useAboutContent'
import { tokenStore } from '../../utils/tokenStore'

/* 라우트가 바뀌는 순간 그 화면의 첫 데이터를 lazy 청크와 나란히 요청한다.
   Routes 를 감싼 Suspense 안에 두면 청크가 도착할 때까지 effect 가 미뤄지므로
   반드시 Suspense 바깥(ScrollRestoration 옆)에 마운트한다.
   훅과 같은 queryKey·queryFn 으로 prefetch 하므로 화면이 뜨면 캐시를 그대로 이어받는다. */

const BIBLE_CHAPTER = /^\/bible\/(\d+)\/(\d+)$/

const RouteDataPrefetch = () => {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  useEffect(() => {
    const chapter = BIBLE_CHAPTER.exec(pathname)
    if (chapter) {
      prefetchBibleChapter(queryClient, Number(chapter[1]), Number(chapter[2]))
    }
    // 비로그인 랜딩 — 히어로 사진 URL 이 /about-content 응답에 있어 청크 뒤에 API, 그 뒤에
    // 이미지가 오는 3단 체인이었다. API 를 청크와 같은 시점에 띄운다.
    if ((pathname === '/' || pathname === '/welcome') && !tokenStore.getAccess()) {
      prefetchAboutContent(queryClient)
    }
  }, [pathname, queryClient])

  return null
}

export default RouteDataPrefetch
