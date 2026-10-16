// 홈 맨 위 "오늘의 교회" 봉투 한 줄 — 누르면 /today 상세.
//
// 2026-10-16 큰 편지 카드(B안)에서 한 줄 봉투로 줄였다. 홈 첫 화면에 정보가 너무 많아 집중이 안 된다는
// 피드백 때문이다. 편지 본문, 응답 버튼, 어제 우리 교회 숫자는 전부 /today 로 옮겼다.
//
// 노출 규칙
//   - 1년·6개월·한 달 전 '정확히 오늘' 남긴 기록이 있는 날만 뜬다(memory.exact).
//     앞뒤 3일 대체나 '처음 남긴 기도'는 같은 기록이 며칠씩 반복되므로 홈에 올리지 않고 상세에서만 보여 준다.
//   - /today 를 한 번 열면 그날(서버 KST 날짜)은 숨는다. 다음 기념일에 다시 온다.
import { useNavigate } from 'react-router-dom'
import type { MemoryKind, MemoryOffset } from '../../../api/todayChurch'
import { useHomeBundlePending } from '../../../hooks/useHomeSummary'
import { useTodayChurch } from '../../../hooks/useTodayChurch'
import { isAuthenticated } from '../../../utils/auth'
import { ChevronRightIcon } from '../../../components/icons/ActionIcons'
import { EnvelopeSimple } from '../../../components/icons/phosphor'
import { isTodayChurchOpened, useAskableMemory } from '../../TodayChurch/memoryCopy'

const WHEN: Record<Exclude<MemoryOffset, 'first'>, string> = {
  year: '1년 전',
  half: '6개월 전',
  month: '한 달 전',
}

/** 조사까지 — 묵상만 받침이 있다 */
const SUBJECT: Record<MemoryKind, string> = {
  prayer: '기도가',
  meditation: '묵상이',
  thanks: '감사가',
  typing: '필사가',
}

const TodayChurchCard = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const bundlePending = useHomeBundlePending()
  const { data } = useTodayChurch(authed && !bundlePending)
  const askable = useAskableMemory()

  if (!authed || !data || isTodayChurchOpened(data.date)) return null
  const exact = data.memories.filter((m) => m.exact && m.offset !== 'first')
  // 응답을 물을 기도가 있으면 그것을 먼저, 없으면 가장 오래된 기념일(1년 → 6개월 → 한 달)
  const main = exact.find(askable) ?? exact[0]
  if (!main || main.offset === 'first') return null

  return (
    <section className="px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate('/today')}
        className="feed-card flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--amber-soft)] text-[var(--amber)]">
          <EnvelopeSimple size={17} weight="bold" aria-hidden />
          {/* 안 읽은 편지 점 */}
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--amber-icon)] ring-2 ring-[var(--surface-container)]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-strong">
          {WHEN[main.offset]} 오늘의 {SUBJECT[main.kind]} 도착했어요
        </span>
        <ChevronRightIcon size={16} className="shrink-0 text-[var(--text-muted)]" />
      </button>
    </section>
  )
}

export default TodayChurchCard
