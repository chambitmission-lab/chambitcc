// 누군가의 기도 — 교회 전체 익명 중보 짝
//
// 참여 성도를 원형 사슬로 이어, 각자 한 명을 위해 몰래 기도한다. 매월 첫 주일에 짝이 바뀐다.
// 받는 사람은 누가 기도하는지 끝까지 모른다 — "누군가 나를 위해 기도했구나"로 충분하다.
//
// 한 화면이 상태에 따라 바뀐다:
//   닫힘 → 준비 중 / 비로그인 → 소개+로그인 / 미참여 → 소개+신청 /
//   쉬는 중 → 다시 함께하기 / 대기(첫 주기 전·인원 모으는 중) / 진행 중(등불 + 기도할 분)
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useJoinIntercession,
  useMyIntercession,
  usePauseIntercession,
  usePrayIntercession,
  useUpdateIntercessionLine,
} from '../../hooks/useIntercession'
import type { IntercessionState, IntercessionTarget } from '../../api/intercession'
import { isAuthenticated } from '../../utils/auth'
import { toastFeedback } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { RailCard, SurveyShell } from '../Survey/surveyUi'
import { FlameGlyph, Lamp } from './intercessionUi'
import { cycleMonthLabel, daysUntil, formatDay } from './intercessionDates'
import './intercession.css'

const LINE_MAX = 80

// ── 조각 ────────────────────────────────────────────────────────────────

const Hero = ({ label, title, children }: { label: string; title: string; children?: ReactNode }) => (
  <section className="relative overflow-hidden mx-4 mt-5 px-6 pt-7 pb-6 rounded-[26px] bg-[linear-gradient(135deg,#e3efff_0%,#eef5ff_60%,#f6f9ff_120%)] ring-1 ring-[rgba(49,130,246,0.14)] shadow-[0_10px_30px_-16px_rgba(49,130,246,0.45)] dark:bg-[linear-gradient(135deg,#0a1830_0%,#0d1d3a_60%,#101a2e_120%)] dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
    <span className="flex items-center gap-1.5 text-[12px] font-bold tracking-[0.02em] text-brand">
      <FlameGlyph size={14} />
      {label}
    </span>
    <h2 className="mt-2.5 text-[23px] font-extrabold tracking-[-0.02em] leading-[1.32] whitespace-pre-line text-[#152648] dark:text-white break-keep">
      {title}
    </h2>
    {children}
  </section>
)

const Card = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
  <section className="mx-4 mt-3 rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
    {title ? (
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[14.5px] font-extrabold text-ink-strong tracking-[-0.02em]">{title}</h3>
        {action}
      </div>
    ) : null}
    {children}
  </section>
)

const PrimaryButton = ({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full h-12 rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] text-[15px] font-bold tracking-[-0.01em] shadow-[0_8px_20px_-10px_rgba(49,130,246,0.8)] hover:brightness-110 active:scale-[0.985] transition disabled:opacity-60 disabled:active:scale-100 ${className}`}
  >
    {children}
  </button>
)

const HOW_IT_WORKS = [
  '매월 첫 주일, 함께하는 성도 가운데 한 분이 내가 기도할 분으로 정해져요.',
  '나를 위해 기도하는 분은 다른 분이에요. 누구인지는 끝까지 알려 드리지 않아요.',
  '기도한 날 "오늘 기도했어요"를 눌러 주세요. 그날 저녁, 그분께 "누군가 기도했어요" 소식이 조용히 전해져요.',
  '다음 달 첫 주일이 되면 새로운 분과 이어져요.',
]

const HowItWorks = () => (
  <ol className="space-y-2.5">
    {HOW_IT_WORKS.map((text, i) => (
      <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-[var(--text-body)]">
        <span className="shrink-0 mt-[1px] w-5 h-5 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold flex items-center justify-center tabular-nums">
          {i + 1}
        </span>
        <span className="break-keep">{text}</span>
      </li>
    ))}
  </ol>
)

/** 한 줄 기도제목 입력 — 신청할 때와 수정할 때 같이 쓴다 */
const LineInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, LINE_MAX))}
      rows={2}
      placeholder="예) 이직 준비 중이에요. 지혜를 구해 주세요"
      className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-3.5 py-3 text-[14px] leading-relaxed text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft-strong)]"
    />
    <p className="mt-1 flex justify-between text-[11.5px] text-[var(--text-muted)]">
      <span>기도해 주는 분께만 보여요 · 비워 두어도 괜찮아요</span>
      <span className="tabular-nums">
        {value.length}/{LINE_MAX}
      </span>
    </p>
  </div>
)

const Avatar = ({ name, url }: { name: string; url: string | null }) =>
  url ? (
    <img src={url} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-white/10" />
  ) : (
    <span className="w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand text-[20px] font-bold flex items-center justify-center">
      {name.slice(0, 1)}
    </span>
  )

// ── 상태별 본문 ──────────────────────────────────────────────────────────

const JoinPanel = ({ rejoin }: { rejoin: boolean }) => {
  const [line, setLine] = useState('')
  const join = useJoinIntercession(
    toastFeedback({ success: rejoin ? '다시 함께해요' : '함께해 주셔서 고마워요', error: '참여하지 못했습니다' }),
  )
  return (
    <Card title={rejoin ? '다시 함께하기' : '함께하기'}>
      {!rejoin ? (
        <p className="mb-3 text-[13px] leading-relaxed text-[var(--text-body)] break-keep">
          기도해 주는 분께 전하고 싶은 기도제목이 있다면 한 줄로 남겨 주세요.
        </p>
      ) : null}
      {!rejoin ? <LineInput value={line} onChange={setLine} /> : null}
      <PrimaryButton
        className="mt-3"
        disabled={join.isPending}
        onClick={() => join.mutate(rejoin ? null : line.trim() || null)}
      >
        {join.isPending ? '잠시만요…' : rejoin ? '다시 함께하기' : '누군가의 기도에 함께하기'}
      </PrimaryButton>
    </Card>
  )
}

const TargetCard = ({ target, month }: { target: IntercessionTarget; month: string }) => {
  const [burst, setBurst] = useState(false)
  const pray = usePrayIntercession(
    toastFeedback({ success: '기도가 조용히 전해질 거예요', error: '기도를 기록하지 못했습니다' }),
  )
  const done = target.prayed_today

  return (
    <Card title={`${month}에 내가 기도할 분`}>
      <div className="flex items-center gap-3.5">
        <Avatar name={target.display_name} url={target.avatar_url} />
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold text-ink-strong tracking-[-0.02em] truncate">
            {target.display_name} <span className="text-[14px] font-semibold text-[var(--text-muted)]">성도님</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
            이번 달 <strong className="text-brand tabular-nums">{target.prayed_days}</strong>일 기도했어요
          </p>
        </div>
      </div>

      {target.request_line ? (
        <blockquote className="mt-4 rounded-xl bg-[var(--brand-soft)] px-4 py-3 text-[14px] leading-relaxed text-ink-strong break-keep">
          “{target.request_line}”
        </blockquote>
      ) : (
        <p className="mt-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-muted)] break-keep">
          따로 남긴 기도제목은 없어요. 이분의 한 달을 하나님께 맡겨 드려요.
        </p>
      )}

      {target.recent_prayers.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11.5px] font-bold text-[var(--text-muted)]">최근에 나눈 기도</p>
          <ul className="space-y-1.5">
            {target.recent_prayers.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-gray-100 dark:border-white/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--text-body)]"
              >
                {p.title ? <strong className="block text-ink-strong">{p.title}</strong> : null}
                <span className="line-clamp-2">{p.preview}</span>
                <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">{p.time_ago}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {done ? (
        <div
          className={`mt-4 h-12 rounded-2xl flex items-center justify-center gap-1.5 bg-[var(--amber-soft)] text-[var(--amber)] text-[14.5px] font-bold ${
            burst ? 'ic-pray-burst' : ''
          }`}
        >
          <FlameGlyph size={17} />
          오늘 기도했어요 · 내일 또 만나요
        </div>
      ) : (
        <PrimaryButton
          className="mt-4"
          disabled={pray.isPending}
          onClick={() => pray.mutate(undefined, { onSuccess: () => setBurst(true) })}
        >
          🙏 오늘 기도했어요
        </PrimaryButton>
      )}
    </Card>
  )
}

const LampHero = ({ state }: { state: IntercessionState }) => {
  const lamp = state.lamp!
  const month = cycleMonthLabel(state.cycle!.start_date)
  const anyLit = lamp.weeks.some((w) => w.lit)
  const title = lamp.received_today
    ? '오늘도 누군가\n당신을 위해 기도했어요'
    : anyLit
      ? `${month}, 누군가 당신을 위해\n기도하고 있어요`
      : '누군가 당신을 위해\n기도할 거예요'
  return (
    <Hero label="누군가의 기도" title={title}>
      <div className="mt-6">
        <Lamp weeks={lamp.weeks} />
      </div>
      <p className="mt-4 text-center text-[12.5px] text-[#41527a] dark:text-white/70 break-keep">
        누군가의 기도가 닿은 주마다 초가 하나씩 켜져요
        {lamp.months_received > 1 ? (
          <>
            <br />
            지금까지 <strong className="text-brand tabular-nums">{lamp.months_received}</strong>달 동안 기도가 이어졌어요
          </>
        ) : null}
      </p>
    </Hero>
  )
}

const MyLineCard = ({ current }: { current: string | null }) => {
  const [editing, setEditing] = useState(false)
  const [line, setLine] = useState(current ?? '')
  const save = useUpdateIntercessionLine(
    toastFeedback({ success: '기도제목을 바꿨어요', error: '기도제목을 저장하지 못했습니다' }),
  )
  return (
    <Card
      title="나의 한 줄 기도제목"
      action={
        !editing ? (
          <button
            type="button"
            onClick={() => {
              setLine(current ?? '')
              setEditing(true)
            }}
            className="text-[12.5px] font-bold text-brand"
          >
            {current ? '고치기' : '남기기'}
          </button>
        ) : null
      }
    >
      {editing ? (
        <>
          <LineInput value={line} onChange={setLine} />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-white/10 text-[13.5px] font-semibold text-[var(--text-body)]"
            >
              취소
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() =>
                save.mutate(line.trim() || null, { onSuccess: () => setEditing(false) })
              }
              className="flex-1 h-10 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-[13.5px] font-bold disabled:opacity-60"
            >
              저장
            </button>
          </div>
        </>
      ) : (
        <p className="text-[13.5px] leading-relaxed text-[var(--text-body)] break-keep">
          {current ? `“${current}”` : '아직 남긴 기도제목이 없어요. 기도해 주는 분께 한 줄로 전해 보세요.'}
        </p>
      )}
    </Card>
  )
}

const ChurchLine = ({ state }: { state: IntercessionState }) =>
  state.cycle ? (
    <p className="mx-4 mt-4 text-center text-[12.5px] leading-relaxed text-[var(--text-muted)] break-keep">
      이번 달 우리 교회는 서로를 위해{' '}
      <strong className="text-brand tabular-nums">{state.church.cycle_prayers.toLocaleString()}</strong>번
      기도했어요 · 함께하는 성도{' '}
      <strong className="text-ink-strong tabular-nums">{state.church.participants.toLocaleString()}</strong>명
    </p>
  ) : state.church.participants > 0 ? (
    <p className="mx-4 mt-4 text-center text-[12.5px] text-[var(--text-muted)]">
      지금 <strong className="text-brand tabular-nums">{state.church.participants.toLocaleString()}</strong>명이
      함께하고 있어요
    </p>
  ) : null

const PauseLink = () => {
  const pause = usePauseIntercession(
    toastFeedback({ success: '잠시 쉬어 가요. 언제든 다시 함께해 주세요', error: '바꾸지 못했습니다' }),
  )
  const onPause = async () => {
    const ok = await confirmDialog({
      title: '잠시 쉴까요?',
      message: '쉬는 동안에는 기도할 분이 정해지지 않아요.\n언제든 다시 함께할 수 있어요.',
      confirmText: '잠시 쉬기',
      tone: 'brand',
    })
    if (ok) pause.mutate()
  }
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={() => void onPause()}
        disabled={pause.isPending}
        className="text-[12.5px] font-semibold text-[var(--text-muted)] underline underline-offset-4"
      >
        잠시 쉬기
      </button>
    </div>
  )
}

// ── 페이지 ──────────────────────────────────────────────────────────────

const Body = ({ state, loggedIn }: { state: IntercessionState; loggedIn: boolean }) => {
  const navigate = useNavigate()
  const p = state.participant

  if (!state.open) {
    return (
      <>
        <Hero label="누군가의 기도" title={'서로를 위해\n몰래 기도하는 달'}>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#41527a] dark:text-white/75 break-keep">
            곧 문을 열어요. 교회 광고와 홈 화면에서 먼저 알려 드릴게요.
          </p>
        </Hero>
        <Card title="이렇게 함께해요">
          <HowItWorks />
        </Card>
      </>
    )
  }

  // 비로그인이면 서버가 participant 를 주지 않는다 — 참여 여부만 보면 된다
  if (!p) {
    return (
      <>
        <Hero label="누군가의 기도" title={'누군가 당신을 위해\n기도하고 있다면'}>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#41527a] dark:text-white/75 break-keep">
            한 달 동안 교회의 한 분을 위해 몰래 기도해요. 그리고 또 다른 누군가가 당신을 위해 기도해요.
            {state.next_start_date && !state.cycle
              ? ` ${formatDay(state.next_start_date)}에 첫 짝이 정해져요.`
              : ''}
          </p>
        </Hero>
        {loggedIn ? (
          <JoinPanel rejoin={false} />
        ) : (
          <Card>
            <PrimaryButton onClick={() => navigate('/login')}>로그인하고 함께하기</PrimaryButton>
          </Card>
        )}
        <Card title="이렇게 함께해요">
          <HowItWorks />
        </Card>
        <ChurchLine state={state} />
      </>
    )
  }

  if (p.status === 'paused') {
    return (
      <>
        <Hero label="누군가의 기도" title={'잠시 쉬어 가는 중이에요'}>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#41527a] dark:text-white/75 break-keep">
            다시 함께하면 이번 달 사슬에 바로 이어져, 기도할 분이 정해져요.
          </p>
        </Hero>
        <JoinPanel rejoin />
        <ChurchLine state={state} />
      </>
    )
  }

  const month = state.cycle ? cycleMonthLabel(state.cycle.start_date) : ''

  return (
    <>
      {state.lamp && state.cycle ? (
        <LampHero state={state} />
      ) : (
        <Hero
          label="누군가의 기도"
          title={
            state.waiting_reason === 'not_started' && state.next_start_date
              ? `${formatDay(state.next_start_date)} 아침,\n기도할 분이 정해져요`
              : '함께할 분이 모이면\n기도할 분이 정해져요'
          }
        >
          <p className="mt-3 text-[13px] leading-[1.7] text-[#41527a] dark:text-white/75 break-keep">
            {state.waiting_reason === 'not_started' && state.next_start_date
              ? daysUntil(state.next_start_date) > 0
                ? `D-${daysUntil(state.next_start_date)} · 알림으로 먼저 알려 드릴게요.`
                : '곧 알림으로 알려 드릴게요.'
              : '짝이 서로를 알아보지 않도록 세 분 이상 모여야 시작돼요.'}
          </p>
        </Hero>
      )}

      {state.target ? (
        <TargetCard target={state.target} month={month} />
      ) : state.cycle && state.waiting_reason === 'gathering' ? (
        <Card>
          <p className="text-[13px] leading-relaxed text-[var(--text-body)] break-keep">
            함께하는 분이 조금 더 모이면 이번 달 기도할 분이 바로 정해져요.
          </p>
        </Card>
      ) : null}

      <MyLineCard current={p.request_line} />
      <ChurchLine state={state} />
      <PauseLink />
    </>
  )
}

const Intercession = () => {
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading, refetch } = useMyIntercession()

  const rail = data ? (
    <>
      <RailCard title="이렇게 함께해요">
        <HowItWorks />
      </RailCard>
      {data.open ? (
        <RailCard title="우리 교회">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">함께하는 성도</span>
              <span className="text-[16px] font-bold text-ink-strong tabular-nums">
                {data.church.participants.toLocaleString()}
              </span>
            </div>
            {data.cycle ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
                  이번 달 서로를 위한 기도
                </span>
                <span className="text-[16px] font-bold text-brand tabular-nums">
                  {data.church.cycle_prayers.toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>
        </RailCard>
      ) : null}
    </>
  ) : undefined

  return (
    <SurveyShell onBack={() => navigate('/')} title="누군가의 기도" rail={rail}>
      {isLoading && !data ? (
        <div className="py-24 flex justify-center">
          <span className="w-7 h-7 rounded-full border-2 border-[var(--brand-soft-strong)] border-t-[var(--brand)] animate-spin" />
        </div>
      ) : !data ? (
        <div className="py-20 text-center">
          <p className="text-[13.5px] text-[var(--text-muted)]">불러오지 못했어요</p>
          <button type="button" onClick={() => void refetch()} className="mt-3 text-[13px] font-bold text-brand">
            다시 시도
          </button>
        </div>
      ) : (
        <Body state={data} loggedIn={loggedIn} />
      )}
      {/* 레일이 없는 모바일에선 안내를 본문 아래에 둔다 (진행 중 화면 기준) */}
      {data?.open && data.participant?.status === 'active' ? (
        <div className="lg:hidden">
          <Card title="이렇게 함께해요">
            <HowItWorks />
          </Card>
        </div>
      ) : null}
    </SurveyShell>
  )
}

export default Intercession
