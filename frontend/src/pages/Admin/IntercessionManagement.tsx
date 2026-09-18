// 관리자 — 누군가의 기도 (교회 전체 익명 중보 짝) 운영
//
// 할 수 있는 일은 둘뿐이다: 열기/닫기, 첫 주일을 기다리지 않고 지금 주기 시작.
// 짝 배정은 매월 첫 주일 아침 7시 스케줄러가 한다.
// 익명 원칙상 누가 누구를 위해 기도하는지는 이 화면에도 보여 주지 않는다 — 숫자만.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useIntercessionAdmin,
  useIntercessionLetterReports,
  useResolveIntercessionReport,
  useSetIntercessionOpen,
  useStartIntercessionNow,
} from '../../hooks/useIntercession'
import { can } from '../../utils/access'
import { showToast, toastFeedback } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import { AdminPageHeader, SectionCard, StatSpinner } from './components/StatCards'
import { cycleMonthLabel, formatDay } from '../Intercession/intercessionDates'

const Stat = ({ label, value, accent = false }: { label: string; value: number | undefined; accent?: boolean }) => (
  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] px-3.5 py-3">
    <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">{label}</p>
    <p
      className={`mt-1 text-[20px] font-bold tracking-[-0.02em] leading-none tabular-nums ${
        accent ? 'text-brand' : 'text-ink-strong'
      }`}
    >
      {(value ?? 0).toLocaleString()}
    </p>
  </div>
)

/** 신고된 익명 편지 — 신고가 들어온 편지에 한해서만 보낸 사람을 보여 준다 */
const LetterReports = ({ enabled }: { enabled: boolean }) => {
  const { data } = useIntercessionLetterReports(enabled)
  const resolve = useResolveIntercessionReport(
    toastFeedback({
      success: (_d, v) => (v.restore ? '편지를 받은 편지함에 되돌렸습니다' : '숨김을 확정했습니다'),
      error: '신고를 처리하지 못했습니다',
    }),
  )
  const items = data ?? []

  return (
    <SectionCard
      title="신고된 편지"
      action={
        <span className="text-[11px] text-gray-400 dark:text-white/40">
          {items.length > 0 ? `${items.length}건 대기` : '대기 없음'}
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-[12.5px] text-gray-500 dark:text-white/50">처리를 기다리는 신고가 없습니다.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[var(--amber-soft-strong)] bg-[var(--amber-soft)] px-3.5 py-3"
            >
              <p className="text-[11.5px] font-semibold text-gray-500 dark:text-white/55">
                {cycleMonthLabel(r.month_start)} 편지 · 보낸 사람 {r.sender_name} → 받은 사람 {r.receiver_name}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-strong whitespace-pre-line break-keep">
                {r.body}
              </p>
              {r.report_reason ? (
                <p className="mt-1 text-[12px] text-gray-500 dark:text-white/50">신고 사유: {r.report_reason}</p>
              ) : null}
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ id: r.id, restore: true })}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[12.5px] font-bold text-ink-strong"
                >
                  문제없음 · 되돌리기
                </button>
                <button
                  type="button"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ id: r.id, restore: false })}
                  className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-[12.5px] font-bold"
                >
                  숨김 확정
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11.5px] leading-relaxed text-gray-400 dark:text-white/40 break-keep">
        신고된 편지는 받은 분 편지함에서 바로 숨겨집니다. 보낸 분께는 신고 사실이 알려지지 않습니다.
      </p>
    </SectionCard>
  )
}

const IntercessionManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  const { data, isPending } = useIntercessionAdmin(admin)
  const setOpen = useSetIntercessionOpen(
    toastFeedback({
      success: (d) => (d.open ? '누군가의 기도를 열었습니다' : '누군가의 기도를 닫았습니다'),
      error: '설정을 바꾸지 못했습니다',
    }),
  )
  const startNow = useStartIntercessionNow(
    toastFeedback({ success: '이번 주기를 시작하고 짝을 정했습니다', error: '주기를 시작하지 못했습니다' }),
  )

  const onToggle = async () => {
    if (!data) return
    if (data.open) {
      const ok = await confirmDialog({
        title: '누군가의 기도 닫기',
        message: '메뉴·홈 카드·신청이 숨겨지고\n새 주기 배정과 저녁 알림도 멈춥니다.',
        description: '참여 기록과 짝은 그대로 남아, 다시 열면 이어집니다.',
        confirmText: '닫기',
        tone: 'warning',
      })
      if (!ok) return
    }
    setOpen.mutate(!data.open)
  }

  const onStartNow = async () => {
    const ok = await confirmDialog({
      title: '지금 주기 시작',
      message: '첫 주일을 기다리지 않고 지금 참여자들의 짝을 정합니다.\n참여자 모두에게 알림이 갑니다.',
      description: '이번 주기는 다음 달 첫 주일 전날까지 이어집니다.',
      confirmText: '지금 시작',
      tone: 'warning',
    })
    if (ok) startNow.mutate()
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-10 lg:max-w-[760px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        <AdminPageHeader title="누군가의 기도" />

        {isPending && !data ? (
          <StatSpinner label="현황을 모으는 중..." />
        ) : !data ? (
          <p className="px-4 py-16 text-center text-[13px] text-gray-500 dark:text-white/50">
            현황을 불러오지 못했습니다
          </p>
        ) : (
          <>
            <SectionCard title="운영">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-ink-strong">
                    {data.open ? '열려 있어요' : '닫혀 있어요'}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500 dark:text-white/50 break-keep">
                    열면 메뉴·홈 카드가 보이고 신청을 받습니다. 첫 짝 배정은{' '}
                    {formatDay(data.first_cycle_date)} 아침 7시에 자동으로 이뤄집니다.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.open}
                  aria-label="누군가의 기도 운영"
                  disabled={setOpen.isPending}
                  onClick={() => void onToggle()}
                  className={`relative shrink-0 w-[52px] h-[30px] rounded-full transition-all duration-200 disabled:opacity-50 ${
                    data.open ? 'bg-brand shadow-[0_0_16px_var(--brand-glow)]' : 'bg-gray-300 dark:bg-white/[0.12]'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-all duration-200 ${
                      data.open ? 'left-[25px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title={data.cycle ? '이번 주기' : '다음 주기'}
              action={
                data.cycle ? (
                  <span className="text-[11px] text-gray-400 dark:text-white/40">
                    {data.cycle.current_week + 1}/{data.cycle.week_count}주차
                  </span>
                ) : null
              }
            >
              {data.cycle ? (
                <p className="text-[13px] text-ink-strong">
                  {formatDay(data.cycle.start_date)} ~ {formatDay(data.cycle.end_date)} 전날까지
                </p>
              ) : (
                <>
                  <p className="text-[13px] text-ink-strong">
                    {data.next_start_date ? `${formatDay(data.next_start_date)} 아침 7시에 짝이 정해집니다` : '예정 없음'}
                  </p>
                  <button
                    type="button"
                    disabled={!data.open || startNow.isPending}
                    onClick={() => void onStartNow()}
                    className="w-full h-11 rounded-xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold disabled:opacity-50"
                  >
                    지금 바로 시작하기
                  </button>
                  {!data.open ? (
                    <p className="text-[11.5px] text-gray-400 dark:text-white/40">먼저 운영을 열어야 시작할 수 있어요</p>
                  ) : null}
                </>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Stat label="함께하는 성도" value={data.active_participants} accent />
                <Stat label="쉬는 중" value={data.paused_participants} />
                <Stat label="짝이 정해진 성도" value={data.linked_givers} />
                <Stat label="짝을 기다리는 성도" value={data.unlinked_active} />
                <Stat label="이번 주기 기도" value={data.cycle_prayers} accent />
                <Stat label="오늘 기도한 성도" value={data.today_givers} />
                <Stat label="이번 주기 편지" value={data.cycle_letters} />
                <Stat label="신고 대기" value={data.pending_reports} />
              </div>
              <p className="text-[11.5px] leading-relaxed text-gray-400 dark:text-white/40 break-keep">
                누적 기도 {(data.total_prayers ?? 0).toLocaleString()}번 · 누가 누구를 위해 기도하는지는 관리자에게도
                표시하지 않습니다. 짝은 세 분 이상 모여야 정해집니다.
              </p>
            </SectionCard>

            <LetterReports enabled={admin} />
          </>
        )}
      </div>
    </div>
  )
}

export default IntercessionManagement
