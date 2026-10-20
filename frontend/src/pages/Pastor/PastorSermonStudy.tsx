import { pastorKeys } from '../../hooks/queryKeys'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCrossRef,
  createOutline,
  deleteCrossRef,
  fetchOutlines,
  fetchSermonStudy,
  type CrossRef,
  type SermonNote,
  type SermonStudy,
  type StudyVerse,
} from '../../api/pastor'
import { showToast } from '../../utils/toast'
import { EmptyHint, SectionCard, StatSpinner } from '../Admin/components/StatCards'
import PastorShell from './components/PastorShell'
import NoteComposer from './components/NoteComposer'
import OutlineOptionsCard from './components/OutlineOptionsCard'
import SermonBridgeCard from './components/SermonBridgeCard'
import SermonBriefCard from './components/SermonBriefCard'
import { IconButton, NoteCard, SermonTabs } from './components/sermonNotes'
import { agoLabel, daysSince, formatDay, inputCls, usePastorGate } from './components/pastorUtils'

// 설교 본문 작업대 — 본문 하나를 열면 연구 재료를 한 화면에 모은다 (기본은 규칙·집계)
//   좌: 본문(반복어 색 표시·성도 밑줄 수) · AI 연구 재료 · 적용 다리 · 대지 후보(모두 누를 때만, 고른 것만 메모·개요로) · 권 개관
//   우: 고른 절의 관주(교역자가 직접 잇는다) · 절 해석 · 내 메모 · 지난 설교 · 원고로 이어 쓰기
// 본문은 주소(?ref=)에 남겨 새로고침·뒤로가기에도 같은 본문이 열린다.

const verseKey = (v: { chapter: number; verse: number }) => `${v.chapter}:${v.verse}`

// 반복어 색 — 브랜드 블루를 첫째로, 나머지는 서로 구분되는 차분한 색
const KEYWORD_TONES = [
  { mark: 'bg-[rgba(49,130,246,0.16)] text-brand dark:bg-[rgba(69,147,252,0.24)]', chip: 'bg-[var(--brand-soft)] text-brand' },
  { mark: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { mark: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  { mark: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', chip: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  { mark: 'bg-pink-500/15 text-pink-700 dark:text-pink-300', chip: 'bg-pink-500/10 text-pink-700 dark:text-pink-300' },
  { mark: 'bg-teal-500/15 text-teal-700 dark:text-teal-300', chip: 'bg-teal-500/10 text-teal-700 dark:text-teal-300' },
]

const PastorSermonStudy = () => {
  const pastor = usePastorGate()
  const [params, setParams] = useSearchParams()
  const ref = (params.get('ref') ?? '').trim()
  const [input, setInput] = useState(ref)
  // 뒤로가기 등으로 주소의 본문이 바뀌면 입력 칸도 따라간다
  const [shownRef, setShownRef] = useState(ref)
  if (shownRef !== ref) {
    setShownRef(ref)
    setInput(ref)
  }

  const { data, isPending, isFetching } = useQuery<SermonStudy>({
    queryKey: pastorKeys.sermonStudy(ref),
    queryFn: () => fetchSermonStudy(ref),
    enabled: pastor && ref.length >= 2,
    placeholderData: keepPreviousData,
  })

  const open = (next: string) => {
    const r = next.trim()
    if (r) setParams({ ref: r })
  }

  return (
    <PastorShell>
      <SermonTabs />
      <div className="px-4 pt-4">
        <form
          className="flex gap-2 lg:max-w-[640px]"
          onSubmit={e => {
            e.preventDefault()
            open(input)
          }}
        >
          <input
            className={`${inputCls} lg:text-[16px]`}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="연구할 본문 — 예: 요 15:1-8, 시편 23편"
            maxLength={100}
            aria-label="연구할 본문"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 px-5 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold disabled:opacity-40"
          >
            열기
          </button>
        </form>
      </div>

      {!ref ? (
        <StartHints onPick={open} />
      ) : isPending && !data ? (
        <StatSpinner label="본문 자료를 모으는 중..." />
      ) : !data || !data.found || !data.verses?.length ? (
        <p className="px-4 py-16 text-center text-[13.5px] text-gray-600 dark:text-white/60">
          본문을 읽지 못했어요. "요 15:1-8"이나 "요한복음 15장"처럼 적어 주세요.
        </p>
      ) : (
        <div className={isFetching && data.query !== ref ? 'opacity-60 transition-opacity' : undefined}>
          <StudyBody key={data.label} data={data} />
        </div>
      )}
    </PastorShell>
  )
}

// ── 처음 열었을 때 — 준비 중인 개요의 본문을 바로 열 수 있게 ─────────
const StartHints = ({ onPick }: { onPick: (ref: string) => void }) => {
  const { data } = useQuery({ queryKey: pastorKeys.outlines(), queryFn: fetchOutlines })
  const drafts = (data ?? []).filter(o => o.status === 'draft' && o.passage).slice(0, 6)
  return (
    <SectionCard title="어떤 본문을 연구할까요?">
      <p className="text-[12.5px] lg:text-[14px] text-gray-600 dark:text-white/65 leading-relaxed">
        본문을 열면 반복되는 말, 성도들이 밑줄 그은 절, 권 개관과 그리스도 연결, 절 해석, 이어 둔 관주, 내 메모, 지난 설교를 한 화면에 모아 드립니다.
      </p>
      {drafts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[12px] font-bold text-gray-600 dark:text-white/65">준비 중인 개요의 본문</p>
          <div className="flex flex-wrap gap-1.5">
            {drafts.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => onPick(o.passage!)}
                className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-[13px] font-semibold text-ink-strong hover:border-brand hover:text-brand"
              >
                {o.passage}
                {o.preach_on && <span className="ml-1 text-gray-500 dark:text-white/50 font-normal">{formatDay(o.preach_on, false)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ── 작업대 본체 ───────────────────────────────────────────
// dev 미리보기(/dev/sermon-desk)도 표본 데이터로 이 본체를 그린다
export const StudyBody = ({ data }: { data: SermonStudy }) => {
  const verses = data.verses ?? []
  const keywords = data.keywords ?? []
  const [selected, setSelected] = useState<string>(verseKey(verses[0]))
  const [on, setOn] = useState<Set<string>>(() => new Set(keywords.slice(0, 2).map(k => k.word)))
  const [openNote, setOpenNote] = useState<SermonNote | null>(null)
  const current = verses.find(v => verseKey(v) === selected) ?? verses[0]
  const singleChapter = verses[0].chapter === verses[verses.length - 1].chapter
  const notes = data.notes ?? []
  const xrefs = data.cross_refs ?? []
  const qc = useQueryClient()

  const toggle = (w: string) =>
    setOn(prev => {
      const next = new Set(prev)
      if (next.has(w)) next.delete(w)
      else next.add(w)
      return next
    })

  return (
    <>
      {/* 본문 머리 */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl p-4 lg:p-5 bg-gradient-to-br from-brand to-[#1b64da] text-white shadow-[0_8px_24px_var(--brand-glow)]">
          <p className="text-[12px] lg:text-[13px] font-bold tracking-[0.08em] opacity-85">본문 작업대</p>
          <h1 className="mt-0.5 text-[22px] lg:text-[26px] font-bold tracking-[-0.02em]">{data.label}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[12.5px] lg:text-[13.5px] font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-white/15">
              {verses.length}절{data.clipped && ' · 앞부분만'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 inline-flex items-center gap-1">
              <span className="material-icons-outlined text-[15px]">history</span>
              {data.past_sermons?.length
                ? `같은 장 지난 설교 ${data.past_sermons.length}편 · 마지막 ${formatDay(data.past_sermons[0].date, false)}`
                : '같은 장 지난 설교 없음'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 inline-flex items-center gap-1">
              <span className="material-icons-outlined text-[15px]">sticky_note_2</span>이어지는 메모 {notes.length}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 inline-flex items-center gap-1">
              <span className="material-icons-outlined text-[15px]">link</span>관주 {xrefs.length}
            </span>
          </div>
        </div>
      </div>

      <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="contents lg:block lg:min-w-0">
          <SectionCard
            title="본문"
            action={<span className="text-[12px] text-gray-500 dark:text-white/50">개역개정 · 절을 누르면 관주·해석이 바뀝니다</span>}
          >
            {keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] font-bold text-gray-500 dark:text-white/50 mr-0.5">반복어</span>
                {keywords.map((k, i) => (
                  <button
                    key={k.word}
                    type="button"
                    onClick={() => toggle(k.word)}
                    aria-pressed={on.has(k.word)}
                    className={`px-2.5 py-1 rounded-full text-[12.5px] lg:text-[13.5px] font-bold border transition-colors ${
                      on.has(k.word)
                        ? `${KEYWORD_TONES[i % KEYWORD_TONES.length].chip} border-transparent`
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50'
                    }`}
                  >
                    {k.word} <span className="opacity-70">{k.count}회</span>
                  </button>
                ))}
              </div>
            )}
            <ol className="space-y-0.5 -mx-1">
              {verses.map(v => (
                <VerseRow
                  key={v.id}
                  v={v}
                  showChapter={!singleChapter}
                  active={verseKey(v) === selected}
                  onSelect={() => setSelected(verseKey(v))}
                  keywords={keywords}
                  on={on}
                />
              ))}
            </ol>
            <p className="text-[12px] text-gray-500 dark:text-white/50">
              밑줄 · 즐겨찾기는 성도들이 /bible 에서 남긴 것을 사람 수로만 보여 드립니다.
            </p>
          </SectionCard>

          {/* AI 연구 재료 — 담은 항목은 오른쪽 '이 본문과 이어지는 내 메모'에 바로 보이게 작업대를 다시 읽는다 */}
          <SermonBriefCard
            label={data.label ?? data.query}
            onSaved={() => void qc.invalidateQueries({ queryKey: pastorKeys.sermonStudy(data.query) })}
          />
          <SermonBridgeCard
            label={data.label ?? data.query}
            onSaved={() => void qc.invalidateQueries({ queryKey: pastorKeys.sermonStudy(data.query) })}
          />
          <OutlineOptionsCard label={data.label ?? data.query} />

          <BookIntroCard data={data} />
        </div>

        <div className="contents lg:block">
          <CrossRefCard data={data} verse={current} />
          <CommentaryCard data={data} verse={current} />

          <SectionCard title="이 본문과 이어지는 내 메모" action={<Link to="/pastor/sermon/notes" className="text-[12px] font-bold text-brand hover:underline">설교 메모</Link>}>
            {data.topics && data.topics.length > 0 && (
              <p className="text-[12px] text-gray-600 dark:text-white/60">본문의 주제: {data.topics.join(' · ')}</p>
            )}
            {notes.length === 0 ? (
              <EmptyHint text="이어지는 메모가 아직 없습니다" />
            ) : (
              <ul className="space-y-1.5">
                {notes.map(n => (
                  <li key={n.id}>
                    <NoteCard note={n} compact onOpen={() => setOpenNote(n)} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="같은 장 지난 설교">
            {!data.past_sermons?.length ? (
              <EmptyHint text="이 장을 다룬 지난 설교가 없습니다" />
            ) : (
              <ul className="space-y-1.5">
                {data.past_sermons.map(m => (
                  <li key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] lg:text-[14px] font-semibold text-ink-strong truncate">{m.title}</span>
                      <span className="block text-[12px] text-gray-600 dark:text-white/60 truncate">
                        {[m.bible_verse, m.pastor].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-gray-600 dark:text-white/60">
                      {formatDay(m.date, false)} · {agoLabel(daysSince(m.date))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <WriteCard data={data} notes={notes} />
        </div>
      </div>

      {openNote && <NoteComposer note={openNote} onClose={() => setOpenNote(null)} />}
    </>
  )
}

// ── 본문 한 절 ────────────────────────────────────────────
const highlight = (text: string, keywords: { word: string }[], on: Set<string>): ReactNode => {
  const active = keywords.map((k, i) => ({ word: k.word, i })).filter(k => on.has(k.word))
  if (!active.length) return text
  // 긴 말부터 — "포도나무" 가 "포도" 보다 먼저 잡히게
  const ordered = [...active].sort((a, b) => b.word.length - a.word.length)
  const re = new RegExp(`(${ordered.map(k => k.word).join('|')})`, 'g')
  return text.split(re).map((part, idx) => {
    const k = active.find(a => a.word === part)
    return k ? (
      <mark key={idx} className={`rounded px-0.5 ${KEYWORD_TONES[k.i % KEYWORD_TONES.length].mark}`}>
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    )
  })
}

const VerseRow = ({
  v,
  showChapter,
  active,
  onSelect,
  keywords,
  on,
}: {
  v: StudyVerse
  showChapter: boolean
  active: boolean
  onSelect: () => void
  keywords: { word: string }[]
  on: Set<string>
}) => {
  const num = v.verse_label || String(v.verse)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`w-full text-left flex gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          active ? 'bg-[var(--brand-soft)] ring-1 ring-brand/40' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
        }`}
      >
        <span className={`shrink-0 min-w-[1.75rem] text-right text-[13px] lg:text-[14px] font-bold pt-0.5 ${active ? 'text-brand' : 'text-gray-400 dark:text-white/40'}`}>
          {showChapter ? `${v.chapter}:${num}` : num}
        </span>
        <span className="flex-1 min-w-0 text-[15px] lg:text-[17px] leading-[1.8] text-ink-strong">{highlight(v.text, keywords, on)}</span>
        {(v.underline_users > 0 || v.favorite_users > 0 || v.cross_ref_count > 0) && (
          <span className="shrink-0 self-start mt-1 flex flex-col items-end gap-1">
            {v.underline_users > 0 && <Badge icon="edit_note" text={`밑줄 ${v.underline_users}명`} />}
            {v.favorite_users > 0 && <Badge icon="bookmark_border" text={`${v.favorite_users}명`} />}
            {v.cross_ref_count > 0 && <Badge icon="link" text={`${v.cross_ref_count}`} brand />}
          </span>
        )}
      </button>
    </li>
  )
}

const Badge = ({ icon, text, brand }: { icon: string; text: string; brand?: boolean }) => (
  <span
    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11.5px] lg:text-[12.5px] font-semibold whitespace-nowrap ${
      brand ? 'bg-[var(--brand-soft)] text-brand' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
    }`}
  >
    <span className="material-icons-outlined text-[13px]">{icon}</span>
    {text}
  </span>
)

// ── 권 개관 · 그리스도 연결 ────────────────────────────────
const BookIntroCard = ({ data }: { data: SermonStudy }) => {
  const intro = data.book_intro
  return (
    <SectionCard title={`권 개관 · ${data.book_name}`}>
      {!intro ? (
        <p className="text-[12.5px] text-gray-600 dark:text-white/60 leading-relaxed">
          아직 {data.book_name} 개관이 없습니다.{' '}
          <Link to={`/bible/${data.book_number}/1`} className="font-semibold text-brand hover:underline">
            성경 화면
          </Link>
          에서 권 개관을 쓰면 여기 함께 보입니다.
        </p>
      ) : (
        <>
          <p className="text-[14px] lg:text-[15.5px] font-bold text-ink-strong">{intro.one_liner}</p>
          <div className="flex flex-wrap gap-1.5">
            {[intro.theme, intro.author_period, intro.key_chapters].filter(Boolean).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.07] text-[12px] lg:text-[13px] font-semibold text-gray-600 dark:text-white/65">
                {t}
              </span>
            ))}
          </div>
          {intro.christ_connection && (
            <div className="rounded-xl border-l-4 border-brand bg-[var(--brand-soft)] px-4 py-3">
              <p className="flex items-center gap-1 text-[12.5px] lg:text-[13.5px] font-bold text-brand">
                <span className="material-icons-outlined text-[16px]">route</span>그리스도께로 — 구속사 흐름
              </p>
              <p className="mt-1 text-[13.5px] lg:text-[15px] leading-relaxed text-ink-strong">{intro.christ_connection}</p>
            </div>
          )}
          {intro.overview && <p className="text-[13px] lg:text-[14.5px] leading-relaxed text-gray-700 dark:text-white/75">{intro.overview}</p>}
        </>
      )}
    </SectionCard>
  )
}

// ── 관주 (고른 절) ─────────────────────────────────────────
const CrossRefCard = ({ data, verse }: { data: SermonStudy; verse: StudyVerse }) => {
  const qc = useQueryClient()
  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const list = (data.cross_refs ?? []).filter(x => x.chapter === verse.chapter && x.verse === verse.verse)
  const refresh = () => qc.invalidateQueries({ queryKey: pastorKeys.sermonStudy(data.query) })

  const add = useMutation({
    mutationFn: () =>
      addCrossRef({ book_number: data.book_number!, chapter: verse.chapter, verse: verse.verse, target: target.trim(), note: note.trim() || null }),
    onSuccess: () => {
      setTarget('')
      setNote('')
      void refresh()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: (x: CrossRef) => deleteCrossRef(x.id),
    onSuccess: () => void refresh(),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  return (
    <SectionCard title={`${verse.chapter}:${verse.verse_label || verse.verse}절 관주 · 평행 본문`}>
      {list.length === 0 ? (
        <p className="text-[12.5px] text-gray-500 dark:text-white/50">이 절에 이어 둔 관주가 아직 없습니다. 한 번 이어 두면 다른 교역자도 함께 봅니다.</p>
      ) : (
        <ul className="space-y-2">
          {list.map(x => (
            <li key={x.id} className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3">
              <div className="flex items-start gap-2">
                <span className="flex-1 min-w-0">
                  <Link
                    to={`/bible/${x.target.book_number}/${x.target.chapter}`}
                    className="text-[13.5px] lg:text-[14.5px] font-bold text-brand hover:underline"
                  >
                    {x.label}
                  </Link>
                  {x.note && <span className="ml-1.5 text-[12px] lg:text-[13px] text-gray-500 dark:text-white/55">{x.note}</span>}
                </span>
                {x.mine ? (
                  <IconButton icon="close" label="관주 지우기" danger onClick={() => remove.mutate(x)} />
                ) : (
                  x.author && <span className="shrink-0 text-[11.5px] text-gray-400 dark:text-white/40 pt-0.5">{x.author}</span>
                )}
              </div>
              {x.text && <p className="mt-1 text-[13px] lg:text-[14px] leading-relaxed text-gray-700 dark:text-white/75">{x.text}</p>}
            </li>
          ))}
        </ul>
      )}
      <form
        className="space-y-1.5 pt-1"
        onSubmit={e => {
          e.preventDefault()
          if (target.trim().length >= 2) add.mutate()
        }}
      >
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="이을 본문 — 예: 사 5:1-7"
            maxLength={40}
            aria-label="이을 본문"
          />
          <button
            type="submit"
            disabled={target.trim().length < 2 || add.isPending}
            className="shrink-0 px-4 rounded-xl bg-brand text-white text-[13.5px] font-bold disabled:opacity-40"
          >
            잇기
          </button>
        </div>
        <input
          className={inputCls}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="왜 잇는지 한 줄 (선택) — 예: 열매 없는 포도원"
          maxLength={100}
          aria-label="관주 메모"
        />
      </form>
    </SectionCard>
  )
}

// ── 절 해석 ───────────────────────────────────────────────
const CommentaryCard = ({ data, verse }: { data: SermonStudy; verse: StudyVerse }) => {
  const items = useMemo(() => {
    const all = data.commentaries ?? []
    const covers = (c: (typeof all)[number]) => c.chapter === verse.chapter && c.verse_start <= verse.verse && verse.verse <= c.verse_end
    return [...all.filter(covers), ...all.filter(c => !covers(c))]
  }, [data.commentaries, verse])
  if (!items.length) return null
  return (
    <SectionCard
      title="절 해석"
      action={
        <Link to={`/bible/${data.book_number}/${verse.chapter}`} className="text-[12px] font-bold text-brand hover:underline">
          성경에서 보기
        </Link>
      }
    >
      <ul className="space-y-2">
        {items.slice(0, 5).map(c => {
          const here = c.chapter === verse.chapter && c.verse_start <= verse.verse && verse.verse <= c.verse_end
          return (
            <li key={c.id} className={`rounded-xl p-3 border ${here ? 'border-brand/40 bg-[var(--brand-soft)]' : 'border-gray-200/70 dark:border-white/[0.07]'}`}>
              <p className="flex items-center gap-1.5 text-[12px] lg:text-[13px] font-bold text-gray-500 dark:text-white/55">
                <span className={here ? 'text-brand' : undefined}>
                  {c.chapter}:{c.verse_start}
                  {c.verse_end > c.verse_start && `-${c.verse_end}`}
                </span>
                {c.category && <span>· {c.category}</span>}
                {c.scope === 'summary' && <span>· 요약</span>}
              </p>
              {c.title && <p className="mt-0.5 text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong">{c.title}</p>}
              <p className="mt-0.5 text-[12.5px] lg:text-[14px] leading-relaxed text-gray-700 dark:text-white/75">{c.excerpt}</p>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}

// ── 원고로 이어 쓰기 ───────────────────────────────────────
const WriteCard = ({ data, notes }: { data: SermonStudy; notes: SermonNote[] }) => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const outlines = data.outlines ?? []
  const start = useMutation({
    mutationFn: () =>
      createOutline({
        title: `${data.label} 설교`,
        passage: data.label,
        // 같은 본문 메모 중 아직 쓰지 않은 것만 본론 칸에 미리 붙인다 (설교 준비의 '개요 시작'과 같은 규칙)
        note_ids: notes.filter(n => n.reasons?.includes('같은 본문') && !n.used_on).map(n => n.id),
      }),
    onSuccess: o => {
      void qc.invalidateQueries({ queryKey: pastorKeys.outlines() })
      navigate(`/pastor/sermon/outlines/${o.id}?mode=manuscript`)
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  return (
    <SectionCard title="원고로 이어 쓰기">
      {outlines.length > 0 && (
        <ul className="space-y-1.5">
          {outlines.map(o => (
            <li key={o.id}>
              <Link
                to={`/pastor/sermon/outlines/${o.id}?mode=manuscript`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200/70 dark:border-white/[0.08] hover:border-brand"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] lg:text-[14.5px] font-bold text-ink-strong truncate">{o.title}</span>
                  <span className="block text-[12px] text-gray-500 dark:text-white/55">
                    {[o.passage, o.preach_on && formatDay(o.preach_on, false), o.status === 'done' ? '마친 설교' : '준비 중'].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="material-icons-outlined text-[20px] text-brand">chevron_right</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={start.isPending}
        onClick={() => start.mutate()}
        className="w-full py-3 rounded-xl bg-brand text-white text-[14px] lg:text-[15px] font-bold inline-flex items-center justify-center gap-1 disabled:opacity-40"
      >
        {outlines.length ? '이 본문으로 새 원고 시작' : '이 본문으로 원고 시작'}
        <span className="material-icons-outlined text-[18px]">arrow_forward</span>
      </button>
    </SectionCard>
  )
}

export default PastorSermonStudy
