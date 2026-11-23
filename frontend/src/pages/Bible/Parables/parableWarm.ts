import { queryClient } from '../../../config/queryClient'
import { getBibleChapter } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import type { Parable } from '../data/parables'
import { parableArtUrl } from './parableImages'

// 비유 카드에 손이 닿는 순간 시트가 쓸 것을 미리 받는다 — 시트 청크·머리 그림(원본)·핵심 절 본문.
// 열고 나서 받으면 빈 그림 상자와 "본문을 불러오는 중…"이 잠깐 보였다.
const warmedArt = new Set<string>()

/** 시트 청크만 — 어떤 비유가 열릴지 모를 때 */
export const warmParableSheet = () => void import('./ParableSheet')

export const warmParable = (p: Pick<Parable, 'id' | 'quote'>) => {
  warmParableSheet()

  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  const url = parableArtUrl(p.id, 'full', theme)
  if (url && !warmedArt.has(url)) {
    warmedArt.add(url)
    new Image().src = url
  }

  // 본문 — 읽기 화면이 받아 둔 페이지 캐시가 있으면 시트(usePassageVerses)가 그걸 쓰니 건너뛴다
  const [b, c] = p.quote.split(':').map(Number)
  if (queryClient.getQueryData(bibleKeys.chapterInfinite(b, c))) return
  void queryClient.prefetchQuery({
    queryKey: bibleKeys.chapter(b, c),
    queryFn: () => getBibleChapter(b, c),
    staleTime: 1000 * 60 * 60 * 24, // useBibleChapter 와 같은 값
  })
}
