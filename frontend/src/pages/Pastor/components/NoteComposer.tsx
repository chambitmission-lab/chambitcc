// 설교 메모 쓰기/고치기 — 쓰는 동안 붙을 말씀(본문 표기 · 상황 주제 · 성경 사전)을 옆에서 보여 준다.
//
// 심방 기록에서 옮길 때(fromVisitId): 원문을 그대로 두지 않는다.
//   1) 회원 실명이 보이면 저장이 막히고 '이름 가리기'로 ○○ 처리
//   2) '누군지 알 수 없게 고쳤습니다' 확인을 눌러야 저장 — 이름 말고도 직장·병명·동네처럼 알아볼 단서가 있어서
// 메모는 목사님만 봅니다(서버도 작성자 외엔 404).
import { pastorKeys } from '../../../hooks/queryKeys'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import {
  NOTE_KIND_ICON,
  NOTE_KIND_LABEL,
  analyzeNote,
  createNote,
  deleteNote,
  updateNote,
  type NoteAnalysis,
  type NoteKind,
  type SermonNote,
} from '../../../api/pastor'
import {
  GLOSSARY_TYPE_LABEL,
  isGlossaryReady,
  loadGlossary,
  matchGlossary,
  type GlossaryEntry,
} from '../../Bible/data/bibleGlossary'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls } from './pastorUtils'
import { SermonPicker, UsedBadge } from './sermonNotes'
import { bibleLink, chipCls, invalidateNoteQueries } from './sermonNoteUtils'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'

const KINDS = Object.keys(NOTE_KIND_LABEL) as NoteKind[]

const PLACEHOLDER: Record<NoteKind, string> = {
  idea: '예: 염려를 없애라가 아니라 "기도로 바꾸라" — 빌 4:6',
  illustration: '예: 등대지기 이야기 — 불을 끄지 않은 이유',
  life: '예: ○○ 집사님, 수술 앞두고도 "하나님이 하실 일"이라며 웃으심',
  quote: '예: "하나님은 우리의 고통 속에서 소리치신다"',
  question: '예: 청년들은 왜 "기다림"을 실패로 느낄까?',
}

interface Props {
  note?: SermonNote
  /** 새 메모의 시작 값 — 빠른 메모에서 넘어오거나, 심방 기록에서 옮길 때 */
  initial?: { kind?: NoteKind; body?: string; passage?: string }
  fromVisitId?: number
  onClose: () => void
  onSaved?: (note: SermonNote) => void
}

const NoteComposer = ({ note, initial, fromVisitId, onClose, onSaved }: Props) => {
  const qc = useQueryClient()
  const fromVisit = fromVisitId != null || !!note?.from_visit
  const [kind, setKind] = useState<NoteKind>(note?.kind ?? initial?.kind ?? (fromVisitId != null ? 'life' : 'idea'))
  const [body, setBody] = useState(note?.body ?? initial?.body ?? '')
  const [passage, setPassage] = useState(note?.passage ?? initial?.passage ?? '')
  const [source, setSource] = useState(note?.source ?? '')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [anonymized, setAnonymized] = useState(!!note)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pickingSermon, setPickingSermon] = useState(false)

  const dBody = useDebouncedValue(body.trim(), 600)
  const dPassage = useDebouncedValue(passage.trim(), 600)
  const { data: analysis, isFetching: analyzing } = useQuery<NoteAnalysis>({
    queryKey: pastorKeys.noteAnalyze(dBody, dPassage),
    queryFn: () => analyzeNote(dBody, dPassage || null),
    enabled: dBody.length >= 2 || dPassage.length >= 2,
    staleTime: 60_000,
    // 글자마다 키가 바뀌어도 새 답이 올 때까지 앞 결과를 그대로 둔다 — 비워 두면 오른쪽 말씀 칸이 깜빡인다
    placeholderData: keepPreviousData,
  })
  // 지금 글에 아직 남아 있는 실명만 — 타자 중에도 경고가 사라졌다 나타나지 않게
  const names = (analysis?.names ?? []).filter(n => body.includes(n.match))
  const bodyRefs = (analysis?.refs ?? []).filter(r => r.origin === 'body')

  // 성경 사전 — 앱에 이미 있는 표제어(인물·지명·용어)를 메모 글에서 찾는다. 첫 본문의 책 기준으로 동명이인을 거른다
  const [glossaryReady, setGlossaryReady] = useState(isGlossaryReady())
  useEffect(() => {
    if (!glossaryReady) void loadGlossary().then(() => setGlossaryReady(true))
  }, [glossaryReady])
  const glossary = useMemo<GlossaryEntry[]>(() => {
    if (!glossaryReady || !dBody) return []
    const book = analysis?.refs[0]?.book_number ?? 0
    const seen = new Set<string>()
    return matchGlossary(book, dBody)
      .map(m => m.entry)
      .filter(e => (seen.has(e.name) ? false : (seen.add(e.name), true)))
      .slice(0, 6)
  }, [glossaryReady, dBody, analysis])

  const maskNames = () => {
    let next = body
    for (const n of names) next = next.split(n.match).join('○○')
    setBody(next)
  }

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '').slice(0, 20)
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t])
    setTagDraft('')
  }

  const done = (saved: SermonNote, msg: string) => {
    invalidateNoteQueries(qc)
    const links = saved.refs.length + saved.topics.length
    showToast(links ? `${msg} · 말씀 ${links}곳과 이어졌어요` : msg, 'success')
    onSaved?.(saved)
    onClose()
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        kind,
        body: body.trim(),
        passage: passage.trim() || null,
        source: source.trim() || null,
        tags,
        pinned,
      }
      return note ? updateNote(note.id, payload) : createNote({ ...payload, from_visit_id: fromVisitId ?? null })
    },
    onSuccess: saved => done(saved, note ? '메모를 고쳤습니다' : '메모를 남겼습니다'),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const markUsed = useMutation({
    mutationFn: (data: { used_sermon_id?: number | null; used_on?: string | null }) => updateNote(note!.id, data),
    onSuccess: saved => {
      invalidateNoteQueries(qc)
      showToast(saved.used_on ? '설교에 쓴 메모로 표시했습니다' : '사용 기록을 지웠습니다', 'success')
      setPickingSermon(false)
      onSaved?.(saved)
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const remove = useMutation({
    mutationFn: () => deleteNote(note!.id),
    onSuccess: () => {
      invalidateNoteQueries(qc)
      showToast('메모를 지웠습니다', 'success')
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const blockedByNames = fromVisit && names.length > 0
  const canSave = body.trim().length > 0 && !blockedByNames && (!fromVisit || anonymized) && !save.isPending

  return (
    <PastorModal
      title={note ? '설교 메모 고치기' : fromVisitId != null ? '심방에서 설교 재료로' : '설교 메모'}
      onClose={onClose}
      wide
      footer={
        <>
          {note && (
            <GhostButton danger onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}>
              {confirmDelete ? '정말 지우기' : '지우기'}
            </GhostButton>
          )}
          <PrimaryButton disabled={!canSave} onClick={() => save.mutate()}>
            {save.isPending ? '저장 중...' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10 lg:min-h-full">
        {/* 왼쪽: 쓰는 칸 */}
        <div className="space-y-4 lg:space-y-6 lg:min-w-0">
          <p className="flex items-start gap-1.5 text-[12px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60">
            <span className="material-icons-outlined text-[15px] lg:text-[18px] text-brand mt-0.5">lock</span>
            설교 메모는 목사님만 봅니다. 다른 교역자·관리자에게도 보이지 않습니다.
          </p>

          {fromVisit && !note && (
            <div className="rounded-xl border border-[var(--amber)] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-3 space-y-2">
              <p className="text-[12.5px] lg:text-[14px] font-bold text-ink-strong">심방 이야기는 누군지 알 수 없게 옮겨 주세요</p>
              <p className="text-[12px] lg:text-[13.5px] text-gray-600 dark:text-white/65 leading-relaxed">
                이름뿐 아니라 직장·병명·사는 곳·가족 관계처럼 알아볼 수 있는 단서도 지우거나 바꿔 주세요.
                강단에서 들은 성도가 "내 이야기다"라고 느끼지 않도록요.
              </p>
              <button
                type="button"
                onClick={() => setAnonymized(!anonymized)}
                aria-pressed={anonymized}
                className="flex items-center gap-1.5 text-[12.5px] lg:text-[14px] font-semibold text-ink-strong"
              >
                <span className={`material-icons-outlined text-[18px] lg:text-[20px] ${anonymized ? 'text-brand' : 'text-gray-500'}`}>
                  {anonymized ? 'check_box' : 'check_box_outline_blank'}
                </span>
                누군지 알 수 없게 고쳤습니다
              </button>
            </div>
          )}

          <div>
            <FieldLabel>종류</FieldLabel>
            <div className="flex flex-wrap gap-1.5 lg:gap-2">
              {KINDS.map(k => (
                <button key={k} type="button" className={`${chipCls(kind === k)} inline-flex items-center gap-1`} onClick={() => setKind(k)}>
                  <span className="material-icons-outlined text-[15px] lg:text-[17px]">{NOTE_KIND_ICON[k]}</span>
                  {NOTE_KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <FieldLabel hint={`${body.length}/4000`}>메모</FieldLabel>
            <textarea
              className={`${inputCls} min-h-[140px] lg:min-h-[220px] resize-y lg:px-5 lg:py-4 lg:text-[17px] lg:leading-[1.8]`}
              value={body}
              maxLength={4000}
              placeholder={PLACEHOLDER[kind]}
              onChange={e => setBody(e.target.value)}
              autoFocus={!note}
            />
          </label>

          {names.length > 0 && (
            <div className="rounded-xl border border-[var(--amber)] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 flex items-center gap-2">
              <span className="material-icons-outlined text-[18px] text-[var(--amber)]">person_off</span>
              <p className="flex-1 text-[12.5px] lg:text-[14px] text-ink-strong">
                실명이 들어 있어요: <b>{names.map(n => n.match).join(', ')}</b>
                {!fromVisit && <span className="text-gray-600 dark:text-white/60"> — 강단에서 쓰기 전에 가려 두면 안전합니다</span>}
              </p>
              <button type="button" onClick={maskNames} className="shrink-0 px-3 py-1.5 rounded-lg bg-brand text-white text-[12.5px] font-bold">
                이름 가리기
              </button>
            </div>
          )}

          <div>
            {/* 메모 글 속 본문은 서버가 스스로 읽는다 — 이 칸은 글에 없는 본문을 덧붙일 때만 */}
            {bodyRefs.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] lg:text-[13.5px] font-semibold text-gray-600 dark:text-white/60">메모에서 찾은 본문</span>
                {bodyRefs.map(r => (
                  <span
                    key={r.label}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] lg:text-[14px] font-bold"
                  >
                    <span className="material-icons-outlined text-[15px] lg:text-[17px]">check_circle</span>
                    {r.label}
                  </span>
                ))}
                <span className="text-[12px] lg:text-[13.5px] text-gray-500 dark:text-white/50">자동 연결됨</span>
              </div>
            )}
            <label className="block">
              <FieldLabel hint="선택 · 메모에 없는 본문을 덧붙일 때">더 이을 본문</FieldLabel>
              <input
                className={`${inputCls} lg:px-5 lg:py-3 lg:text-[16px]`}
                value={passage}
                maxLength={100}
                placeholder={bodyRefs.length ? '다른 본문도 잇고 싶을 때 — 예: 빌 4:6-7' : '예: 빌 4:6-7, 시편 23편'}
                onChange={e => setPassage(e.target.value)}
              />
            </label>
          </div>

          {(kind === 'quote' || kind === 'illustration' || source) && (
            <label className="block">
              <FieldLabel hint="선택">출처</FieldLabel>
              <input
                className={`${inputCls} lg:px-5 lg:py-3 lg:text-[16px]`}
                value={source}
                maxLength={200}
                placeholder="예: C.S. 루이스, 『고통의 문제』"
                onChange={e => setSource(e.target.value)}
              />
            </label>
          )}

          <div>
            <FieldLabel hint="최대 8개">태그</FieldLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter(x => x !== t))}
                  className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-semibold"
                  aria-label={`${t} 태그 빼기`}
                >
                  #{t}
                  <span className="material-icons-outlined text-[14px]">close</span>
                </button>
              ))}
              <input
                className="flex-1 min-w-[140px] px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-ink-strong focus:outline-none focus:border-brand"
                value={tagDraft}
                placeholder="예: 청년부, 추수감사"
                onChange={e => setTagDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                onBlur={addTag}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPinned(!pinned)}
            aria-pressed={pinned}
            className="flex items-center gap-1.5 text-[12.5px] lg:text-[14px] font-semibold text-gray-600 dark:text-white/65"
          >
            <span className={`material-icons-outlined text-[18px] lg:text-[20px] ${pinned ? 'text-brand' : ''}`}>push_pin</span>
            {pinned ? '맨 위에 고정됨' : '맨 위에 고정'}
          </button>

          {note && (
            <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-2">
              <FieldLabel hint="같은 예화를 되풀이하지 않게">설교에 썼나요</FieldLabel>
              {note.used_on ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <UsedBadge note={note} />
                  {note.used_sermon && <span className="text-[12.5px] text-ink-strong font-semibold">{note.used_sermon.title}</span>}
                  <button
                    type="button"
                    onClick={() => markUsed.mutate({ used_on: null })}
                    className="ml-auto text-[12.5px] font-semibold text-gray-600 dark:text-white/60 hover:text-brand"
                  >
                    사용 기록 지우기
                  </button>
                </div>
              ) : pickingSermon ? (
                <SermonPicker
                  pending={markUsed.isPending}
                  onPick={({ sermon, date }) =>
                    markUsed.mutate(sermon ? { used_sermon_id: sermon.id } : { used_on: date })
                  }
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPickingSermon(true)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand"
                >
                  설교에 썼어요
                </button>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 이어지는 말씀 */}
        <div className={`space-y-4 lg:min-w-0 lg:border-l lg:border-gray-100 dark:lg:border-white/[0.06] lg:pl-8 transition-opacity duration-200 ${analyzing ? 'opacity-70' : ''}`}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] lg:text-[15px] font-bold text-ink-strong">이 메모와 이어지는 말씀</p>
            {analyzing && <span className="text-[12px] text-gray-500">찾는 중...</span>}
          </div>
          {!analysis || (analysis.refs.length === 0 && analysis.topics.length === 0 && glossary.length === 0) ? (
            <p className="text-[12.5px] lg:text-[14px] text-gray-600 dark:text-white/60 leading-relaxed">
              메모에 "롬 8:28"처럼 본문을 적거나, 걱정·감사·병원 같은 삶의 말을 쓰면
              관련 본문과 상황별 말씀을 여기서 찾아 드립니다.
            </p>
          ) : (
            <>
              {analysis.refs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">이어진 본문</p>
                  {analysis.refs.map(r => (
                    <Link
                      key={r.label}
                      to={bibleLink(r.book_number, r.chapter, r.verse)}
                      target="_blank"
                      className="block rounded-xl bg-[var(--brand-soft)] px-3.5 py-2.5 hover:ring-1 hover:ring-brand"
                    >
                      <span className="block text-[12.5px] lg:text-[14px] font-bold text-brand">{r.label}</span>
                      {r.text && (
                        <span className="block mt-0.5 text-[12.5px] lg:text-[14px] text-[#4b5563] dark:text-white/70 leading-relaxed line-clamp-3">
                          {r.text}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              {analysis.topics.map(t => (
                <div key={t.id} className="space-y-1.5">
                  <p className="flex items-center gap-1 text-[12px] font-bold text-gray-600 dark:text-white/65">
                    <span className="material-icons-outlined text-[15px]" style={{ color: t.color }}>{t.icon}</span>
                    상황 · {t.name}
                    <span className="font-normal text-gray-500">({t.hits.join(', ')})</span>
                  </p>
                  {(t.verses ?? []).map(v => (
                    <Link
                      key={v.label}
                      to={bibleLink(v.book_number, v.chapter, v.verse)}
                      target="_blank"
                      className="block rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02] px-3.5 py-2 hover:border-brand"
                    >
                      <span className="text-[12px] lg:text-[13.5px] font-bold text-brand">{v.label}</span>
                      <span className="block text-[12.5px] lg:text-[14px] text-[#4b5563] dark:text-white/70 leading-relaxed line-clamp-2">{v.text}</span>
                    </Link>
                  ))}
                </div>
              ))}
              {glossary.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">성경 사전</p>
                  {glossary.map(g => (
                    <div key={g.name} className="rounded-xl border border-gray-100 dark:border-white/[0.06] px-3.5 py-2">
                      <span className="text-[12.5px] lg:text-[14px] font-bold text-ink-strong">{g.name}</span>
                      <span className="ml-1.5 text-[12px] text-gray-500">{GLOSSARY_TYPE_LABEL[g.type]} · {g.first}</span>
                      <span className="block text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/65 leading-relaxed">{g.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PastorModal>
  )
}

export default NoteComposer
