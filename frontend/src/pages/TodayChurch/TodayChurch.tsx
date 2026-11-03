// /today — 오늘의 교회 상세. 홈 묵상 히어로 우상단 봉투 버튼을 누르면 온다.
//   탭 1 작년 오늘의 나: 1년·6개월·1개월 전 오늘의 기록 + 작년 이맘때 응답된 기도
//   탭 2 어제 우리 교회: 참비의 손편지 — 익명 집계로 쓴 편지 · 폴라로이드 · 이번 주 마음 · 하루의 언덕길 · 숫자 티켓
// ?tab=church 면 두 번째 탭이 먼저 열린다.
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { AnsweredEcho, ChurchDay, TodayChurch as TodayChurchData, TodayMemory } from '../../api/todayChurch'
import { useTodayChurch } from '../../hooks/useTodayChurch'
import { ChurchLetter } from './ChurchLetter'
import { AnswerAsk, MemoryQuote } from './MemoryLetter'
import { formatKoreanDate, markTodayChurchOpened, memoryMeta, memoryWhen } from './memoryCopy'

type Tab = 'me' | 'church'
const TABS = [
  ['me', '작년 오늘의 나'],
  ['church', '어제 우리 교회'],
] as const

// ── 탭 1: 작년 오늘의 나 ──────────────────────────────
const MemoryCard = ({ memory }: { memory: TodayMemory }) => {
  const navigate = useNavigate()
  const canOpenChapter = memory.kind === 'typing' && memory.book_number && memory.chapter
  return (
    <article className="feed-card rounded-2xl px-4 py-4 lg:px-7 lg:py-6">
      <div className="flex items-baseline justify-between gap-2 text-[12px] lg:text-[15px]">
        <b className="font-bold text-[var(--amber)]">{memoryWhen(memory)}</b>
        <span className="text-[var(--text-muted)] tabular-nums">{memory.date.replaceAll('-', '.')}</span>
      </div>
      <MemoryQuote memory={memory} className="mt-2.5" />
      <p className="mt-1.5 text-[12px] text-[var(--text-muted)] lg:mt-2.5 lg:text-[15px]">{memoryMeta(memory)}</p>
      <AnswerAsk memory={memory} />
      {canOpenChapter && (
        <button
          type="button"
          onClick={() => navigate(`/bible/${memory.book_number}/${memory.chapter}`)}
          className="mt-3 text-[13px] font-semibold text-brand lg:text-[16px]"
        >
          그 장 다시 읽기
        </button>
      )}
    </article>
  )
}

const EchoCard = ({ echo }: { echo: AnsweredEcho }) => (
  <article className="feed-card rounded-2xl px-4 py-4 lg:px-7 lg:py-6">
    <div className="flex items-baseline justify-between gap-2 text-[12px] lg:text-[15px]">
      <b className="font-bold text-emerald-700 dark:text-emerald-300">작년 이맘때 응답된 기도</b>
      <span className="text-[var(--text-muted)] tabular-nums">
        {echo.created_date.replaceAll('-', '.')} → {echo.answered_date.replaceAll('-', '.')}
      </span>
    </div>
    <p className="mt-2.5 break-keep text-[15px] leading-[1.55] text-ink-strong lg:text-[20px]">
      “{echo.title || echo.text}”
    </p>
    <p className="mt-1 text-[12.5px] text-[var(--text-muted)] lg:text-[15px]">{echo.days}일을 기도하고 응답받으셨어요</p>
    {echo.testimony && (
      <p className="mt-3 break-keep rounded-xl bg-[var(--surface-inset)] px-3.5 py-3 text-[13.5px] leading-[1.6] text-[var(--text-body)] lg:px-5 lg:py-4 lg:text-[17px]">
        {echo.testimony}
      </p>
    )}
    {echo.prayer_count > 0 && (
      <p className="mt-2.5 text-[12.5px] font-medium text-emerald-700 dark:text-emerald-300 lg:text-[15px]">
        성도 {echo.prayer_count}명이 함께 기도했어요
      </p>
    )}
  </article>
)

const MeTab = ({ data }: { data: TodayChurchData }) => {
  const { memories, answered_echo: echo } = data
  if (!memories.length && !echo) {
    return (
      <div className="px-4 pt-10 text-center lg:pt-20">
        <p className="text-[15px] font-semibold text-ink-strong lg:text-[22px]">아직 꺼내 볼 기록이 없어요</p>
        <p className="mx-auto mt-2 max-w-[30ch] break-keep text-[13.5px] leading-[1.65] text-[var(--text-muted)] lg:mt-3 lg:text-[17px]">
          오늘 남긴 기도·묵상·감사·필사는 한 달 뒤, 반년 뒤, 1년 뒤 오늘 이 자리에 다시 찾아와요.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2.5 px-4 pt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:px-0 lg:pt-6">
      {memories.map((m) => (
        <MemoryCard key={`${m.kind}-${m.id}`} memory={m} />
      ))}
      {echo && <EchoCard echo={echo} />}
    </div>
  )
}

// ── 탭 2: 어제 우리 교회 — 참비의 손편지(ChurchLetter) ──
const ChurchTab = ({ church }: { church: ChurchDay }) => (
  <div className="pt-4 lg:pt-6">
    <ChurchLetter church={church} />
    <p className="px-5 pb-6 pt-3 text-[11.5px] leading-[1.6] text-[var(--text-muted)] break-keep lg:px-1 lg:pt-5 lg:text-[15px]">
      누가 무엇을 했는지는 보이지 않아요. 모든 숫자는 익명 집계이고, 인원이 적은 항목은 숨겨요. 편지 문장은 숫자로 자동으로 적어요.
    </p>
  </div>
)

// ── 화면 ──────────────────────────────────────────────
const TodayChurch = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'church' ? 'church' : 'me'
  const { data, isLoading, error } = useTodayChurch()

  // 열어 본 날은 홈 봉투를 거둔다 — 다음 기념일에 다시 온다
  const serverDate = data?.date
  useEffect(() => {
    if (serverDate) markTodayChurchOpened(serverDate)
  }, [serverDate])

  const setTab = (next: Tab) => setParams(next === 'church' ? { tab: 'church' } : {}, { replace: true })
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark page-stage lg:min-h-0">
      {/* PC: 성경 레일 화면들과 같은 1240·px-5 셸 — 카드 껍데기 없이 캔버스 위에 큰 카드들을 늘어놓는다 */}
      <div className="mx-auto min-h-screen max-w-md bg-background-light dark:bg-background-dark lg:min-h-0 lg:max-w-[1240px] lg:bg-transparent lg:px-5 lg:pb-16 lg:pt-8 dark:lg:bg-transparent">
        {/* PC 머리: 큰 제목 + 큰 탭 한 줄 */}
        <div className="hidden lg:flex lg:items-end lg:justify-between lg:gap-6">
          <div>
            <p className="text-[16px] font-semibold text-[var(--text-muted)]">{data ? formatKoreanDate(data.date) : ' '}</p>
            <h1 className="mt-1 text-[32px] font-extrabold tracking-[-0.03em] text-ink-strong">오늘의 교회</h1>
          </div>
          <div className="flex gap-2" role="tablist">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`h-12 rounded-full px-6 text-[17px] font-bold transition-colors ${
                  tab === key
                    ? 'bg-ink-strong text-[var(--surface-container)]'
                    : 'bg-[var(--surface-container)] text-[var(--text-body)] border border-[var(--card-border)] hover:border-brand'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="sticky top-14 z-10 border-b border-border-light bg-background-light/95 backdrop-blur-sm dark:border-border-dark dark:bg-background-dark/95 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-gray-600 transition-colors hover:text-brand dark:text-white/70"
              aria-label="뒤로"
            >
              <span className="material-icons-outlined">arrow_back</span>
            </button>
            <div className="text-center">
              <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">오늘의 교회</h1>
              {data && <p className="text-[11.5px] text-[var(--text-muted)]">{formatKoreanDate(data.date)}</p>}
            </div>
            <span className="w-6" />
          </div>
          <div className="flex gap-1.5 px-4 pb-3" role="tablist">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                  tab === key
                    ? 'bg-ink-strong text-[var(--surface-container)]'
                    : 'bg-[var(--surface-inset)] text-[var(--text-muted)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse px-4 pt-4 lg:px-0 lg:pt-6" aria-hidden>
            <div className="h-44 rounded-2xl bg-gray-100 dark:bg-white/[0.04] lg:h-64" />
            <div className="mt-2.5 h-32 rounded-2xl bg-gray-100 dark:bg-white/[0.04]" />
          </div>
        ) : error || !data ? (
          <p className="px-4 pt-10 text-center text-[13.5px] text-[var(--text-muted)] lg:text-[17px]">
            {error instanceof Error ? error.message : '오늘의 교회를 불러오지 못했어요'}
          </p>
        ) : tab === 'me' ? (
          <MeTab data={data} />
        ) : (
          <ChurchTab church={data.church} />
        )}
      </div>
    </div>
  )
}

export default TodayChurch
