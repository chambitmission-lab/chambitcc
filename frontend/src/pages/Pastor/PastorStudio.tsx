// 설교 준비실 첫 화면 — 담임목사 전용 (/pastor/studio)
//   이번 주일 설교를 이어서 준비하거나, 본문 하나로 새 설교를 시작한다. 준비 중인 설교는 준비실 방(/pastor/studio/:id)으로.
//   데이터는 개요 보드와 같은 sermon_outlines — 준비실에서 시작한 설교도 개요 보드에 그대로 보인다.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOutline, deleteOutline, fetchOutlines, type OutlineSummary } from '../../api/pastor'
import { pastorKeys } from '../../hooks/queryKeys'
import { showToast } from '../../utils/toast'
import DatePicker from '../../components/common/DatePicker'
import { StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import StudioLocked from './components/studio/StudioLocked'
import { STEPS, nextSunday } from './components/studio/studio'
import { useStudioAccess } from './components/studio/useStudioAccess'
import { formatDay, inputCls, pickerCls, usePastorGate } from './components/pastorUtils'

const PastorStudio = () => {
  const pastor = usePastorGate()
  const { allowed, checking } = useStudioAccess()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const sunday = nextSunday()

  const { data: outlines, isPending } = useQuery({
    queryKey: pastorKeys.outlines(),
    queryFn: fetchOutlines,
    enabled: pastor && allowed,
  })

  const [passage, setPassage] = useState('')
  const [title, setTitle] = useState('')
  const [preachOn, setPreachOn] = useState(sunday)

  const start = useMutation({
    mutationFn: () =>
      createOutline({ title: title.trim() || `${passage.trim()} 설교`, passage: passage.trim(), preach_on: preachOn || null }),
    onSuccess: saved => {
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      navigate(`/pastor/studio/${saved.id}`)
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  if (!pastor) return null
  if (checking) {
    return (
      <PastorShell>
        <StatSpinner label="준비실 문을 여는 중..." />
      </PastorShell>
    )
  }
  if (!allowed) return <StudioLocked />

  const drafts = (outlines ?? []).filter(o => o.status === 'draft')
  const done = (outlines ?? []).filter(o => o.status === 'done').slice(0, 5)
  // 이번 주일로 잡힌 설교가 먼저, 없으면 가장 최근에 손댄 설교
  const thisWeek = drafts.find(o => o.preach_on === sunday) ?? null
  const others = drafts.filter(o => o.id !== thisWeek?.id)

  return (
    <PastorShell>
      {/* 히어로 */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-ink-strong dark:bg-[#18202c] text-white px-5 py-6 lg:px-8 lg:py-8">
          <div aria-hidden className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-brand/45 blur-3xl" />
          <div aria-hidden className="absolute right-24 bottom-[-6rem] w-56 h-56 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[12px] font-bold">
              <span className="material-icons-outlined text-[15px]">auto_awesome</span>담임목사님 전용
            </p>
            <h1 className="mt-3 text-[26px] lg:text-[34px] font-bold tracking-[-0.03em] leading-[1.2]">설교 준비실</h1>
            <p className="mt-2 max-w-[560px] text-[14px] lg:text-[16px] leading-relaxed text-white/75">
              말씀 앞에서 목사님이 준비하시고, AI 동역자는 곁에서 재료를 찾고 묻고 점검합니다.
              무엇을 쓰고 무엇을 버릴지는 언제나 목사님이 정하십니다.
            </p>
            <ol className="mt-5 flex flex-wrap gap-1.5">
              {STEPS.map(s => (
                <li key={s.id} className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-white/[0.08] text-[12.5px] lg:text-[13.5px] font-semibold text-white/85">
                  <span className="w-5 h-5 rounded-full bg-white/15 text-[11.5px] font-bold flex items-center justify-center">{s.no}</span>
                  {s.label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="space-y-4 min-w-0">
          {/* 이번 주일 */}
          {isPending ? (
            <StatSpinner label="준비 중인 설교를 불러오는 중..." />
          ) : thisWeek ? (
            <ContinueCard outline={thisWeek} highlight />
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/[0.15] px-5 py-6">
              <p className="text-[12.5px] font-bold text-brand">{formatDay(sunday)}</p>
              <p className="mt-1 text-[16px] lg:text-[18px] font-bold text-ink-strong">이번 주일 설교가 아직 없습니다</p>
              <p className="mt-1 text-[13.5px] text-gray-600 dark:text-white/60">오른쪽에서 본문을 정해 준비를 시작해 보세요.</p>
            </div>
          )}

          {others.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-[14.5px] lg:text-[16px] font-bold text-ink-strong">준비 중인 설교</h2>
              <ul className="space-y-2">
                {others.slice(0, 8).map(o => (
                  <li key={o.id}>
                    <ContinueCard outline={o} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {done.length > 0 && (
            <section className="space-y-2">
              <h2 className="px-1 text-[14.5px] lg:text-[16px] font-bold text-ink-strong">최근에 마친 설교</h2>
              <ul className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
                {done.map(o => (
                  <li key={o.id}>
                    <Link to={`/pastor/studio/${o.id}?step=pulpit`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <span className="material-icons-outlined text-[19px] text-brand">task_alt</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] lg:text-[15px] font-semibold text-ink-strong">{o.title}</span>
                        <span className="block text-[12px] text-gray-500 dark:text-white/50">{[o.passage, o.preach_on && formatDay(o.preach_on, false)].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* 새 설교 */}
        <div className="space-y-4">
          <section className="rounded-3xl bg-white dark:bg-card-dark border border-brand/25 shadow-[0_8px_28px_var(--brand-glow)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-[20px] text-brand">add_circle</span>
              <h2 className="text-[16px] lg:text-[18px] font-bold text-ink-strong">새 설교 준비 시작</h2>
            </div>
            <input
              className={`${inputCls} lg:text-[16px]`}
              value={passage}
              maxLength={100}
              placeholder="본문 — 예: 요 15:1-8"
              onChange={e => setPassage(e.target.value)}
            />
            <input
              className={`${inputCls} lg:text-[16px]`}
              value={title}
              maxLength={200}
              placeholder="제목 (나중에 정해도 됩니다)"
              onChange={e => setTitle(e.target.value)}
            />
            <DatePicker value={preachOn} onChange={setPreachOn} placeholder="설교할 날" className={pickerCls} />
            <button
              type="button"
              disabled={!passage.trim() || start.isPending}
              onClick={() => start.mutate()}
              className="w-full py-3 rounded-xl bg-brand text-white text-[15px] lg:text-[16px] font-bold disabled:opacity-40"
            >
              {start.isPending ? '준비실을 여는 중…' : '이 본문으로 준비하기'}
            </button>
          </section>

          <section className="rounded-3xl border border-gray-200/70 dark:border-white/[0.08] p-5 space-y-3">
            <h2 className="text-[14.5px] lg:text-[16px] font-bold text-ink-strong">준비실의 약속</h2>
            {[
              ['verified_user', '고신 개혁주의 기준', '성경 무오와 웨스트민스터 신앙고백 노선 위에서, 문법적·역사적 해석과 구속사적 읽기로 돕습니다.'],
              ['block', '이단 표현은 자동으로 막습니다', '이단 단체·교리 표현이 섞인 답과 초안은 통째로 버리고 그렇게 했다고 알려 드립니다.'],
              ['menu_book', '말씀은 개역개정 원문으로', 'AI가 말한 구절은 성경 본문을 직접 찾아 붙이고, 인용 글자가 다르면 표시합니다.'],
              ['draw', '설교는 목사님의 것', 'AI는 고르신 칸의 문단 초안까지만 씁니다. 넣은 초안은 고쳐 쓰시기 전까지 표시가 남습니다.'],
            ].map(([icon, head, body]) => (
              <div key={head} className="flex gap-2.5">
                <span className="material-icons-outlined text-[19px] text-brand mt-0.5">{icon}</span>
                <span>
                  <span className="block text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong">{head}</span>
                  <span className="block text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-600 dark:text-white/60">{body}</span>
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PastorShell>
  )
}

const ContinueCard = ({ outline, highlight = false }: { outline: OutlineSummary; highlight?: boolean }) => {
  const qc = useQueryClient()
  // 두 번 눌러야 지운다(개요 보드와 같은 방식). 3초 안에 다시 누르지 않으면 되돌아간다
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const remove = useMutation({
    mutationFn: () => deleteOutline(outline.id),
    onSuccess: () => {
      try {
        sessionStorage.removeItem(`pastor-studio-chat-${outline.id}`)
      } catch {
        // 대화 기록 정리는 못 해도 괜찮다(탭을 닫으면 사라진다)
      }
      qc.setQueryData<OutlineSummary[]>(pastorKeys.outlines(), list => list?.filter(o => o.id !== outline.id))
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      showToast(`「${outline.title}」을 지웠습니다 · 설교 메모는 메모장에 그대로 있어요`, 'success')
    },
    onError: (e: Error) => {
      setArmed(false)
      showToast(e.message, 'error')
    },
  })

  return (
    <div
      className={`group flex items-center gap-2 rounded-3xl border pr-2 transition-colors ${
        highlight
          ? 'bg-[var(--brand-soft)] border-brand/40 hover:border-brand'
          : 'bg-white dark:bg-card-dark border-gray-200/70 dark:border-white/[0.08] hover:border-brand'
      }`}
    >
      <InnerLink outline={outline} highlight={highlight} />
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => (armed ? remove.mutate() : setArmed(true))}
        aria-label={armed ? '한 번 더 누르면 지웁니다' : '이 설교 지우기'}
        title={armed ? '한 번 더 누르면 지웁니다' : '이 설교 지우기'}
        className={`shrink-0 inline-flex items-center gap-1 rounded-full transition-colors disabled:opacity-50 ${
          armed
            ? 'px-3 py-2 bg-red-500 text-white text-[12.5px] lg:text-[13px] font-bold'
            : 'w-9 h-9 justify-center text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
        }`}
      >
        <span className="material-icons-outlined text-[19px]">delete_outline</span>
        {armed && (remove.isPending ? '지우는 중…' : '한 번 더 누르면 삭제')}
      </button>
    </div>
  )
}

const InnerLink = ({ outline, highlight }: { outline: OutlineSummary; highlight: boolean }) => (
  <Link
    to={`/pastor/studio/${outline.id}${outline.passage ? '?step=study' : ''}`}
    className="min-w-0 flex-1 flex items-center gap-4 pl-5 py-4"
  >
    <span className="min-w-0 flex-1">
      {highlight && <span className="block text-[12.5px] font-bold text-brand">이번 주일 · {formatDay(outline.preach_on!)}</span>}
      <span className={`block truncate font-bold text-ink-strong ${highlight ? 'text-[19px] lg:text-[22px] mt-0.5' : 'text-[15px] lg:text-[16px]'}`}>
        {outline.title}
      </span>
      <span className="block text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/60 mt-0.5">
        {[outline.passage, !highlight && outline.preach_on ? formatDay(outline.preach_on, false) : null, outline.note_count ? `메모 ${outline.note_count}개` : null]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </span>
    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full font-bold ${highlight ? 'px-4 py-2 bg-brand text-white text-[14px]' : 'text-brand text-[13px]'}`}>
      이어서 준비<span className="material-icons-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
    </span>
  </Link>
)

export default PastorStudio
