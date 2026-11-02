import { smoothScrollToElement } from '../../../utils/scrollTo'

// 열쇠말 밝히기 — 칠해진 자리로 스크롤하는 DOM 도우미 (알약·길잡이 카드가 함께 쓴다)
export const KEYWORD_SCROLL_OFFSET = 140

/** 본문에 칠해진 열쇠말을 절 단위로 모은다 (한 절에 여러 번 나와도 한 번만 멈춘다) */
export const markedVerses = (): Element[] => {
  const seen = new Set<Element>()
  document.querySelectorAll('.verse-keyword-mark').forEach((mark) => {
    seen.add(mark.closest('.bible-verse-item') ?? mark)
  })
  return [...seen]
}

/** 밝히기를 켠 직후 첫 자리로 — 칠하기가 다음 프레임에 그려지므로 두 프레임 기다린다 */
export const scrollToFirstKeyword = () => {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const first = markedVerses()[0]
      if (first) smoothScrollToElement(first, { offset: KEYWORD_SCROLL_OFFSET })
    })
  )
}

