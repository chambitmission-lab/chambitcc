// /today — 오늘의 교회 상세. 홈 맨 위 봉투 한 줄(TodayChurchCard)을 누르면 온다.
//   탭 1 작년 오늘의 나: 1년·6개월·1개월 전 오늘의 기록 + 작년 이맘때 응답된 기도
//   탭 2 어제 우리 교회: 어제 하루 익명 집계(지난 7일 평균 대비) · 기도한 시간 · 많이 읽힌 장 · 기도에 담긴 마음
// ?tab=church 면 두 번째 탭이 먼저 열린다.
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { AnsweredEcho, ChurchDay, ChurchMetricKey, TodayChurch as TodayChurchData, TodayMemory } from '../../api/todayChurch'
import type { PrayerEmotion } from '../../types/prayer'
import { useTodayChurch } from '../../hooks/useTodayChurch'
import { AnswerAsk, MemoryQuote } from './MemoryLetter'
import { formatKoreanDate, markTodayChurchOpened, memoryMeta, memoryWhen } from './memoryCopy'

type Tab = 'me' | 'church'
const TABS = [
  ['me', '작년 오늘의 나'],
  ['church', '어제 우리 교회'],
] as const

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
const dayLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일 (${WEEKDAY[new Date(y, m - 1, d).getDay()]})`
}

const EMOTION_LABEL: Record<PrayerEmotion, string> = {
  tired: '😮‍💨 지침',
  anxious: '😟 불안',
  sad: '😢 슬픔',
  lonely: '🥺 외로움',
  angry: '😠 분노',
  confused: '😵‍💫 혼란',
  hopeful: '🌱 소망',
  grateful: '🙏 감사',
}

const hourLabel = (h: number) => {
  if (h < 5) return `새벽 ${h}시`
  if (h < 9) return `아침 ${h}시`
  if (h < 12) return `오전 ${h}시`
  if (h < 18) return `오후 ${h === 12 ? 12 : h - 12}시`
  if (h < 21) return `저녁 ${h - 12}시`
  return `밤 ${h - 12}시`
}

const chapterLabel = (bookNumber: number, chapter: number) => (bookNumber === 19 ? `${chapter}편` : `${chapter}장`)

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

// ── 탭 2: 어제 우리 교회 ──────────────────────────────
// 모바일은 카드 한 장에 섹션을 세로로 잇고, PC(lg)는 카드 껍데기를 풀어(lg:contents) 섹션마다
// 큰 카드로 2단 격자에 놓는다 — 맨 위 요약만 두 칸을 차지한다. 노안 성도 기준으로 글씨를 크게.
const BLOCK =
  'mt-5 lg:mt-0 lg:rounded-2xl lg:border lg:border-[var(--card-border)] lg:bg-[var(--surface-container)] lg:p-7 lg:shadow-[var(--card-shadow)]'
const BLOCK_TITLE = 'text-[12px] font-semibold text-[var(--text-muted)] lg:text-[17px] lg:font-bold lg:text-ink-strong'

const STAT_TILES: { key: ChurchMetricKey; label: string; unit: string }[] = [
  { key: 'active_users', label: '함께한 성도', unit: '명' },
  { key: 'chapters', label: '읽은 장', unit: '장' },
  { key: 'prayers', label: '기도했어요', unit: '번' },
  { key: 'typing_verses', label: '필사한 절', unit: '절' },
]

const HoursChart = ({ hours }: { hours: number[] }) => {
  const max = Math.max(1, ...hours)
  const peak = hours.indexOf(max)
  const W = 240
  const H = 64
  const bw = W / 24
  return (
    <div className={BLOCK}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className={BLOCK_TITLE}>우리 교회가 기도한 시간</span>
        <span className="text-[12px] font-semibold text-brand lg:text-[16px]">{hourLabel(peak)}에 가장 많이 기도했어요</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 block h-16 w-full lg:mt-5 lg:h-44" role="img"
        aria-label={`시간대별 기도 수, ${hourLabel(peak)}이 가장 많음`}>
        {hours.map((n, h) => {
          const bh = n === 0 ? 1.5 : Math.max(3, (n / max) * (H - 4))
          return (
            <rect
              key={h}
              x={h * bw + 1}
              y={H - bh}
              width={bw - 2}
              height={bh}
              rx={1.5}
              fill={h === peak ? 'var(--brand)' : 'var(--brand-soft-strong)'}
            />
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] text-[var(--text-muted)] tabular-nums lg:mt-2 lg:text-[14px]">
        <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span>
      </div>
    </div>
  )
}

/** 책별 순위 — 막대 길이는 1위 대비. 인원은 서버가 문턱 이상일 때만 준다 */
const BookRanking = ({
  title,
  rows,
}: {
  title: string
  rows: { book_number: number; book_name: string; value: number; unit: string; sub: string | null }[]
}) => {
  if (!rows.length) return null
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className={BLOCK}>
      <p className={BLOCK_TITLE}>{title}</p>
      <ol className="mt-2 flex flex-col gap-2 lg:mt-4 lg:gap-4">
        {rows.map((r, i) => (
          <li key={r.book_number} className="flex items-center gap-3 lg:gap-4">
            <span className="w-4 shrink-0 text-[13px] font-extrabold text-brand tabular-nums lg:w-6 lg:text-[19px]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[14px] font-semibold text-ink-strong lg:text-[19px]">{r.book_name}</span>
                <span className="shrink-0 text-[12.5px] text-[var(--text-muted)] tabular-nums lg:text-[16px]">
                  <b className="font-bold text-ink-strong">
                    {r.value.toLocaleString()}
                    {r.unit}
                  </b>
                  {r.sub && ` · ${r.sub}`}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-inset)] lg:mt-2 lg:h-2.5">
                <div
                  className={`h-full rounded-full ${i === 0 ? 'bg-brand' : 'bg-[var(--brand-soft-strong)]'}`}
                  style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const ChurchTab = ({ church }: { church: ChurchDay }) => {
  const navigate = useNavigate()
  const m = church.metrics
  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-6">
      <p className="px-1 pb-2 text-[12px] font-bold text-[var(--text-muted)] lg:px-0 lg:pb-4 lg:text-[17px]">어제 · {dayLabel(church.date)}</p>
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      <section className="feed-card rounded-2xl px-4 py-4 lg:contents">
        {church.hidden || !m ? (
          <p className={`${BLOCK} !mt-0 py-6 text-center text-[13.5px] leading-[1.65] text-[var(--text-muted)] break-keep lg:col-span-2 lg:py-14 lg:text-[18px]`}>
            어제는 함께한 성도가 적어서 숫자를 쉬어 가요.
            <br />누가 했는지 짐작되지 않도록 적은 인원의 기록은 보여 드리지 않아요.
          </p>
        ) : (
          <>
            <div className={`${BLOCK} !mt-0 lg:col-span-2 lg:px-8 lg:py-8`}>
            <p className="break-keep text-[17px] font-bold leading-[1.5] text-ink-strong lg:text-[30px] lg:leading-[1.4] lg:tracking-[-0.03em]">
              어제 <span className="text-brand tabular-nums">{m.active_users.value}명</span>의 성도가{' '}
              <span className="text-brand tabular-nums">{m.chapters.value}장</span>을 읽고, 서로를 위해{' '}
              <span className="text-brand tabular-nums">{m.prayers.value}번</span> 기도했어요.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-7 lg:grid-cols-4 lg:gap-3">
              {STAT_TILES.map(({ key, label, unit }) => {
                const { value, avg } = m[key]
                const up = value - avg
                return (
                  <div key={key} className="rounded-xl bg-[var(--surface-inset)] px-3 py-2.5 lg:rounded-2xl lg:px-6 lg:py-5">
                    <p className="text-[12px] font-semibold text-[var(--text-muted)] lg:text-[16px]">{label}</p>
                    <p className="mt-0.5 text-[21px] font-extrabold text-ink-strong tabular-nums lg:mt-1.5 lg:text-[42px] lg:leading-none lg:tracking-[-0.03em]">
                      {value.toLocaleString()}
                      <small className="ml-0.5 text-[12px] font-semibold text-[var(--text-muted)] lg:ml-1 lg:text-[18px] lg:tracking-normal">{unit}</small>
                    </p>
                    {/* 늘어난 것만 초록으로 — 줄어든 날을 굳이 강조하지 않는다 */}
                    <p className={`mt-0.5 text-[11.5px] tabular-nums lg:mt-3 lg:text-[14.5px] ${up > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                      {up > 0 ? `지난 7일 평균보다 ${up}${unit} ↑` : `지난 7일 평균 ${avg}${unit}`}
                    </p>
                  </div>
                )
              })}
            </div>
            {m.meditations.value > 0 && (
              <p className="mt-3 text-[12.5px] text-[var(--text-muted)] lg:mt-5 lg:text-[16px]">
                묵상 노트도 <b className="text-ink-strong tabular-nums">{m.meditations.value}편</b> 남겨졌어요
              </p>
            )}
            </div>

            {church.hours && <HoursChart hours={church.hours} />}

            <BookRanking
              title="어제 많이 읽은 책"
              rows={(church.reading_books ?? []).map((b) => ({
                book_number: b.book_number,
                book_name: b.book_name,
                value: b.chapters,
                unit: '장',
                sub: b.people ? `${b.people}명` : null,
              }))}
            />
            <BookRanking
              title="어제 많이 필사한 책"
              rows={(church.typing_books ?? []).map((b) => ({
                book_number: b.book_number,
                book_name: b.book_name,
                value: b.verses,
                unit: '절',
                sub: [`${b.chapters}장`, b.people ? `${b.people}명` : null].filter(Boolean).join(' · '),
              }))}
            />

            {church.top_chapters.length > 0 && (
              <div className={BLOCK}>
                <p className={BLOCK_TITLE}>어제 가장 많은 성도가 펼친 장</p>
                <ol className="mt-1 lg:mt-2">
                  {church.top_chapters.map((c, i) => (
                    <li key={`${c.book_number}-${c.chapter}`} className="border-[var(--card-border)] [&:not(:first-child)]:border-t">
                      <button
                        type="button"
                        onClick={() => navigate(`/bible/${c.book_number}/${c.chapter}`)}
                        className="flex w-full items-center gap-3 py-2.5 text-left text-[14px] text-ink-strong hover:text-brand lg:gap-4 lg:py-4 lg:text-[19px]"
                      >
                        <span className="w-4 font-extrabold text-brand tabular-nums lg:w-6">{i + 1}</span>
                        <span>
                          {c.book_name} {chapterLabel(c.book_number, c.chapter)}
                        </span>
                        <span className="ml-auto text-[12.5px] text-[var(--text-muted)] tabular-nums lg:text-[16px]">{c.readers}명</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {church.emotions.length > 0 && (
          <div className={church.hidden || !m ? `${BLOCK} !mt-0 lg:col-span-2` : BLOCK}>
            <p className={BLOCK_TITLE}>이번 주 기도에 많이 담긴 마음</p>
            <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-4 lg:gap-2.5">
              {church.emotions.map((e) => (
                <span
                  key={e.emotion}
                  className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[12.5px] font-semibold text-[var(--brand-muted)] lg:px-4 lg:py-2 lg:text-[17px]"
                >
                  {EMOTION_LABEL[e.emotion] ?? e.emotion}
                  {e.rising && <span className="ml-0.5 text-emerald-600 dark:text-emerald-400" aria-label="지난주보다 늘었어요">↑</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
      </div>
      <p className="px-1 pb-6 pt-2.5 text-[11.5px] leading-[1.6] text-[var(--text-muted)] break-keep lg:px-0 lg:pt-5 lg:text-[15px]">
        누가 무엇을 했는지는 보이지 않아요. 모든 숫자는 익명 집계이고, 인원이 적은 항목은 숨겨요.
      </p>
    </div>
  )
}

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
