// 한 주 묶음 — 설교 개요의 세 번째 탭(?mode=week). 원고에서 AI 초안을 받아 목사님이 고치고, 확인한 뒤 공개한다.
//   주보 요약 3줄 · 구역·소그룹 나눔 질문 · 다음세대 설명 · 가정예배 6일(월~토)
//   공개하면 이어 둔 설교의 /sermon 화면에 '이번 주 말씀 따라 살기'가, 나눔 질문은 기존 '함께 나눌 질문' 자리에 보인다.
//   저장은 버튼으로만(초안이 길어 실수로 덮이지 않게). 공개는 '모두 읽고 확인' 표시가 있어야 한다(서버도 확인).
import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  draftWeekPack,
  fetchWeekPack,
  saveWeekPack,
  type WeekDevotion,
  type WeekPackContent,
  type WeekPackData,
} from '../../../api/pastor'
import { pastorKeys, sermonKeys } from '../../../hooks/queryKeys'
import { showToast } from '../../../utils/toast'
import { StatSpinner } from '../../Admin/components/StatCards'
import { formatDay, inputCls } from './pastorUtils'
import { SermonPicker } from './sermonNotes'
import { GhostButton, PastorModal } from './ui'

const DAYS = ['월', '화', '수', '목', '금', '토']
const MAX_QUESTIONS = 5

const emptyDevotion = (day: string): WeekDevotion => ({ day, passage: null, title: '', body: '', prayer: '' })

const toContent = (p: WeekPackContent | null | undefined): WeekPackContent | null =>
  p
    ? {
        summary: [...p.summary, '', '', ''].slice(0, 3),
        kids: p.kids ?? '',
        questions: p.questions.length ? [...p.questions] : [''],
        devotions: DAYS.map(d => p.devotions.find(x => x.day === d) ?? emptyDevotion(d)),
      }
    : null

const hasText = (c: WeekPackContent) =>
  c.summary.some(t => t.trim()) || !!c.kids.trim() || c.questions.some(t => t.trim()) || c.devotions.some(d => d.title.trim() || d.body.trim())

const WeekPackEditor = ({ outlineId, flush }: { outlineId: number; flush?: () => Promise<unknown> }) => {
  const qc = useQueryClient()
  const { data, isPending } = useQuery<WeekPackData>({
    queryKey: pastorKeys.weekPack(outlineId),
    queryFn: () => fetchWeekPack(outlineId),
    refetchOnMount: 'always',
  })
  const [content, setContent] = useState<WeekPackContent | null>(null)
  const [dirty, setDirty] = useState(false)
  const [sermon, setSermon] = useState<WeekPackData['sermon']>(null)
  const [reviewed, setReviewed] = useState(false)
  const [picking, setPicking] = useState(false)
  const [confirmRedo, setConfirmRedo] = useState(false)
  const [filtered, setFiltered] = useState(0)
  const [truncated, setTruncated] = useState<number | null>(null)
  const [loadedFor, setLoadedFor] = useState<number | null>(null)

  // 서버 값은 처음 한 번만 옮긴다 — 저장 응답이 고치는 중인 글을 덮지 않게
  if (data && loadedFor !== outlineId) {
    setLoadedFor(outlineId)
    setContent(toContent(data.pack))
    setSermon(data.sermon)
  }

  const draft = useMutation({
    mutationFn: async () => {
      await flush?.()
      return draftWeekPack(outlineId)
    },
    onSuccess: d => {
      setContent(toContent(d))
      setFiltered(d.filtered)
      setTruncated(d.truncated ? (d.read_chars ?? 0) : null)
      setDirty(true)
      setReviewed(false)
      setConfirmRedo(false)
      showToast('초안을 만들었어요 · 읽고 고친 뒤 저장해 주세요', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const save = useMutation({
    mutationFn: (publish: boolean) => {
      const c = content!
      return saveWeekPack(outlineId, {
        summary: c.summary.map(t => t.trim()).filter(Boolean),
        kids: c.kids.trim(),
        questions: c.questions.map(t => t.trim()).filter(Boolean),
        devotions: c.devotions.filter(d => d.title.trim() || d.body.trim()),
        sermon_id: sermon?.id ?? null,
        publish,
        reviewed,
      })
    },
    onSuccess: (saved, publish) => {
      qc.setQueryData(pastorKeys.weekPack(outlineId), saved)
      setContent(toContent(saved.pack))
      setSermon(saved.sermon)
      setDirty(false)
      if (saved.sermon) void qc.invalidateQueries({ queryKey: sermonKeys.extras(saved.sermon.id) })
      showToast(publish ? '성도들에게 공개했어요' : data?.pack?.is_published ? '공개를 내리고 저장했어요' : '저장했어요', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  if (isPending && !data) return <StatSpinner label="한 주 묶음을 불러오는 중..." />

  const published = !!data?.pack?.is_published
  const edit = (fn: (c: WeekPackContent) => WeekPackContent) => {
    setContent(c => (c ? fn(c) : c))
    setDirty(true)
    setReviewed(false)
  }

  return (
    <div className="px-4 pt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="min-w-0 space-y-4">
        {!content ? (
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5 lg:p-6 space-y-3">
            <h2 className="text-[17px] lg:text-[20px] font-bold text-ink-strong tracking-[-0.02em]">설교가 한 주 내내 이어지도록</h2>
            <p className="text-[13.5px] lg:text-[15px] leading-relaxed text-gray-600 dark:text-white/65">
              원고를 바탕으로 주보 요약 3줄, 구역·소그룹 나눔 질문, 다음세대를 위한 쉬운 설명, 월~토 가정예배 묵상 초안을 만들어 드립니다.
              목사님이 읽고 고친 뒤에만 성도에게 공개됩니다.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 text-[13px] lg:text-[14px] text-gray-700 dark:text-white/75">
              {[
                ['article', '주보 요약 3줄'],
                ['forum', '나눔 질문 5개'],
                ['child_care', '다음세대 설명'],
                ['home', '가정예배 6일'],
              ].map(([icon, label]) => (
                <li key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
                  <span className="material-icons-outlined text-[18px] text-brand">{icon}</span>
                  {label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={draft.isPending}
              onClick={() => draft.mutate()}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-brand text-white text-[14px] lg:text-[16px] font-bold disabled:opacity-60"
            >
              <span className={`material-icons-outlined text-[19px] ${draft.isPending ? 'animate-spin' : ''}`}>
                {draft.isPending ? 'autorenew' : 'auto_awesome'}
              </span>
              {draft.isPending ? '원고를 읽고 만드는 중… (40초쯤)' : '원고로 초안 만들기'}
            </button>
          </div>
        ) : (
          <>
            {filtered > 0 && (
              <p className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 text-[12.5px] lg:text-[13.5px] text-amber-900 dark:text-amber-200">
                <span className="material-icons-outlined text-[16px]">shield</span>
                이단 표현이 섞인 항목 {filtered}개는 초안에서 자동으로 뺐습니다.
              </p>
            )}
            {truncated !== null && (
              <p className="flex items-center gap-1.5 rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 dark:bg-amber-400/10 dark:border-amber-400/25 text-[12.5px] lg:text-[13.5px] text-amber-900 dark:text-amber-200">
                <span className="material-icons-outlined text-[16px]">content_cut</span>
                원고가 길어 앞 {truncated.toLocaleString()}자까지만 읽고 만든 초안입니다. 뒷부분(결론)이 빠졌는지 살펴 주세요.
              </p>
            )}
            <Block icon="article" title="주보 요약" hint="한 줄씩 3줄">
              {content.summary.map((t, i) => (
                <input
                  key={i}
                  className={`${inputCls} lg:text-[15px]`}
                  value={t}
                  maxLength={100}
                  placeholder={`${i + 1}째 줄`}
                  onChange={e => edit(c => ({ ...c, summary: c.summary.map((x, j) => (j === i ? e.target.value : x)) }))}
                />
              ))}
            </Block>

            <Block icon="forum" title="구역·소그룹 나눔 질문" hint="공개하면 '함께 나눌 질문'에 보입니다">
              {content.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2.5 w-5 shrink-0 text-center text-[13px] font-bold text-brand">{i + 1}</span>
                  <textarea
                    className={`${inputCls} lg:text-[15px] resize-none`}
                    rows={2}
                    value={q}
                    maxLength={200}
                    onChange={e => edit(c => ({ ...c, questions: c.questions.map((x, j) => (j === i ? e.target.value : x)) }))}
                  />
                  <button
                    type="button"
                    aria-label="질문 빼기"
                    onClick={() => edit(c => ({ ...c, questions: c.questions.filter((_, j) => j !== i) }))}
                    className="mt-2 w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500"
                  >
                    <span className="material-icons-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
              {content.questions.length < MAX_QUESTIONS && (
                <button
                  type="button"
                  onClick={() => edit(c => ({ ...c, questions: [...c.questions, ''] }))}
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:underline"
                >
                  <span className="material-icons-outlined text-[17px]">add</span>질문 더하기
                </button>
              )}
            </Block>

            <Block icon="child_care" title="다음세대 설명" hint="어린이·청소년이 알아듣는 말로">
              <textarea
                className={`${inputCls} lg:text-[15px] leading-relaxed`}
                rows={5}
                value={content.kids}
                maxLength={700}
                onChange={e => edit(c => ({ ...c, kids: e.target.value }))}
              />
            </Block>

            <Block icon="home" title="가정예배 6일" hint="본문 표기를 성경에서 찾지 못하면 저장 때 비워집니다">
              <div className="grid gap-3 xl:grid-cols-2">
                {content.devotions.map((d, i) => {
                  const set = (patch: Partial<WeekDevotion>) =>
                    edit(c => ({ ...c, devotions: c.devotions.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
                  return (
                    <div key={d.day} className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 shrink-0 rounded-full bg-brand text-white flex items-center justify-center text-[13px] font-bold">{d.day}</span>
                        <input
                          className={`${inputCls} !py-2`}
                          value={d.passage ?? ''}
                          maxLength={60}
                          placeholder="본문 — 예: 요 15:1-4"
                          onChange={e => set({ passage: e.target.value || null })}
                        />
                      </div>
                      <input className={`${inputCls} !py-2 font-semibold`} value={d.title} maxLength={40} placeholder="제목" onChange={e => set({ title: e.target.value })} />
                      <textarea className={`${inputCls} leading-relaxed`} rows={4} value={d.body} maxLength={600} placeholder="묵상" onChange={e => set({ body: e.target.value })} />
                      <textarea className={`${inputCls} leading-relaxed`} rows={2} value={d.prayer} maxLength={240} placeholder="함께 드릴 기도" onChange={e => set({ prayer: e.target.value })} />
                    </div>
                  )
                })}
              </div>
            </Block>
          </>
        )}
      </div>

      {/* 오른쪽 — 이어 둔 설교 · 확인 · 저장/공개 */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12.5px] font-bold ${
                published ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65'
              }`}
            >
              <span className="material-icons-outlined text-[15px]">{published ? 'public' : 'lock'}</span>
              {published ? '성도에게 공개 중' : data?.pack ? '저장됨 · 비공개' : '아직 저장 전'}
            </span>
            {dirty && <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-300">고친 내용 저장 전</span>}
          </div>

          <div>
            <p className="text-[12px] lg:text-[13px] font-bold text-gray-600 dark:text-white/60 mb-1">공개할 설교</p>
            {sermon ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] lg:text-[14.5px] font-semibold text-ink-strong truncate">{sermon.title}</span>
                  <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
                    {[sermon.bible_verse, sermon.date && formatDay(sermon.date, false)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <button type="button" onClick={() => setPicking(true)} className="shrink-0 text-[12.5px] font-bold text-brand hover:underline">
                  바꾸기
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-[13px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand"
              >
                설교 고르기 — 등록된 설교에만 공개할 수 있어요
              </button>
            )}
          </div>

          {content && (
            <>
              <label className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-[var(--brand-soft)] cursor-pointer">
                <input type="checkbox" className="mt-1 accent-[var(--brand)]" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />
                <span className="text-[13px] lg:text-[14px] leading-relaxed text-ink-strong">
                  모든 내용을 읽고 신학적으로 확인했습니다
                  <span className="block text-[12px] text-gray-600 dark:text-white/60">AI 초안은 목사님 확인 뒤에만 공개됩니다</span>
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={save.isPending || (!dirty && !!data?.pack && !published)}
                  onClick={() => save.mutate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-[13.5px] lg:text-[14.5px] font-bold text-gray-700 dark:text-white/75 hover:border-brand hover:text-brand disabled:opacity-40"
                >
                  {published ? '공개 내리고 저장' : '저장'}
                </button>
                <button
                  type="button"
                  disabled={save.isPending || !reviewed || !sermon || !hasText(content)}
                  onClick={() => save.mutate(true)}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-white text-[13.5px] lg:text-[14.5px] font-bold disabled:opacity-40"
                >
                  {save.isPending ? '저장 중…' : published ? '고친 내용 공개' : '성도에게 공개'}
                </button>
              </div>
              <p className="text-[12px] leading-relaxed text-gray-500 dark:text-white/50">
                공개하면 그 설교의 /sermon 화면에 '이번 주 말씀 따라 살기'가 보이고, 나눔 질문은 '함께 나눌 질문'(설교의 메아리와 같은 자리)에 올라갑니다.
              </p>
              <button
                type="button"
                disabled={draft.isPending}
                onClick={() => (hasText(content) ? setConfirmRedo(true) : draft.mutate())}
                className="w-full inline-flex items-center justify-center gap-1 py-2 rounded-xl text-[12.5px] lg:text-[13.5px] font-bold text-gray-500 dark:text-white/55 hover:text-brand disabled:opacity-40"
              >
                <span className={`material-icons-outlined text-[16px] ${draft.isPending ? 'animate-spin' : ''}`}>refresh</span>
                {draft.isPending ? '초안 만드는 중…' : '원고로 초안 다시 만들기'}
              </button>
            </>
          )}
        </div>
      </div>

      {picking && (
        <PastorModal title="어느 설교에 공개할까요?" onClose={() => setPicking(false)} footer={<GhostButton onClick={() => setPicking(false)}>닫기</GhostButton>}>
          <SermonPicker
            onPick={({ sermon: s }) => {
              if (!s) return
              setSermon({ id: s.id, title: s.title, bible_verse: s.bible_verse, date: s.date })
              setDirty(true)
              setPicking(false)
            }}
          />
        </PastorModal>
      )}
      {confirmRedo && (
        <PastorModal
          title="초안을 다시 만들까요?"
          onClose={() => setConfirmRedo(false)}
          footer={
            <>
              <GhostButton onClick={() => setConfirmRedo(false)}>그대로 두기</GhostButton>
              <button
                type="button"
                disabled={draft.isPending}
                onClick={() => draft.mutate()}
                className="flex-1 py-3 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-40"
              >
                {draft.isPending ? '만드는 중…' : '다시 만들기'}
              </button>
            </>
          }
        >
          <p className="text-[13.5px] leading-relaxed text-gray-600 dark:text-white/65">
            지금 화면의 글이 새 초안으로 바뀝니다. 저장 전까지는 성도 화면에 영향이 없습니다.
          </p>
        </PastorModal>
      )}
    </div>
  )
}

const Block = ({ icon, title, hint, children }: { icon: string; title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4 lg:p-5 space-y-2.5">
    <div className="flex flex-wrap items-baseline gap-x-2">
      <h3 className="flex items-center gap-1.5 text-[15px] lg:text-[17px] font-bold text-ink-strong">
        <span className="material-icons-outlined text-[19px] text-brand">{icon}</span>
        {title}
      </h3>
      {hint && <span className="text-[12px] lg:text-[13px] text-gray-500 dark:text-white/50">{hint}</span>}
    </div>
    {children}
  </section>
)

export default WeekPackEditor
