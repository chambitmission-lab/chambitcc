// 홈 "주일에 붙잡은 말씀" — 지난 주일 설교에서 내가 적은 한 줄을 월~토 홈에 다시 띄운다.
// 설교가 주일에 끝나지 않고 한 주 내내 이어지게. 비로그인·한 줄이 없으면 아무것도 그리지 않는다.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSermonTakeaways } from '../../../hooks/useSermonTakeaways'
import { useHomeBundlePending } from '../../../hooks/useHomeSummary'
import { todayYmd } from '../../Bible/Plans/planSchedule'
import { ensureFontFamily } from '../../../utils/deferredFonts'

const DAY_MS = 86_400_000

/** 'YYYY-MM-DD' 두 날짜 사이 날 수 (b - a) */
const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / DAY_MS)

const SermonTakeawayEcho = () => {
  const bundlePending = useHomeBundlePending()
  const { loggedIn, data } = useSermonTakeaways(!bundlePending)

  // 설교 다음 날부터 엿새째(다음 주일 전날)까지 — 가장 최근 설교의 한 줄 하나
  const today = todayYmd()
  const pick = loggedIn
    ? (data ?? [])
        .filter((t) => t.sermon_date)
        .map((t) => ({ t, ago: daysBetween(t.sermon_date!, today) }))
        .filter(({ ago }) => ago >= 1 && ago <= 6)
        .sort((a, b) => a.ago - b.ago)[0]
    : undefined

  // 손글씨 서체는 카드가 뜰 때만 붙인다 — 홈 모듈 최상단에서 부르면 카드 없는 날에도 전원이 CSS 를 받는다.
  // 한글은 unicode-range 조각이라 그 한 줄 글자로 조각까지 받아 폴백 → 손글씨 바뀜을 줄인다
  const text = pick?.t.text
  useEffect(() => {
    if (!text || !document.fonts) return
    void ensureFontFamily('nanumPen').then(() => document.fonts.load(`22px "Nanum Pen Script"`, text).catch(() => undefined))
  }, [text])

  if (!pick) return null

  return (
    <section className="px-4 pt-3">
      <Link
        to="/sermon"
        className="block feed-card rounded-2xl px-4 py-3.5 transition-transform active:scale-[0.99]"
      >
        <p className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-muted)]">
          <span className="material-icons-outlined text-[16px] text-brand" aria-hidden>edit_note</span>
          주일에 붙잡으신 말씀이에요
        </p>
        <p
          className="mt-1.5 text-[22px] leading-[1.3] text-[var(--brand-muted)] break-keep"
          style={{ fontFamily: "'Nanum Pen Script', var(--font-serif-kr)" }}
        >
          {pick.t.text}
        </p>
        {pick.t.sermon_title && (
          <p className="mt-1 text-[12.5px] text-[var(--text-muted)] truncate">「{pick.t.sermon_title}」</p>
        )}
      </Link>
    </section>
  )
}

export default SermonTakeawayEcho
