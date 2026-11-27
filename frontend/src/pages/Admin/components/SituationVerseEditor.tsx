// 상황별 성구 — 카테고리 상세 안의 구절 편집(2026-11-27)
//
// 예전엔 '구절' 버튼으로 따로 모달을 열고 책번호(숫자)·장·절 칸 셋에 입력했다. 책번호를 외워야 했다.
// 이제 상세 화면 안에서 "시편 23:1" / "시 23:1-3" 처럼 평소 쓰는 대로 한 줄로 쓰면 바로 풀어 보여 주고,
// 범위면 한 절씩 차례로 넣는다. 데이터는 부르는 쪽이 쥔다(실제 화면 = 훅, dev 미리보기 = 표본).
import { useState, type ReactNode } from 'react'
import type { SituationVerse } from '../../../types/situation'
import { parseBibleReference } from '../../Sermon/utils/sermonMeta'

export interface VerseRef {
  book_number: number
  chapter: number
  verse: number
}

/** 한 번에 넣을 수 있는 절 — 범위를 크게 잘못 쓰는 실수를 막는다 */
const MAX_RANGE = 10

const parseInput = (raw: string): { refs: VerseRef[]; label: string } | { error: string } | null => {
  if (!raw.trim()) return null
  const p = parseBibleReference(raw)
  if (!p) return { error: '"책 장:절" 꼴로 써 주세요 — 예) 시편 23:1' }
  if (!p.bookNumber) return { error: `"${p.book}" — 모르는 책 이름이에요` }
  if (p.verse == null) return { error: '절까지 써 주세요 — 예) 시편 23:1' }
  const end = p.verseEnd && p.verseEnd > p.verse ? p.verseEnd : p.verse
  if (end - p.verse + 1 > MAX_RANGE) return { error: `한 번에 ${MAX_RANGE}절까지만 넣을 수 있어요` }
  const refs: VerseRef[] = []
  for (let v = p.verse; v <= end; v++) refs.push({ book_number: p.bookNumber, chapter: p.chapter, verse: v })
  return { refs, label: `${p.book} ${p.chapter}:${p.verse}${end > p.verse ? `–${end}` : ''}` }
}

const I = ({ d, size = 16 }: { d: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  msg: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
}

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-brand transition-colors'

export interface SituationVerseEditorProps {
  verses: SituationVerse[]
  loading: boolean
  adding: boolean
  onAdd: (refs: VerseRef[], message: string) => Promise<boolean>
  onSaveMessage: (v: SituationVerse, message: string) => Promise<boolean>
  onRemove: (v: SituationVerse) => void
}

const SituationVerseEditor = ({ verses, loading, adding, onAdd, onSaveMessage, onRemove }: SituationVerseEditorProps) => {
  const [ref, setRef] = useState('')
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  const parsed = parseInput(ref)
  const ok = parsed && 'refs' in parsed ? parsed : null

  const submit = async () => {
    if (!ok || adding) return
    if (await onAdd(ok.refs, msg.trim())) {
      setRef('')
      setMsg('')
    }
  }

  return (
    <section>
      <h3 className="mb-2.5 text-[13px] font-bold text-gray-500 dark:text-white/55">
        구절 <span className="tabular-nums text-ink-strong">{verses.length}</span> · 추천할 때 이 중 3개를 골라 보여 줘요
      </h3>

      {/* 추가 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] p-3.5 space-y-2"
      >
        <div className="flex gap-2">
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="예) 시편 23:1 · 시 46:1-3" className={inputCls} aria-label="성경 구절" />
          <button
            type="submit"
            disabled={!ok || adding}
            className="shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold disabled:opacity-40 transition"
          >
            <I d={IC.plus} size={16} />
            {ok && ok.refs.length > 1 ? `${ok.refs.length}절 넣기` : '넣기'}
          </button>
        </div>
        {parsed && (
          <p className={`px-1 text-[13px] font-semibold ${'error' in parsed ? 'text-amber-700 dark:text-amber-300' : 'text-brand'}`}>
            {'error' in parsed ? parsed.error : `✓ ${parsed.label}${parsed.refs.length > 1 ? ` — ${parsed.refs.length}절을 차례로 넣어요` : ''}`}
          </p>
        )}
        <input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} placeholder="위로 한마디 (선택) — 기도 묵상 추천에 구절과 함께 보여요" className={inputCls} aria-label="위로 메시지" />
      </form>

      {/* 목록 */}
      <div className="mt-3 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : verses.length === 0 ? (
          <p className="px-4 py-10 text-center text-[14px] text-gray-500 dark:text-white/55 break-keep">아직 구절이 없어요. 위에 구절을 써서 넣어 주세요.</p>
        ) : (
          verses.map((v, i) => (
            <div key={v.id} className="group px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 pt-0.5 text-[13px] font-bold tabular-nums text-gray-400 dark:text-white/35">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-brand">
                    {v.book_name_ko} {v.chapter}:{v.verse}
                  </p>
                  <p className="mt-0.5 text-[15px] leading-[1.7] text-gray-800 dark:text-white/85 break-keep">{v.text}</p>
                  {editingId !== v.id &&
                    (v.message ? (
                      <p className="mt-2 inline-block rounded-xl rounded-tl-sm bg-[var(--brand-soft)] px-3 py-1.5 text-[13.5px] leading-[1.55] text-gray-700 dark:text-white/75 break-keep">{v.message}</p>
                    ) : null)}
                </div>
                <div className="shrink-0 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(editingId === v.id ? null : v.id)
                      setDraft(v.message ?? '')
                    }}
                    title={v.message ? '위로 한마디 고치기' : '위로 한마디 달기'}
                    aria-label="위로 한마디"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${v.message ? 'text-brand' : 'text-gray-400 dark:text-white/40'} hover:bg-[var(--brand-soft)]`}
                  >
                    <I d={IC.msg} size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(v)}
                    title="이 카테고리에서 빼기"
                    aria-label="빼기"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                  >
                    <I d={IC.trash} size={16} />
                  </button>
                </div>
              </div>
              {editingId === v.id && (
                <div className="mt-2.5 ml-9 space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    maxLength={500}
                    autoFocus
                    placeholder="이 구절과 함께 보여 줄 위로 한마디"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-[14.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:border-brand resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (await onSaveMessage(v, draft.trim())) setEditingId(null)
                      }}
                      className="inline-flex items-center gap-1 h-9 px-3.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold transition"
                    >
                      <I d={IC.check} size={15} />
                      저장
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="h-9 px-3.5 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition">
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default SituationVerseEditor
