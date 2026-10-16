/**
 * 성경 장 단위 라벨. 시편(19권)만 "편", 나머지는 "장".
 * 화면 곳곳에 `bookNumber === 19 ? '편' : '장'` 이 흩어져 있던 것을 한 곳으로 모은다.
 */
export const PSALMS_BOOK_NUMBER = 19

export const chapterUnit = (bookNumber: number | null | undefined): '편' | '장' =>
  bookNumber === PSALMS_BOOK_NUMBER ? '편' : '장'

/** `3장` / `23편` 처럼 숫자+단위만 */
export const chapterLabel = (bookNumber: number | null | undefined, chapter: number): string =>
  `${chapter}${chapterUnit(bookNumber)}`
