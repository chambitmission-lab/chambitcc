/**
 * 성경 권(책)의 장르 분류 — '권 개관' 화면의 액센트 색과 라벨에만 쓴다.
 *
 * 색은 브랜드 블루를 대체하지 않는다. 아이브로우 라벨·아이콘·구조 막대처럼
 * 면적이 작은 곳에만 얹어서, 66권이 전부 같은 파란 카드로 보이지 않게 하고
 * "지금 어떤 결의 책을 펼쳤는지"를 색으로 기억하게 하는 게 목적이다.
 * 실제 색값은 theme.css의 --genre-* 토큰(라이트/다크 분기)이 갖는다.
 *
 * 구간은 BookSelector의 분류 칩(OT_CATEGORIES / NT_CATEGORIES)과 같은 기준이다.
 */

import type { CSSProperties } from 'react'

export interface BookGenre {
  id: string
  /** 화면에 노출되는 분류명 */
  label: string
  /** theme.css의 CSS 변수명 */
  colorVar: string
  /** Material Icons Round 아이콘명 */
  icon: string
}

const GENRES: { max: number; genre: BookGenre }[] = [
  { max: 5, genre: { id: 'law', label: '모세오경', colorVar: '--genre-law', icon: 'menu_book' } },
  { max: 17, genre: { id: 'history', label: '역사서', colorVar: '--genre-history', icon: 'history_edu' } },
  { max: 22, genre: { id: 'poetry', label: '시가서', colorVar: '--genre-poetry', icon: 'music_note' } },
  { max: 39, genre: { id: 'prophets', label: '선지서', colorVar: '--genre-prophets', icon: 'campaign' } },
  { max: 43, genre: { id: 'gospels', label: '복음서', colorVar: '--genre-gospels', icon: 'auto_awesome' } },
  { max: 44, genre: { id: 'acts', label: '사도행전', colorVar: '--genre-acts', icon: 'travel_explore' } },
  { max: 65, genre: { id: 'epistles', label: '서신서', colorVar: '--genre-epistles', icon: 'mail' } },
  { max: 66, genre: { id: 'revelation', label: '요한계시록', colorVar: '--genre-revelation', icon: 'flare' } },
]

const FALLBACK: BookGenre = {
  id: 'gospels',
  label: '성경',
  colorVar: '--genre-gospels',
  icon: 'menu_book',
}

/** book_number(1~66) → 장르. 범위를 벗어나면 브랜드 블루로 폴백한다. */
export const getBookGenre = (bookNumber: number): BookGenre => {
  const found = GENRES.find((g) => bookNumber <= g.max)
  return bookNumber >= 1 && found ? found.genre : FALLBACK
}

/** 개관 카드에 뿌릴 CSS 변수 묶음 — style={genreStyle(n)} 으로 쓴다. */
export const genreStyle = (bookNumber: number): CSSProperties =>
  ({
    '--genre': `var(${getBookGenre(bookNumber).colorVar})`,
    '--genre-soft': 'color-mix(in srgb, var(--genre) var(--genre-soft-pct), transparent)',
    '--genre-line': 'color-mix(in srgb, var(--genre) 22%, transparent)',
  }) as CSSProperties

// ---------------------------------------------------------------------------
// 책 구조(단락) 파싱
// ---------------------------------------------------------------------------

export interface BookSection {
  /** 시작 장 (1-base, 포함) */
  from: number
  /** 끝 장 (포함) */
  to: number
  label: string
}

/**
 * 관리자가 입력한 자유 텍스트를 장 범위 단락으로 파싱한다.
 *
 * 한 줄에 하나씩, 아래 형태를 모두 받아준다:
 *   "1-11 원역사"  /  "1~11 원역사"  /  "1–11: 원역사"  /  "12 아브라함"
 * 콤마로 이어 쓴 한 줄("1-11 원역사, 12-25 아브라함")도 나눠서 읽는다.
 *
 * 파싱에 실패한 줄은 조용히 버린다 — 구조는 부가 정보라서, 형식이 어긋났다고
 * 개관 전체가 안 보이면 손해가 더 크다.
 */
export const parseBookStructure = (
  raw: string | null | undefined,
  totalChapters: number,
): BookSection[] => {
  if (!raw?.trim()) return []

  const pattern = /^(\d+)\s*(?:[-~–—]\s*(\d+))?\s*[:.)]?\s*(.+)$/
  const sections: BookSection[] = []

  raw
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const m = line.match(pattern)
      if (!m) return
      const from = Number(m[1])
      const to = m[2] ? Number(m[2]) : from
      const label = m[3].trim()
      if (from < 1 || to < from) return
      // 라벨 없이 범위만 적은 줄("1-11")은 정규식이 뒤 숫자를 라벨로 물어 가므로
      // 글자가 하나도 없는 라벨은 버린다
      if (!/[^\s\d.:)~–—-]/.test(label)) return
      if (totalChapters > 0 && from > totalChapters) return
      sections.push({
        from,
        to: totalChapters > 0 ? Math.min(to, totalChapters) : to,
        label,
      })
    })

  return sections.sort((a, b) => a.from - b.from)
}
