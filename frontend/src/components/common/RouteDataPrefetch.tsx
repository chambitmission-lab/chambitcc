import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { prefetchBibleChapter } from '../../hooks/useBible'

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
  }, [pathname, queryClient])

  return null
}

export default RouteDataPrefetch
