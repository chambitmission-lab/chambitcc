import { ensureSerifKr } from '../../../utils/deferredFonts'
import type { BibleFigureSummary } from '../../../types/bibleFigure'
import { FIGURE_HOOK } from './genealogyStory'

/**
 * 인물 상세의 명조 제목(900→700 페이스)·한 줄 소개(500)에 쓰일 글자를 미리 받아 둔다.
 *
 * Noto Serif KR 은 unicode-range 로 100여 조각으로 쪼개져 있어 글자가 실제로 그려질 때마다
 * 그 글자가 든 조각을 내려받는다. 가계도에서 인물을 처음 누르면 제목·소개에 쓰인 조각을 그때야
 * 요청해(실측 20~30개 woff2) 폴백 서체로 떴다가 한참 뒤 명조로 갈아끼워졌다 — "늦게 뜬다"는
 * 인상의 큰 몫. document.fonts.load(font, text) 는 text 에 든 글자가 속한 조각만 받으므로
 * 가계도 데이터가 오면 유휴 시간에 이름·소개 글자 전부를 한 번에 데운다.
 */
let warmed = false

export const warmGenealogySerif = async (nodes: BibleFigureSummary[]): Promise<void> => {
  if (warmed || typeof document === 'undefined' || !('fonts' in document)) return
  warmed = true
  try {
    await ensureSerifKr()
    const chars = new Set<string>()
    for (const n of nodes) {
      for (const ch of `${n.name_ko}${FIGURE_HOOK[n.slug] ?? n.description_short ?? ''}`) chars.add(ch)
    }
    const text = [...chars].join('')
    if (!text) return
    await Promise.allSettled([
      document.fonts.load('700 42px "Noto Serif KR"', text),
      document.fonts.load('500 18px "Noto Serif KR"', text),
    ])
  } catch {
    /* 폰트는 장식 — 실패해도 폴백 명조로 그린다 */
  }
}
