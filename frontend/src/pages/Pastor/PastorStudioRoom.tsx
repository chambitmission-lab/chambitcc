// 설교 준비실 — 한 편의 설교를 본문 → 연구 → 뼈대 → 원고 → 점검 → 강단·나눔으로 (담임목사 전용, /pastor/studio/:id)
//   PC: 왼쪽 단계 레일 · 가운데 작업면 · 오른쪽 AI 동역자. 모바일: 위 단계 칩 · 아래 'AI 동역자' 버튼(시트).
//   데이터는 개요(sermon_outlines) 하나 — 개요 보드·원고·강단 보기와 같은 것을 다른 순서로 다룰 뿐이다(저장도 같은 훅).
//   AI 는 재료·질문·점검과 '목사님이 고른 한 칸'의 문단 초안까지. 넣은 초안은 고쳐 쓰기 전까지 표시가 남는다.
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchSermonBrief, type OutlineSection, type SermonBrief, type StudioStep } from '../../api/pastor'
import { pastorKeys } from '../../hooks/queryKeys'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import ManuscriptEditor from './components/ManuscriptEditor'
import OutlineOptionsCard from './components/OutlineOptionsCard'
import SermonBriefCard from './components/SermonBriefCard'
import SermonBridgeCard from './components/SermonBridgeCard'
import StudioCompanion, { type DraftTarget } from './components/studio/StudioCompanion'
import { StepPassage, StepPulpit, StepReview, StepSkeleton } from './components/studio/StudioSteps'
import { STEPS, isStep, manuscriptChars, pendingDraftCount, stepDone, usePassageStudy } from './components/studio/studio'
import StudioLocked from './components/studio/StudioLocked'
import { useStudioAccess } from './components/studio/useStudioAccess'
import { useOutlineDraft } from './components/useOutlineDraft'
import { formatDay, usePastorGate } from './components/pastorUtils'

const MAX_DRAFTS = 12

/** 원고 끝에 문단을 붙인다 — 빈 줄로 띄워 강단 보기에서 한 장씩 넘어가게 */
const appendParagraphs = (manuscript: string, paragraphs: string[]): string => {
  const head = manuscript.replace(/\s+$/, '')
  return `${head ? `${head}\n\n` : ''}${paragraphs.join('\n\n')}\n\n`.slice(0, 20000)
}

const PastorStudioRoom = () => {
  const pastor = usePastorGate()
  const { allowed, checking } = useStudioAccess()
  const id = Number(useParams().id)
  const [params, setParams] = useSearchParams()
  const rawStep = params.get('step')
  const step: StudioStep = isStep(rawStep) ? rawStep : 'passage'

  if (!pastor) return null
  if (checking) {
    return (
      <PastorShell>
        <StatSpinner label="준비실 문을 여는 중..." />
      </PastorShell>
    )
  }
  if (!allowed) return <StudioLocked />
  return <StudioRoom id={id} step={step} onStep={s => setParams(s === 'passage' ? {} : { step: s }, { replace: true })} />
}

/** 준비실 본체 — dev 미리보기(/dev/sermon-desk?v=studio)가 표본 데이터로 그대로 쓴다 */
export const StudioRoom = ({ id, step, onStep }: { id: number; step: StudioStep; onStep: (s: StudioStep) => void }) => {
  const setStep = (s: StudioStep) => {
    onStep(s)
    document.getElementById('studio-top')?.scrollIntoView({ block: 'start' })
  }

  const { data, isPending, draft, dirty, saving, notes, edit, editSections, flush } = useOutlineDraft(id, true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [draftTarget, setDraftTarget] = useState<DraftTarget | null>(null)
  const [companionOpen, setCompanionOpen] = useState(false)

  const study = usePassageStudy(draft?.passage ?? '')
  const label = (study.data?.found ? study.data.label : null) ?? draft?.passage.trim() ?? ''
  // 연구 재료를 받아 두었는지 — 부르지 않고 캐시만 본다(레일 체크 표시용)
  const { data: brief } = useQuery<SermonBrief>({
    queryKey: pastorKeys.sermonBrief(label),
    queryFn: () => fetchSermonBrief(label),
    enabled: false,
  })

  // 고른 칸이 없거나 지워졌으면 첫 칸
  const activeId = draft?.sections.some(s => s.id === activeSection) ? activeSection : (draft?.sections[0]?.id ?? null)

  if (isPending || !draft || !data) {
    return (
      <PastorShell wide>
        {isPending ? <StatSpinner label="설교를 불러오는 중..." /> : <p className="px-4 py-16 text-center text-[13px] text-gray-600">설교를 찾을 수 없습니다</p>}
      </PastorShell>
    )
  }

  const progress = { passage: draft.passage, sections: draft.sections, noteCount: data.note_count, briefed: !!brief, status: data.status }
  const pending = pendingDraftCount(draft.sections)
  const current = STEPS.find(s => s.id === step)!
  const next = STEPS[STEPS.indexOf(current) + 1]
  const active = draft.sections.find(s => s.id === activeId) ?? null

  const applySkeleton = (incoming: OutlineSection[], title: string) => {
    const written = draft.sections.filter(s => s.text.trim() || s.manuscript?.trim() || s.note_ids.length)
    if (written.length && !window.confirm('지금 뼈대를 이 후보로 바꿀까요? 원고나 메모가 있는 칸은 아래에 그대로 남겨 둡니다.')) return
    const kept = written.filter(s => s.manuscript?.trim() || s.note_ids.length)
    const taken = new Set(kept.map(s => s.id))
    editSections(() => [...incoming.map(s => (taken.has(s.id) ? { ...s, id: `${s.id}n` } : s)), ...kept].slice(0, 12))
    if (title && (!draft.title.trim() || draft.title.endsWith(' 설교'))) edit({ title })
  }

  const insertDraft = (sectionId: string, paragraphs: string[]) => {
    editSections(list =>
      list.map(s =>
        s.id === sectionId
          ? {
              ...s,
              manuscript: appendParagraphs(s.manuscript ?? '', paragraphs),
              ai_drafts: [...(s.ai_drafts ?? []), ...paragraphs].slice(-MAX_DRAFTS),
            }
          : s,
      ),
    )
    setActiveSection(sectionId)
    setCompanionOpen(false)
    if (step !== 'manuscript') setStep('manuscript')
    requestAnimationFrame(() => document.getElementById(`ms-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const requestDraft = (sectionId: string) => {
    const s = draft.sections.find(x => x.id === sectionId)
    if (!s) return
    setDraftTarget({ sectionId, label: s.label })
    setCompanionOpen(true)
  }

  return (
    <PastorShell wide>
      <div id="studio-top" className="scroll-mt-4" />
      {/* 머리 */}
      <div className="px-4 pt-3 flex items-center gap-2 text-[12.5px] lg:text-[13.5px]">
        <Link to="/pastor/studio" className="flex items-center gap-0.5 font-semibold text-gray-600 dark:text-white/60 hover:text-brand">
          <span className="material-icons-outlined text-[18px]">chevron_left</span>설교 준비실
        </Link>
        <span className="ml-auto text-gray-500 dark:text-white/50">{saving ? '저장 중...' : dirty ? '입력 중' : '저장됨'}</span>
      </div>
      <div className="px-4 pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h1 className="min-w-0 max-w-full truncate text-[20px] lg:text-[26px] font-bold tracking-[-0.025em] text-ink-strong">
          {draft.title.trim() || '제목 없는 설교'}
        </h1>
        <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] lg:text-[13.5px]">
          {label && <span className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand font-bold">{label}</span>}
          {draft.preach_on && <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/70 font-semibold">{formatDay(draft.preach_on)}</span>}
          {manuscriptChars(draft.sections) > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/70 font-semibold">
              원고 {manuscriptChars(draft.sections).toLocaleString()}자
            </span>
          )}
        </span>
      </div>

      {/* 모바일 단계 칩 */}
      <nav className="lg:hidden px-4 pt-3 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="준비 단계">
        {STEPS.map(s => {
          const on = s.id === step
          const done = stepDone(s.id, progress)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              aria-current={on ? 'step' : undefined}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12.5px] font-bold ${
                on ? 'bg-brand border-brand text-white' : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70'
              }`}
            >
              {done && !on ? <span className="material-icons-outlined text-[15px] text-brand">check</span> : <span className="tabular-nums">{s.no}</span>}
              {s.label}
            </button>
          )
        })}
      </nav>

      <div className="lg:grid lg:grid-cols-[84px_minmax(0,1fr)_360px] xl:grid-cols-[208px_minmax(0,1fr)_400px] lg:items-start">
        {/* 단계 레일 */}
        <aside className="hidden lg:block pl-4 pt-4 lg:sticky lg:top-[72px]">
          <ol className="space-y-1">
            {STEPS.map(s => {
              const on = s.id === step
              const done = stepDone(s.id, progress)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    aria-current={on ? 'step' : undefined}
                    className={`w-full flex flex-col xl:flex-row items-center xl:items-start gap-1 xl:gap-2.5 rounded-2xl px-2 py-2.5 xl:px-3 text-center xl:text-left transition-colors ${
                      on ? 'bg-[var(--brand-soft)] ring-1 ring-brand/40' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${
                        on ? 'bg-brand text-white' : done ? 'bg-[var(--brand-soft)] text-brand' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55'
                      }`}
                    >
                      {done && !on ? <span className="material-icons-outlined text-[17px]">check</span> : s.no}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[12.5px] xl:text-[14.5px] font-bold leading-tight ${on ? 'text-brand' : 'text-ink-strong'}`}>{s.label}</span>
                      <span className="hidden xl:block text-[12px] text-gray-500 dark:text-white/50 leading-snug mt-0.5">{s.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="hidden xl:block mt-4 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] px-3 py-3 space-y-1.5">
            {[
              ['verified_user', '고신 개혁주의 기준'],
              ['block', '이단 표현 자동 차단'],
              ['draw', '공개는 목사님 확인 후'],
            ].map(([icon, text]) => (
              <p key={text} className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 dark:text-white/60">
                <span className="material-icons-outlined text-[15px] text-brand">{icon}</span>
                {text}
              </p>
            ))}
          </div>
        </aside>

        {/* 작업면 */}
        <div className="min-w-0 pb-24 lg:pb-4">
          <div className="px-4 pt-4 flex items-baseline gap-2">
            <h2 className="text-[17px] lg:text-[20px] font-bold tracking-[-0.02em] text-ink-strong">
              <span className="text-brand mr-1.5 tabular-nums">{current.no}</span>
              {current.label}
            </h2>
            <span className="text-[12.5px] lg:text-[13.5px] text-gray-500 dark:text-white/50">{current.hint}</span>
          </div>

          {step === 'passage' && (
            <div className="px-4 pt-3">
              <StepPassage draft={draft} study={study.data} studyPending={study.isFetching} onEdit={edit} />
            </div>
          )}

          {step === 'study' &&
            (label ? (
              <>
                <SermonBriefCard label={label} />
                <SermonBridgeCard label={label} />
              </>
            ) : (
              <NeedPassage onGo={() => setStep('passage')} />
            ))}

          {step === 'outline' &&
            (label ? (
              <>
                <OutlineOptionsCard label={label} onApply={applySkeleton} />
                <div className="px-4 pt-4">
                  <StepSkeleton sections={draft.sections} onChange={editSections} outlineId={id} />
                </div>
              </>
            ) : (
              <NeedPassage onGo={() => setStep('passage')} />
            ))}

          {step === 'manuscript' && (
            <ManuscriptEditor
              outlineId={id}
              draft={draft}
              status={data.status}
              notes={notes}
              onChange={(sid, manuscript) => editSections(list => list.map(x => (x.id === sid ? { ...x, manuscript } : x)))}
              flush={flush}
              aside={false}
              onRequestDraft={requestDraft}
              onDraftsChange={(sid, drafts) => editSections(list => list.map(x => (x.id === sid ? { ...x, ai_drafts: drafts } : x)))}
              activeSection={activeId ?? undefined}
              onActiveChange={setActiveSection}
            />
          )}

          {step === 'review' && (
            <div className="px-4 pt-3">
              <StepReview
                outlineId={id}
                sections={draft.sections}
                flush={flush}
                onJump={sid => {
                  setActiveSection(sid)
                  setStep('manuscript')
                  requestAnimationFrame(() => document.getElementById(`ms-${sid}`)?.scrollIntoView({ block: 'start' }))
                }}
              />
            </div>
          )}

          {step === 'pulpit' && <StepPulpit outlineId={id} sections={draft.sections} status={data.status} flush={flush} />}

          {next && (
            <div className="px-4 pt-5">
              <button
                type="button"
                onClick={() => setStep(next.id)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/[0.1] px-4 py-3.5 hover:border-brand group"
              >
                <span className="text-left">
                  <span className="block text-[12px] text-gray-500 dark:text-white/50">다음 단계</span>
                  <span className="block text-[15px] lg:text-[16px] font-bold text-ink-strong group-hover:text-brand">
                    {next.no}. {next.label} — {next.hint}
                  </span>
                </span>
                <span className="material-icons-outlined text-[22px] text-brand">arrow_forward</span>
              </button>
              {step === 'manuscript' && pending > 0 && (
                <p className="mt-2 text-[12.5px] text-gray-600 dark:text-white/60">고치지 않은 AI 초안 {pending}문단은 점검 단계에서 한 번 더 모아 보여 드립니다.</p>
              )}
            </div>
          )}
        </div>

        {/* AI 동역자 — PC 는 오른쪽 단에 붙어 있고, 모바일은 버튼으로 여는 시트 */}
        <div
          className={
            companionOpen
              ? 'fixed inset-x-0 bottom-0 top-0 pt-[6vh] z-[105] px-2 bg-black/40 lg:bg-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:inset-auto lg:z-auto lg:p-0 lg:pr-4 lg:pt-4 lg:sticky lg:top-[72px] lg:h-[calc((100vh-88px)/var(--pz,1))]'
              : 'hidden lg:block pr-4 pt-4 lg:sticky lg:top-[72px] lg:h-[calc((100vh-88px)/var(--pz,1))]'
          }
        >
          {companionOpen && <CloseOnBack onClose={() => setCompanionOpen(false)} />}
          <StudioCompanion
            outlineId={id}
            step={step}
            passageLabel={label}
            activeSection={active ? { id: active.id, label: active.label } : null}
            draftTarget={draftTarget}
            onCloseDraft={() => setDraftTarget(null)}
            onInsertDraft={insertDraft}
            onClose={companionOpen ? () => setCompanionOpen(false) : undefined}
          />
        </div>
      </div>

      {!companionOpen && (
        <button
          type="button"
          onClick={() => setCompanionOpen(true)}
          className="lg:hidden fixed left-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] inline-flex items-center gap-1.5 pl-3.5 pr-4 py-3 rounded-full bg-brand text-white text-[14px] font-bold shadow-[0_8px_24px_var(--brand-glow)]"
        >
          <span className="material-icons-outlined text-[19px]">auto_awesome</span>AI 동역자
        </button>
      )}
    </PastorShell>
  )
}

/** 모바일 시트를 뒤로가기로 닫는다 — 열려 있을 때만 붙는다 */
const CloseOnBack = ({ onClose }: { onClose: () => void }) => {
  useModalBackButton(onClose)
  return null
}

const NeedPassage = ({ onGo }: { onGo: () => void }) => (
  <div className="px-4 pt-6 text-center space-y-3">
    <p className="text-[14px] text-gray-600 dark:text-white/60">먼저 본문을 정해 주세요. 본문이 있어야 연구와 뼈대를 함께 살필 수 있습니다.</p>
    <button type="button" onClick={onGo} className="px-4 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold">
      1. 본문 정하러 가기
    </button>
  </div>
)

export default PastorStudioRoom
