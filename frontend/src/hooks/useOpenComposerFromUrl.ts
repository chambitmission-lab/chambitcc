import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * `?new=1` 로 들어오면 등록 창(composer)을 바로 연다 — 전체 메뉴 > 관리 도구의 '빠른 작업'이
 * 목록 화면을 거치지 않고 "주보 올리기"까지 한 번에 가게 한다.
 * 파라미터는 연 즉시 지운다(replace) — 새로고침·뒤로가기로 창이 다시 열리지 않게.
 * 이미 같은 화면에 있을 때 다시 눌러도 검색 파라미터가 바뀌므로 다시 열린다.
 */
export const useOpenComposerFromUrl = (open: () => void) => {
  const [params, setParams] = useSearchParams()
  const wantsNew = params.get('new') === '1'

  useEffect(() => {
    if (!wantsNew) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        return next
      },
      { replace: true },
    )
    open()
    // open 은 매 렌더 새 함수 — 파라미터가 새로 붙었을 때만 한 번 연다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsNew])
}
