// 참비 관제실 머리 — 참비 상태(남색 판, 라이트·다크 공통) + 최근 7일 막대.
// 하루 집계(GET /chatbot/stats)가 있으면 답한 비율·요일별 답함/애매/못 답함을, 없으면(백엔드 배포 전·조회 실패)
// 미답변함에 쌓인 새 질문만 보여 준다. 비율을 지어내지 않는다.
import type { ChatbotIntent, ChatbotStats, ChatbotUnanswered } from '../../../types/chatbot'
import { avatarJoy, avatarThinking, tone } from './chatbotTheme'
import { lastSevenDays, weekSummary } from './chatbotAdminUtils'

interface Props {
  unanswered: ChatbotUnanswered[]
  intents: ChatbotIntent[]
  stats: ChatbotStats | null
}

const WD = ['일', '월', '화', '수', '목', '금', '토']

const dayLabel = (iso: string, isToday: boolean) => {
  if (isToday) return '오늘'
  const [y, m, d] = iso.split('-').map(Number)
  return WD[new Date(y, m - 1, d).getDay()]
}

const ChatbotHero = ({ unanswered, intents, stats }: Props) => {
  const waiting = unanswered.filter((u) => u.status !== 'resolved')
  const people = waiting.reduce((s, u) => s + u.ask_count, 0)
  const learned = unanswered.filter((u) => u.status === 'resolved').length
  const active = intents.filter((i) => i.is_active).length
  const week = stats ? weekSummary(stats) : null
  const hasWeek = !!week && week.total > 0
  const calm = waiting.length === 0

  // 막대: 집계가 있으면 (답함·애매·못 답함), 없으면 미답변함의 새 질문(못 답함·애매·해결)
  const bars = stats
    ? stats.days.slice(-7).map((d, i, arr) => ({
        key: d.date,
        label: dayLabel(d.date, i === arr.length - 1),
        segs: [
          { n: d.missed, cls: 'bg-rose-400' },
          { n: d.weak, cls: 'bg-amber-400' },
          { n: d.answered, cls: tone.accentBg },
        ],
      }))
    : lastSevenDays(unanswered).map((d) => ({
        key: d.key,
        label: d.label,
        segs: [
          { n: d.open, cls: 'bg-rose-400' },
          { n: d.weak, cls: 'bg-amber-400' },
          { n: d.resolved, cls: tone.accentBg },
        ],
      }))
  const totals = bars.map((b) => b.segs.reduce((s, x) => s + x.n, 0))
  const max = Math.max(1, ...totals)
  const barTotal = totals.reduce((s, n) => s + n, 0)

  return (
    <section className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16264a] to-[#0f1830] text-white border border-white/10 p-5 lg:p-6 flex items-center gap-4 lg:gap-5">
        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#3182f6]/25 blur-3xl" />
        <div className="relative shrink-0">
          <img
            src={calm ? avatarJoy : avatarThinking}
            alt=""
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full ring-4 ring-[#5aa2ff]/40"
          />
          <span
            className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full ring-4 ring-[#16264a] ${calm ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <p className={`m-0 text-[13px] font-bold ${calm ? 'text-emerald-300' : 'text-amber-300'}`}>
            {calm ? '● 기다리는 질문 없음' : `● 가르쳐 줄 질문 ${waiting.length}개 · ${people}명이 기다려요`}
          </p>
          <p className="m-0 mt-1 text-[22px] lg:text-[26px] font-extrabold leading-tight tracking-tight">
            {hasWeek ? (
              <>
                최근 7일 질문 {week!.total}개 중 <span className="text-[#8fc0ff]">{week!.rate}%</span>에 답했어요
              </>
            ) : calm ? (
              <>참비가 막힘없이 답하고 있어요</>
            ) : (
              <>
                <span className="text-[#8fc0ff]">{people}명</span>이 참비의 답을 기다려요
              </>
            )}
          </p>
          <p className="m-0 mt-1.5 text-[14px] text-white/65">
            {hasWeek && week!.diff != null && (
              <>
                그 전 7일보다{' '}
                <b className={week!.diff >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {week!.diff >= 0 ? `${week!.diff}%p 올랐어요` : `${-week!.diff}%p 내렸어요`}
                </b>{' '}
                ·{' '}
              </>
            )}
            아는 말 {intents.length}가지(켜짐 {active}) · 해결한 질문 {learned}개
          </p>
        </div>
      </div>

      <div className={`rounded-3xl ${tone.panel} p-5`}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className={`m-0 text-[14px] font-bold ${tone.strong}`}>
            {stats ? '요일별 질문' : '최근 7일 새 질문'} <span className={tone.accentText}>{barTotal}</span>
          </p>
          <span className={`flex gap-2.5 text-[12px] ${tone.sub}`}>
            <span className="inline-flex items-center gap-1">
              <i className={`w-2 h-2 rounded-full ${tone.accentBg}`} />
              {stats ? '답함' : '해결'}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-amber-400" />
              애매
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-rose-400" />
              못 답함
            </span>
          </span>
        </div>
        <div className="flex items-end gap-2 h-[96px]">
          {bars.map((b, i) => {
            const t = totals[i]
            return (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-1" title={`${b.label} ${t}개`}>
                <span className={`text-[11px] font-bold ${t ? tone.body : 'text-transparent'}`}>{t}</span>
                <div className="w-full flex flex-col justify-end rounded-md overflow-hidden bg-gray-100 dark:bg-white/[0.05]" style={{ height: 56 }}>
                  {t > 0 && (
                    <div className="flex flex-col" style={{ height: `${(t / max) * 100}%` }}>
                      {b.segs.map((s, j) => (
                        <div key={j} className={s.cls} style={{ flex: s.n }} />
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[12px] ${b.label === '오늘' ? `font-bold ${tone.strong}` : tone.sub}`}>{b.label}</span>
              </div>
            )
          })}
        </div>
        {stats && stats.since && stats.since > (stats.days[stats.days.length - 7]?.date ?? '') && (
          <p className={`m-0 mt-2 text-[12px] ${tone.sub}`}>집계는 {Number(stats.since.slice(5, 7))}/{Number(stats.since.slice(8, 10))}부터 쌓이고 있어요</p>
        )}
        {stats && !stats.since && <p className={`m-0 mt-2 text-[12px] ${tone.sub}`}>집계를 막 시작했어요 — 질문이 들어오면 채워져요</p>}
      </div>
    </section>
  )
}

export default ChatbotHero
