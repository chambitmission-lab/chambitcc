// 설교 준비실 오른쪽 단 — AI 동역자
//   묻기: 본문·개요·지금 칸을 맥락으로 질문에 답한다. 구절은 서버가 개역개정 본문을 붙이고, 인용이 다르면 표시한다.
//         답은 '메모로 담기'로 설교 메모(AI초안 태그)에 옮겨 두고 개요 칸에 붙여 쓸 수 있다.
//   한 칸 초안: 원고 단계에서 목사님이 고른 칸 하나의 문단 초안. 고른 문단만 원고 끝에 넣고, 넣은 글은 'AI 초안' 표시가 붙는다
//         (목사님이 고치면 표시가 사라진다 — 서버 sections[].ai_drafts).
//   대화는 이 탭(sessionStorage)에만 남는다 — 목양 정보는 localStorage 에 두지 않는 목회자 영역 규칙.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  askStudio,
  createNote,
  draftStudio,
  type ReviewFinding,
  type StudioAnswer,
  type StudioDraft,
  type StudioStep,
  type StudioVerse,
} from '../../../../api/pastor'
import { showToast } from '../../../../utils/toast'
import { invalidateNoteQueries } from '../sermonNoteUtils'

const STUDIO_NOTE_SOURCE = 'AI 동역자 · 목사님 검토'

const STEP_LABEL: Record<StudioStep, string> = {
  passage: '본문 정하기',
  study: '본문 연구',
  outline: '뼈대 세우기',
  manuscript: '원고 쓰기',
  review: '원고 점검',
  pulpit: '강단과 나눔',
}

// 단계마다 먼저 꺼내 볼 만한 질문 — 누르면 바로 묻는다
const SUGGESTIONS: Record<StudioStep, string[]> = {
  passage: ['이 본문의 앞뒤 문맥을 짚어 주세요', '이 본문을 설교할 때 흔히 빠지는 함정은 무엇인가요?', '이 본문과 함께 읽으면 좋은 구절을 알려 주세요'],
  study: ['원어에서 눈여겨볼 낱말이 있을까요?', '구속사의 흐름에서 이 본문은 어디에 서 있나요?', '웨스트민스터 신앙고백과 닿는 교리를 짚어 주세요'],
  outline: ['지금 뼈대가 본문의 흐름과 맞는지 봐 주세요', '중심 명제를 한 문장으로 더 선명하게 다듬을 방향은?', '각 대지에서 그리스도가 어떻게 드러나면 좋을까요?'],
  manuscript: ['이 칸을 여는 첫 문장의 방향을 몇 가지 주세요', '이 칸에 어울리는 예화 방향 3가지 (지어낸 실화 말고)', '이 칸에서 성도에게 던질 질문은 무엇이 좋을까요?'],
  review: ['복음이 분명하게 드러나는지 봐 주세요', '성도가 알아듣기 어려운 말을 찾아 주세요', '적용이 율법주의로 흐르지 않았는지 짚어 주세요'],
  pulpit: ['주보에 실을 한 줄 요약 후보를 주세요', '설교 후 소그룹 나눔 질문 방향을 주세요', '다음세대에게 이 말씀을 어떻게 풀어 줄까요?'],
}

interface Message {
  id: string
  role: 'me' | 'ai'
  text: string
  verses?: StudioVerse[]
  follow_ups?: string[]
  scripture?: ReviewFinding[]
  filtered?: boolean
  saved?: boolean
}

const storageKey = (outlineId: number) => `pastor-studio-chat-${outlineId}`

const loadThread = (outlineId: number): Message[] => {
  try {
    const raw = sessionStorage.getItem(storageKey(outlineId))
    const list = raw ? (JSON.parse(raw) as Message[]) : []
    return Array.isArray(list) ? list.slice(-40) : []
  } catch {
    return []
  }
}

const saveThread = (outlineId: number, list: Message[]) => {
  try {
    sessionStorage.setItem(storageKey(outlineId), JSON.stringify(list.slice(-40)))
  } catch {
    // 저장 공간이 막혀도 대화는 화면에 그대로 둔다
  }
}

let seq = 0
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`

export interface DraftTarget {
  sectionId: string
  label: string
}

const StudioCompanion = ({
  outlineId,
  step,
  passageLabel,
  activeSection,
  draftTarget,
  onCloseDraft,
  onInsertDraft,
  onClose,
}: {
  outlineId: number
  step: StudioStep
  passageLabel: string
  /** 지금 보고 있는 칸 — 원고 단계에서 맥락으로 함께 보낸다 */
  activeSection: { id: string; label: string } | null
  draftTarget: DraftTarget | null
  onCloseDraft: () => void
  /** 고른 문단을 그 칸 원고 끝에 넣는다(부모가 원고·ai_drafts 를 함께 고친다) */
  onInsertDraft: (sectionId: string, paragraphs: string[]) => void
  /** 모바일 시트 닫기 — PC 에선 없음 */
  onClose?: () => void
}) => {
  const qc = useQueryClient()
  const [thread, setThread] = useState<Message[]>(() => loadThread(outlineId))
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => saveThread(outlineId, thread), [outlineId, thread])

  // 새 말이 붙으면 맨 아래로 — 대화 상자 안에서만 움직인다(페이지 스크롤은 그대로)
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.length, draftTarget])

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const context = step === 'manuscript' || step === 'outline' ? activeSection : null

  const ask = useMutation({
    mutationFn: (question: string) =>
      askStudio(outlineId, {
        question,
        step,
        section_id: context?.id ?? null,
        // 버린 답·빈 답은 맥락에서 뺀다
        history: thread.filter(m => m.text && !m.filtered).slice(-6).map(m => ({ role: m.role, text: m.text.slice(0, 1200) })),
      }),
    onMutate: question => {
      setThread(t => [...t, { id: newId(), role: 'me', text: question }])
      setInput('')
    },
    onSuccess: (a: StudioAnswer) =>
      setThread(t => [
        ...t,
        a.filtered
          ? { id: newId(), role: 'ai', text: '', filtered: true }
          : { id: newId(), role: 'ai', text: a.answer, verses: a.verses, follow_ups: a.follow_ups, scripture: a.scripture },
      ]),
    onError: (e: Error, question) => {
      showToast(e.message, 'error')
      // 실패한 질문은 대화에서 빼고 입력칸으로 되돌린다
      setThread(t => t.filter((m, i) => !(i === t.length - 1 && m.role === 'me' && m.text === question)))
      setInput(question)
    },
  })

  const send = (text: string) => {
    const q = text.trim()
    if (!q || ask.isPending) return
    ask.mutate(q.slice(0, 600))
  }

  const saveNote = useMutation({
    mutationFn: (m: Message) =>
      createNote({
        kind: 'idea',
        body: m.text.slice(0, 4000),
        passage: passageLabel || null,
        source: STUDIO_NOTE_SOURCE,
        tags: ['AI초안'],
      }),
    onSuccess: (_n, m) => {
      invalidateNoteQueries(qc)
      setThread(t => t.map(x => (x.id === m.id ? { ...x, saved: true } : x)))
      showToast('설교 메모에 담았어요 · 개요 칸에 붙여 쓸 수 있어요', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  return (
    <div className="flex flex-col h-full min-h-0 rounded-3xl border border-brand/20 bg-white dark:bg-card-dark shadow-[0_8px_28px_var(--brand-glow)] overflow-hidden">
      {/* 머리 */}
      <div className="relative px-4 py-3.5 border-b border-gray-200/70 dark:border-white/[0.06] bg-gradient-to-b from-[var(--brand-soft)] to-transparent">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-brand text-white flex items-center justify-center shadow-[0_4px_14px_var(--brand-glow)]">
            <span className="material-icons-outlined text-[20px]">auto_awesome</span>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] lg:text-[16px] font-bold text-ink-strong leading-tight">AI 동역자</h2>
            <p className="text-[12px] text-gray-600 dark:text-white/60 truncate">고신 개혁주의 기준 · 이단 표현 자동 차단</p>
          </div>
          {thread.length > 0 && (
            <button
              type="button"
              onClick={() => setThread([])}
              className="shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold text-gray-600 dark:text-white/60 hover:text-brand hover:bg-white/70 dark:hover:bg-white/[0.06]"
            >
              새 대화
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="lg:hidden shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-600 dark:text-white/65 hover:bg-white/70 dark:hover:bg-white/[0.06]"
            >
              <span className="material-icons-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* 대화 */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {draftTarget && (
          <DraftComposer
            key={draftTarget.sectionId}
            outlineId={outlineId}
            target={draftTarget}
            onClose={onCloseDraft}
            onInsert={paragraphs => {
              onInsertDraft(draftTarget.sectionId, paragraphs)
              onCloseDraft()
            }}
          />
        )}

        {thread.length === 0 && !draftTarget && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] px-3.5 py-3">
              <p className="text-[13.5px] lg:text-[14.5px] leading-relaxed text-gray-700 dark:text-white/75">
                목사님, 무엇이든 물어 주세요. 본문과 지금 세우신 개요를 함께 보며 재료와 관점을 찾아 드립니다.
                설교의 말씀은 목사님의 몫이고, 저는 곁에서 묻고 찾고 점검하겠습니다.
              </p>
            </div>
            <p className="text-[12px] font-bold text-gray-500 dark:text-white/50">{STEP_LABEL[step]} 단계에서 이렇게 물어보세요</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS[step].map(q => (
                <button
                  key={q}
                  type="button"
                  disabled={ask.isPending}
                  onClick={() => send(q)}
                  className="text-left px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/[0.08] text-[13px] lg:text-[14px] font-semibold text-gray-700 dark:text-white/75 hover:border-brand hover:text-brand transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {thread.map(m =>
          m.role === 'me' ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-brand text-white text-[13.5px] lg:text-[14.5px] leading-relaxed whitespace-pre-line">
                {m.text}
              </p>
            </div>
          ) : m.filtered ? (
            <p key={m.id} className="px-3.5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-[13px] text-gray-600 dark:text-white/60">
              쓸 수 없는 표현이 섞여 이 답은 보여 드리지 않았습니다. 질문을 조금 바꿔 다시 물어 주세요.
            </p>
          ) : (
            <AnswerBubble
              key={m.id}
              message={m}
              saving={saveNote.isPending && saveNote.variables?.id === m.id}
              onSave={() => saveNote.mutate(m)}
              onFollow={send}
              disabled={ask.isPending}
            />
          ),
        )}

        {ask.isPending && (
          <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-white/60">
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            본문을 살피며 답을 찾는 중입니다…
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="border-t border-gray-200/70 dark:border-white/[0.06] px-3 pt-2.5 pb-3 space-y-2">
        <p className="flex flex-wrap items-center gap-1 text-[12px] text-gray-500 dark:text-white/50">
          <span className="material-icons-outlined text-[14px]">visibility</span>
          함께 보는 것: {[passageLabel || '본문 없음', STEP_LABEL[step], context ? `「${context.label}」 칸` : null].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03] px-3 py-2 focus-within:border-brand transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            maxLength={600}
            placeholder="본문·교리·적용에 대해 물어 주세요"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(input)
              }
            }}
            className="flex-1 min-w-0 resize-none bg-transparent text-[14px] lg:text-[15px] leading-relaxed text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none py-1"
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || ask.isPending}
            aria-label="묻기"
            className="shrink-0 w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-35 transition-opacity"
          >
            <span className="material-icons-outlined text-[19px]">arrow_upward</span>
          </button>
        </div>
        <p className="text-[12px] leading-snug text-gray-500 dark:text-white/50">
          AI의 답은 재료입니다. 말씀과 교리에 맞는지 목사님이 확인해 주세요.
        </p>
      </div>
    </div>
  )
}

// ── 답 하나 ───────────────────────────────────────────────
const AnswerBubble = ({
  message,
  saving,
  onSave,
  onFollow,
  disabled,
}: {
  message: Message
  saving: boolean
  onSave: () => void
  onFollow: (q: string) => void
  disabled: boolean
}) => (
  <div className="space-y-2">
    <div className="px-3.5 py-3 rounded-2xl rounded-bl-md bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05]">
      <p className="text-[13.5px] lg:text-[14.5px] leading-[1.75] text-ink-strong whitespace-pre-line">{message.text}</p>
      {message.scripture && message.scripture.length > 0 && <ScriptureWarnings items={message.scripture} />}
      {message.verses && message.verses.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {message.verses.map(v => (
            <li key={v.label} className="rounded-xl bg-white dark:bg-white/[0.05] px-3 py-2">
              <p className="text-[12px] font-bold text-brand">{v.label}</p>
              <p className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-700 dark:text-white/75">{v.text}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2.5 flex items-center gap-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || message.saved}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold text-brand hover:bg-[var(--brand-soft)] disabled:opacity-60"
        >
          <span className="material-icons-outlined text-[15px]">{message.saved ? 'check' : 'bookmark_add'}</span>
          {message.saved ? '메모에 담음' : saving ? '담는 중…' : '메모로 담기'}
        </button>
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard
              .writeText(message.text)
              .then(() => showToast('복사했습니다', 'success'))
              .catch(() => showToast('복사하지 못했습니다', 'error'))
          }
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold text-gray-600 dark:text-white/60 hover:text-brand"
        >
          <span className="material-icons-outlined text-[15px]">content_copy</span>복사
        </button>
      </div>
    </div>
    {message.follow_ups && message.follow_ups.length > 0 && (
      <div className="flex flex-wrap gap-1.5 pl-1">
        {message.follow_ups.map(q => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onFollow(q)}
            className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12px] lg:text-[12.5px] font-semibold text-left disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    )}
  </div>
)

const ScriptureWarnings = ({ items }: { items: ReviewFinding[] }) => (
  <ul className="mt-2.5 space-y-1">
    {items.map((f, i) => (
      <li key={i} className="flex gap-1.5 rounded-xl px-2.5 py-2 bg-amber-50 dark:bg-amber-400/10 text-[12px] lg:text-[12.5px] text-amber-900 dark:text-amber-200">
        <span className="material-icons-outlined text-[15px] mt-px">menu_book</span>
        <span>
          {f.comment}
          {f.expected && <span className="block mt-0.5 text-amber-800/80 dark:text-amber-200/75">개역개정: {f.expected}</span>}
        </span>
      </li>
    ))}
  </ul>
)

// ── 한 칸 문단 초안 ─────────────────────────────────────────
const DraftComposer = ({
  outlineId,
  target,
  onClose,
  onInsert,
}: {
  outlineId: number
  target: DraftTarget
  onClose: () => void
  onInsert: (paragraphs: string[]) => void
}) => {
  const [direction, setDirection] = useState('')
  const [length, setLength] = useState<'short' | 'normal'>('short')
  const [result, setResult] = useState<StudioDraft | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const run = useMutation({
    mutationFn: () => draftStudio(outlineId, { section_id: target.sectionId, direction: direction.trim(), length }),
    onSuccess: r => {
      setResult(r)
      setPicked(new Set(r.paragraphs.map((_, i) => i)))
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const chosen = result ? result.paragraphs.filter((_, i) => picked.has(i)) : []

  return (
    <div className="rounded-2xl border border-brand/40 bg-[var(--brand-soft)] p-3.5 space-y-3">
      <div className="flex items-start gap-2">
        <span className="material-icons-outlined text-[19px] text-brand mt-0.5">edit_note</span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] lg:text-[15px] font-bold text-ink-strong">「{target.label}」 칸 문단 초안</p>
          <p className="text-[12px] text-gray-600 dark:text-white/60">이 칸에 들어갈 문단만 씁니다. 넣은 글은 목사님이 고쳐 쓰시기 전까지 'AI 초안'으로 표시됩니다.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="초안 닫기" className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-white/60 hover:bg-white/70 dark:hover:bg-white/[0.08]">
          <span className="material-icons-outlined text-[18px]">close</span>
        </button>
      </div>

      {!result && (
        <>
          <textarea
            value={direction}
            onChange={e => setDirection(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="어떤 방향으로 쓸까요? 예: 지친 직장인 성도의 마음에서 시작해 '거하라'의 은혜로 (비워 두면 개요 요지대로)"
            className="w-full resize-none rounded-xl border border-white/80 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] px-3 py-2 text-[13.5px] lg:text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand"
          />
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/70 dark:bg-white/[0.05]">
              {(
                [
                  ['short', '2문단'],
                  ['normal', '3~4문단'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={length === v}
                  onClick={() => setLength(v)}
                  className={`px-3 py-1 rounded-lg text-[12.5px] font-bold ${length === v ? 'bg-brand text-white' : 'text-gray-600 dark:text-white/65'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={run.isPending}
              onClick={() => run.mutate()}
              className="ml-auto inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-brand text-white text-[13px] lg:text-[14px] font-bold disabled:opacity-60"
            >
              <span className={`material-icons-outlined text-[17px] ${run.isPending ? 'animate-spin' : ''}`}>{run.isPending ? 'autorenew' : 'auto_awesome'}</span>
              {run.isPending ? '쓰는 중… (30초쯤)' : '초안 받기'}
            </button>
          </div>
        </>
      )}

      {result && result.filtered > 0 && (
        <p className="text-[12.5px] text-gray-700 dark:text-white/70">쓸 수 없는 표현이 섞여 이 초안은 버렸습니다. 방향을 바꿔 다시 받아 주세요.</p>
      )}

      {result && result.paragraphs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-bold text-gray-600 dark:text-white/60">넣을 문단을 고르세요</p>
          {result.paragraphs.map((p, i) => {
            const on = picked.has(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setPicked(s => {
                    const next = new Set(s)
                    if (next.has(i)) next.delete(i)
                    else next.add(i)
                    return next
                  })
                }
                aria-pressed={on}
                className={`w-full text-left flex gap-2 rounded-xl px-3 py-2.5 border transition-colors ${
                  on ? 'bg-white dark:bg-white/[0.06] border-brand/50' : 'bg-white/50 dark:bg-white/[0.02] border-transparent opacity-60'
                }`}
              >
                <span className={`material-icons-outlined text-[19px] mt-0.5 ${on ? 'text-brand' : 'text-gray-400'}`}>{on ? 'check_circle' : 'radio_button_unchecked'}</span>
                <span className="text-[13.5px] lg:text-[14.5px] leading-[1.8] text-ink-strong whitespace-pre-line">{p}</span>
              </button>
            )
          })}
          {result.scripture.length > 0 && <ScriptureWarnings items={result.scripture} />}
          {result.notes.length > 0 && (
            <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] px-3 py-2">
              <p className="text-[12px] font-bold text-gray-600 dark:text-white/60 mb-1">넣기 전에 확인하실 점</p>
              <ul className="space-y-0.5">
                {result.notes.map(n => (
                  <li key={n} className="text-[12.5px] lg:text-[13px] text-gray-700 dark:text-white/70">· {n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setResult(null)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white/70 dark:bg-transparent text-[13px] font-semibold text-gray-700 dark:text-white/70 hover:border-brand hover:text-brand"
          >
            다시 받기
          </button>
          {result.paragraphs.length > 0 && (
            <button
              type="button"
              disabled={!chosen.length}
              onClick={() => onInsert(chosen)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-xl bg-brand text-white text-[13px] lg:text-[14px] font-bold disabled:opacity-40"
            >
              <span className="material-icons-outlined text-[17px]">south</span>
              {chosen.length ? `${chosen.length}문단을 원고 끝에 넣기` : '문단을 고르세요'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default StudioCompanion
