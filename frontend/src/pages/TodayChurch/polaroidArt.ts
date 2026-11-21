// 폴라로이드 사진 — 어제 가장 많이 펼친 책의 장르(BOOK_GENRES 8개)마다 양 한 마리가 다른 곳에서 책을 편다.
// 사람은 등장하지 않는다(사용자 요청). 그림은 밤 장면 한 벌이라 라이트/다크 공용.
// 화면(ChurchLetter)과 선요청(routePreload '/today')이 같은 파일을 가리키도록 경로 규칙을 여기 한 곳에 둔다.
import type { ChurchDay, TodayChurch } from '../../api/todayChurch'
import { getBookGenre } from '../../components/bible/bookGenre'
import { warmImage } from '../../utils/themeAssets'

/** 폴라로이드에 올릴 책 — 가장 많이 펼친 장의 책, 없으면 가장 많이 읽은 책 */
export const polaroidBook = (church: ChurchDay): number | undefined =>
  church.top_chapters[0]?.book_number ?? church.reading_books?.[0]?.book_number

/** getBookGenre 는 범위를 벗어나도 8개 장르 중 하나로 폴백하므로 항상 있는 파일을 가리킨다 */
export const polaroidSrc = (bookNumber: number): string => `/images/today/polaroid-${getBookGenre(bookNumber).id}.webp`

/** 홈 봉투가 뜰 때(preloadRoute '/today') 어제의 사진 한 장을 미리 받는다 — 탭을 열자마자 현상이 시작되게 */
export const warmPolaroid = (data: TodayChurch | undefined): Promise<void> => {
  const book = data?.church ? polaroidBook(data.church) : undefined
  return book ? warmImage(polaroidSrc(book), 'low') : Promise.resolve()
}
