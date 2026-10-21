// 동행 (/companion) — 짝과 한 주 목표를 합산으로 함께 채운다
// 함께 걷는 중 / 받은 초대 / 보낸 초대 + 새 동행 초대 시트
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MemberSearchInput from '../../components/common/MemberSearchInput'
import { useAcceptCompanion, useInviteCompanion, useLeaveCompanion, useMyCompanions } from '../../hooks/useCompanion'
import type { CompanionGoal, CompanionSummary } from '../../types/companion'
import type { CapsuleRecipient } from '../../types/timeCapsule'
import { useThemeArt } from '../../hooks/useThemeArt'
import { COMPANION_HERO } from '../../utils/themeAssets'
import { isAuthenticated } from '../../utils/auth'
import { confirmDialog } from '../../utils/confirmDialog'
import { sessionStore } from '../../utils/tokenStore'
import { showToast } from '../../utils/toast'
import { Avatar, CompanionShell, RailCard, RailStat, Sheet } from './CompanionParts'
import FootprintPath from './FootprintPath'
import GoalPicker from './GoalPicker'
import { GOAL_SPECS, goalText } from './companionGoals'

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

const CompanionList = () => {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const { data, isLoading } = useMyCompanions(authed)
  const [inviteOpen, setInviteOpen] = useState(false)
  const accept = useAcceptCompanion()
  const leave = useLeaveCompanion()
  const heroArtReady = useThemeArt(COMPANION_HERO)

  const openInvite = () => {
    if (!authed) {
      sessionStorage.setItem('redirect_after_login', '/companion')
      navigate('/login')
      return
    }
    setInviteOpen(true)
  }

  const handleAccept = async (c: CompanionSummary) => {
    try {
      const detail = await accept.mutateAsync(c.id)
      navigate(`/companion/${detail.id}`)
    } catch (e) {
      showToast(errorText(e, '초대를 받지 못했어요'), 'error')
    }
  }

  const handleDrop = async (c: CompanionSummary, mode: 'decline' | 'cancel') => {
    const ok = await confirmDialog({
      title: mode === 'decline' ? '초대 거절' : '초대 취소',
      message:
        mode === 'decline'
          ? `${c.partner.name}님의 동행 초대를 거절할까요?\n상대에게 따로 알림은 가지 않아요.`
          : `${c.partner.name}님에게 보낸 초대를 거둘까요?`,
      confirmText: mode === 'decline' ? '거절' : '취소하기',
      cancelText: '돌아가기',
      tone: 'warning',
    })
    if (!ok) return
    leave.mutate(c.id, { onError: (e) => showToast(errorText(e, '처리하지 못했어요'), 'error') })
  }

  const busyIds = [
    ...(data?.active ?? []),
    ...(data?.incoming ?? []),
    ...(data?.outgoing ?? []),
  ].map((c) => c.partner.id)

  const litNow = data?.active.filter((c) => c.week?.achieved).length ?? 0

  // 우측 레일(lg+) — 초대 버튼을 늘 손 닿는 곳에, 본문은 짝 카드에만 집중
  const rail = (
    <>
      <RailCard>
        <button
          type="button"
          onClick={openInvite}
          className="w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
        >
          동행 초대하기
        </button>
        <p className="mt-2.5 text-[12px] leading-[1.6] text-gray-500 dark:text-white/50">
          우리 교회 성도와 한 번에 3명까지 함께 걸을 수 있어요.
        </p>
      </RailCard>
      {authed && data && (
        <RailCard title="한눈에">
          <div className="flex flex-col gap-1.5">
            <RailStat label="함께 걷는 짝" value={data.active.length} />
            {data.active.length > 0 && <RailStat label="이번 주 등불 켜진 짝" value={litNow} accent />}
            {data.incoming.length > 0 && <RailStat label="받은 초대" value={data.incoming.length} accent />}
            {data.outgoing.length > 0 && <RailStat label="답을 기다리는 초대" value={data.outgoing.length} />}
          </div>
        </RailCard>
      )}
      <RailCard title="동행은 이렇게">
        <ol className="flex flex-col gap-2.5">
          {[
            ['목표를 함께 정해요', '성경 읽기·필사·기도 중 하나, 이번 주 둘이 합쳐 얼마나'],
            ['평소대로 하면 돼요', '읽고 필사하고 기도한 기록이 저절로 쌓여요'],
            ['합쳐서 등불을 켜요', '누가 더 했는지는 세지 않아요. 못 채운 주는 쉼표예요'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-2.5">
              <span className="mt-[1px] w-5 h-5 shrink-0 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <div className="text-[13px] font-bold text-ink-strong">{t}</div>
                <div className="text-[12px] leading-[1.55] text-gray-500 dark:text-white/50 mt-0.5">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </RailCard>
    </>
  )

  return (
    <CompanionShell title="동행" backTo="/" backLabel="홈" rail={rail}>
      {/* 히어로 — 무엇을 하는 곳인지 세 줄로. 오른쪽 삽화(함께 걷는 두 양)가 '동행'을 대신 보여 준다 */}
      <section
        style={{ ['--cp-hero-light' as string]: `url(${COMPANION_HERO.light})`, ['--cp-hero-dark' as string]: `url(${COMPANION_HERO.dark})` }}
        className="cp-hero relative overflow-hidden isolate mx-4 lg:mx-6 mt-5 lg:mt-6 rounded-[26px] px-6 py-7 lg:px-9 lg:py-9 ring-1 ring-[rgba(49,130,246,0.12)] dark:ring-white/[0.06]">
        <div className="relative z-[1] lg:max-w-[46%]">
        <span className="cp-hero__eyebrow block text-[11px] font-semibold uppercase tracking-[0.34em] text-brand">Walk together</span>
        <h2 className="cp-hero__title text-[24px] lg:text-[30px] font-extrabold tracking-[-0.03em] leading-[1.3] text-ink-strong mt-3">
          혼자 말고, 둘이
          <br />
          한 주를 채워요
        </h2>
        <p className="cp-hero__body text-[13px] lg:text-[14px] leading-[1.7] break-keep text-gray-600 dark:text-white/70 mt-3">
          짝과 이번 주 목표를 정하면, 각자 읽고 필사하고 기도한 만큼 <b className="font-bold text-ink-strong">합쳐서</b> 쌓여요.
          누가 더 했는지는 세지 않아요. 바쁜 주엔 짝이 메꿔줘요.
        </p>
        </div>
        {/* 삽화 — lg 에선 카드 오른쪽 배경, 모바일에선 글과 버튼 사이 띠 */}
        <div className={`cp-hero-art${heroArtReady ? ' is-loaded' : ''}`} aria-hidden />
        {/* lg 에선 우측 레일의 같은 버튼이 대신한다 */}
        <button
          type="button"
          onClick={openInvite}
          className="relative lg:hidden mt-1 w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] active:scale-[0.99] transition-transform"
        >
          동행 초대하기
        </button>
      </section>

      {!authed ? (
        <Empty text="로그인하면 함께 걷는 짝이 여기 보여요" />
      ) : isLoading ? (
        <div className="px-4 lg:px-6 pt-8 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {!!data?.incoming.length && (
            <Section title="받은 초대">
              {data.incoming.map((c) => (
                <div key={c.id} className="rounded-2xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-bold text-ink-strong truncate">{c.partner.name}님이 함께 걷자고 해요</div>
                      <div className="text-[12.5px] text-gray-500 dark:text-white/55 mt-0.5">
                        매주 둘이 합쳐 {goalText(c.goal_type, c.goal_amount)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDrop(c, 'decline')}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[13.5px] font-bold text-gray-600 dark:text-white/70"
                    >
                      다음에요
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(c)}
                      disabled={accept.isPending}
                      className="flex-[2] py-2.5 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-50"
                    >
                      함께 걸을게요
                    </button>
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section title="함께 걷는 중">
            {data?.active.length ? (
              data.active.map((c) => <ActiveCard key={c.id} c={c} onOpen={() => navigate(`/companion/${c.id}`)} />)
            ) : (
              <p className="text-[13px] text-gray-500 dark:text-white/50 px-0.5 lg:col-span-2">
                아직 짝이 없어요. 같이 걷고 싶은 성도를 초대해 보세요.
              </p>
            )}
          </Section>

          {!!data?.outgoing.length && (
            <Section title="보낸 초대">
              {data.outgoing.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark px-4 py-3">
                  <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink-strong truncate">{c.partner.name}</div>
                    <div className="text-[12px] text-gray-500 dark:text-white/50">답을 기다리는 중 · {goalText(c.goal_type, c.goal_amount)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDrop(c, 'cancel')}
                    className="shrink-0 text-[12.5px] font-semibold text-gray-400 dark:text-white/45 hover:text-gray-600"
                  >
                    취소
                  </button>
                </div>
              ))}
            </Section>
          )}
        </>
      )}

      {inviteOpen && <InviteSheet excludeIds={busyIds} onClose={() => setInviteOpen(false)} />}
    </CompanionShell>
  )
}

const ActiveCard = ({ c, onOpen }: { c: CompanionSummary; onOpen: () => void }) => {
  const week = c.week
  const spec = GOAL_SPECS[c.goal_type]
  const myName = sessionStore.get('fullName') || '나'
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          <Avatar name={myName} url={sessionStore.get('avatarUrl')} tone="me" size={30} />
          <Avatar name={c.partner.name} url={c.partner.avatar_url} tone="you" size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold text-ink-strong truncate">{c.partner.name}님과 동행</div>
          <div className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">
            함께 걸은 {c.together_weeks}주 · 등불 {c.lit_weeks}개
          </div>
        </div>
        {week?.achieved && (
          <span className="shrink-0 px-2 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold">이번 주 완성</span>
        )}
      </div>
      {week && (
        <>
          <FootprintPath week={week} myName={myName} partnerName={c.partner.name} className="mt-3" />
          <div className="mt-1 flex items-baseline justify-between text-[12.5px]">
            <span className="text-gray-500 dark:text-white/55">이번 주 {spec.label}</span>
            <span className="font-bold text-ink-strong tabular-nums">
              {Math.min(week.total, week.goal_amount)} / {week.goal_amount}
              {spec.unit}
            </span>
          </div>
        </>
      )}
    </button>
  )
}

const InviteSheet = ({ excludeIds, onClose }: { excludeIds: number[]; onClose: () => void }) => {
  const invite = useInviteCompanion()
  const [picked, setPicked] = useState<CapsuleRecipient | null>(null)
  const [goal, setGoal] = useState<CompanionGoal>({ goal_type: 'reading', goal_amount: GOAL_SPECS.reading.defaultAmount })

  const send = async () => {
    if (!picked) return
    try {
      await invite.mutateAsync({ userId: picked.id, goal })
      showToast(`${picked.display_name}님에게 초대를 보냈어요`, 'success')
      onClose()
    } catch (e) {
      showToast(errorText(e, '초대를 보내지 못했어요'), 'error')
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-[17px] font-bold text-ink-strong">함께 걸을 사람</h3>
      <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4 leading-[1.6]">
        우리 교회 성도만 초대할 수 있어요. 받은 분이 수락하면 이번 주부터 함께 채워요.
      </p>
      {picked ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-[var(--brand-soft)] px-3.5 py-2.5">
          <Avatar name={picked.display_name} url={picked.avatar_url} tone="you" size={30} />
          <span className="flex-1 text-[14px] font-bold text-ink-strong">{picked.display_name}</span>
          <button type="button" onClick={() => setPicked(null)} className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
            바꾸기
          </button>
        </div>
      ) : (
        <MemberSearchInput
          excludeIds={excludeIds}
          onPick={setPicked}
          placeholder="이름을 검색해요"
          emptyHint="찾을 수 없어요. 우리 교회 앱에 가입한 성도만 초대할 수 있어요."
        />
      )}

      <div className="mt-6 text-[13px] font-bold text-ink-strong">무엇을 함께 채울까요?</div>
      <div className="mt-2.5">
        <GoalPicker value={goal} onChange={setGoal} />
      </div>

      <button
        type="button"
        onClick={send}
        disabled={!picked || invite.isPending}
        className="mt-6 w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40"
      >
        {picked ? `${picked.display_name}님에게 초대 보내기` : '함께할 사람을 골라주세요'}
      </button>
    </Sheet>
  )
}

// lg 에선 카드 2열 — 넓어진 폭에 카드가 늘어나 보이지 않게
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="px-4 lg:px-6 pt-8">
    <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-3 px-0.5">{title}</h3>
    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">{children}</div>
  </section>
)

const Empty = ({ text }: { text: string }) => (
  <p className="px-5 pt-10 text-center text-[13px] text-gray-500 dark:text-white/50">{text}</p>
)

export default CompanionList
