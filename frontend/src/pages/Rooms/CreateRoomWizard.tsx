// 새 묵상방 만들기 위저드 — "무엇을 읽을까 → 언제부터·얼마나 → (방으로 가서) 초대"
// 설문지형 폼 대신 추천 코스 카드로 시작한다. 이름·표식은 코스에서 자동으로 채워지고
// 나중에 바꿀 수 있다. 만들면 방으로 이동하며 초대 시트가 바로 열린다(state.fresh).
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from '../../components/common/DatePicker'
import { useBibleBooks } from '../../hooks/useBible'
import { useCreateRoom, useSplitPreview } from '../../hooks/useMeditationRoom'
import type { BibleBook } from '../../types/bible'
import { showToast } from '../../utils/toast'
import { Sheet, SheetBody, SheetFooter, SectionLabel } from './RoomBits'
import { CheckIcon, RoomGlyph } from './RoomIcons'
import {
  DURATION_PRESETS,
  EMOJI_PRESETS,
  ROOM_COURSES,
  courseRangeLabel,
  formatMd,
  parseYmd,
  toYmd,
  type RoomCourse,
} from './roomCourses'

type Step = 'pick' | 'custom' | 'when'

interface Draft {
  title: string
  emoji: string
  book_number: number
  book_name: string
  chapter_start: number
  chapter_end: number
  days: number
}

const nextSunday = () => {
  const d = new Date()
  const diff = (7 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d
}

const CreateRoomWizard = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const createRoom = useCreateRoom()
  const { data: books } = useBibleBooks()

  const [step, setStep] = useState<Step>('pick')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [startDate, setStartDate] = useState<string>(toYmd(new Date()))

  const chooseCourse = (c: RoomCourse) => {
    setDraft({
      title: c.title,
      emoji: c.emoji,
      book_number: c.book_number,
      book_name: c.book_name,
      chapter_start: c.chapter_start,
      chapter_end: c.chapter_end,
      days: c.days,
    })
    setStep('when')
  }

  const handleCreate = async () => {
    if (!draft) return
    const title = draft.title.trim()
    if (!title) {
      showToast('방 이름을 입력해주세요', 'error')
      return
    }
    try {
      const room = await createRoom.mutateAsync({
        title,
        emoji: draft.emoji,
        book_number: draft.book_number,
        chapter_start: draft.chapter_start,
        chapter_end: Math.max(draft.chapter_start, draft.chapter_end),
        total_days: draft.days,
        start_date: startDate,
      })
      onClose()
      navigate(`/rooms/${room.id}`, { state: { fresh: true } })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '방 만들기에 실패했습니다', 'error')
    }
  }

  return (
    <Sheet onClose={onClose} tall wide ariaLabel="새 묵상방 만들기">
      {/* 단계 표시 */}
      <div className="shrink-0 px-5 pt-2 pb-1 flex items-center gap-2">
        {step !== 'pick' ? (
          <button
            type="button"
            onClick={() => setStep(step === 'when' && draft && !isCourseDraft(draft) ? 'custom' : 'pick')}
            className="p-1 -ml-1 text-gray-500 dark:text-white/60"
            aria-label="이전"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          {(['pick', 'when', 'invite'] as const).map((s, i) => {
            const active = (s === 'pick' && (step === 'pick' || step === 'custom')) || s === step
            const done = s === 'pick' && step === 'when'
            return (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  active ? 'w-6 bg-brand' : done ? 'w-3 bg-brand/50' : 'w-3 bg-gray-200 dark:bg-white/15'
                }`}
                aria-label={`${i + 1}단계`}
              />
            )
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-1 text-gray-400 dark:text-white/40"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {step === 'pick' && (
        <PickStep onCourse={chooseCourse} onCustom={() => setStep('custom')} />
      )}
      {step === 'custom' && (
        <CustomStep
          books={books ?? []}
          initial={draft}
          onNext={(d) => {
            setDraft(d)
            setStep('when')
          }}
        />
      )}
      {step === 'when' && draft && (
        <WhenStep
          draft={draft}
          setDraft={setDraft}
          startDate={startDate}
          setStartDate={setStartDate}
          onCreate={handleCreate}
          creating={createRoom.isPending}
        />
      )}
    </Sheet>
  )
}

const isCourseDraft = (d: Draft) =>
  ROOM_COURSES.some(
    (c) =>
      c.book_number === d.book_number &&
      c.chapter_start === d.chapter_start &&
      c.chapter_end === d.chapter_end &&
      c.title === d.title,
  )

// ── 1단계: 무엇을 읽을까 ──
const PickStep = ({ onCourse, onCustom }: { onCourse: (c: RoomCourse) => void; onCustom: () => void }) => (
  <>
    <SheetBody className="pt-2">
      <h3 className="text-[21px] font-bold tracking-[-0.02em] text-ink-strong">무엇을 함께 읽을까요?</h3>
      <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 leading-[1.6]">
        처음이라면 코스에서 고르는 게 가장 쉬워요. 이름과 기간은 다음 단계에서 바꿀 수 있어요.
      </p>
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {ROOM_COURSES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCourse(c)}
            className="text-left p-3.5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm hover:border-[var(--brand-soft-strong)] hover:-translate-y-0.5 active:scale-[0.985] transition-all"
          >
            <span className="inline-flex w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-brand items-center justify-center">
              <RoomGlyph emoji={c.emoji} size={19} />
            </span>
            <p className="text-[14px] font-bold text-ink-strong mt-2.5 leading-[1.3] break-keep">{c.title}</p>
            <p className="text-[11.5px] text-gray-500 dark:text-white/55 mt-1 leading-[1.5] break-keep">{c.tagline}</p>
            <p className="text-[11px] font-semibold text-brand mt-2">{courseRangeLabel(c)}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={onCustom}
          className="text-left p-3.5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-brand/60 active:scale-[0.985] transition-all"
        >
          <span className="inline-flex w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/60 items-center justify-center text-[20px] font-bold leading-none">
            +
          </span>
          <p className="text-[14px] font-bold text-ink-strong mt-2.5">직접 고르기</p>
          <p className="text-[11.5px] text-gray-500 dark:text-white/55 mt-1 leading-[1.5]">
            66권 어디든, 원하는 장 범위로
          </p>
        </button>
      </div>
    </SheetBody>
  </>
)

// ── 1-b단계: 직접 고르기 (책 → 장 범위) ──
const CustomStep = ({
  books,
  initial,
  onNext,
}: {
  books: BibleBook[]
  initial: Draft | null
  onNext: (d: Draft) => void
}) => {
  const [testament, setTestament] = useState<'OLD' | 'NEW'>(
    initial && initial.book_number >= 40 ? 'NEW' : 'OLD',
  )
  const [bookNumber, setBookNumber] = useState(initial?.book_number ?? 0)
  const [start, setStart] = useState(initial?.chapter_start ?? 0)
  const [end, setEnd] = useState(initial?.chapter_end ?? 0)

  const book = books.find((b) => b.book_number === bookNumber)
  const chapters = book?.chapter_count ?? 0

  const tapChapter = (c: number) => {
    // 첫 탭 = 시작, 두 번째 탭 = 끝(시작보다 앞이면 새 시작), 같은 걸 다시 = 한 장만
    if (!start || (start && end && start !== end)) {
      setStart(c)
      setEnd(c)
      return
    }
    if (c < start) {
      setStart(c)
      setEnd(c)
      return
    }
    setEnd(c)
  }

  const rangeLabel =
    book && start
      ? `${book.book_name_ko} ${start === end ? `${start}장` : `${start}–${end}장`}`
      : '책과 장을 골라주세요'

  return (
    <>
      <SheetBody className="pt-2">
        <h3 className="text-[21px] font-bold tracking-[-0.02em] text-ink-strong">직접 고르기</h3>
        <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 leading-[1.6]">
          책을 고르고, 시작 장과 끝 장을 차례로 눌러요.
        </p>

        <div className="flex gap-1.5 mt-4">
          {(['OLD', 'NEW'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTestament(t)}
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold transition-all ${
                testament === t
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {t === 'OLD' ? '구약' : '신약'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {books
            .filter((b) => b.testament === testament)
            .map((b) => (
              <button
                key={b.book_number}
                type="button"
                onClick={() => {
                  setBookNumber(b.book_number)
                  setStart(0)
                  setEnd(0)
                }}
                className={`py-2 rounded-xl text-[12.5px] font-semibold truncate px-1 transition-all ${
                  bookNumber === b.book_number
                    ? 'bg-brand text-white'
                    : 'bg-gray-50 dark:bg-white/[0.05] text-gray-700 dark:text-white/75'
                }`}
              >
                {b.book_name_ko}
              </button>
            ))}
        </div>

        {book && (
          <div className="mt-5">
            <SectionLabel>
              {book.book_name_ko} · {chapters}장 중에서
            </SectionLabel>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: chapters }, (_, i) => i + 1).map((c) => {
                const inRange = start && c >= start && c <= end
                const edge = c === start || c === end
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => tapChapter(c)}
                    className={`h-9 rounded-lg text-[12.5px] font-bold tabular-nums transition-all ${
                      edge
                        ? 'bg-brand text-white'
                        : inRange
                          ? 'bg-[var(--brand-soft)] text-brand'
                          : 'bg-gray-50 dark:bg-white/[0.05] text-gray-600 dark:text-white/65'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </SheetBody>
      <SheetFooter>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold text-ink-strong truncate">{rangeLabel}</p>
          <button
            type="button"
            disabled={!book || !start}
            onClick={() =>
              book &&
              onNext({
                title: `함께 읽는 ${book.book_name_ko}`,
                emoji: initial?.emoji ?? '🕊️',
                book_number: book.book_number,
                book_name: book.book_name_ko,
                chapter_start: start,
                chapter_end: Math.max(start, end),
                days: Math.min(31, Math.max(3, Math.max(start, end) - start + 1)),
              })
            }
            className="shrink-0 px-5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-40"
          >
            다음
          </button>
        </div>
      </SheetFooter>
    </>
  )
}

// ── 2단계: 언제부터, 얼마나 ──
const WhenStep = ({
  draft,
  setDraft,
  startDate,
  setStartDate,
  onCreate,
  creating,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  startDate: string
  setStartDate: (s: string) => void
  onCreate: () => void
  creating: boolean
}) => {
  const todayYmd = toYmd(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const quick = [
    { label: '오늘', ymd: todayYmd },
    { label: '내일', ymd: toYmd(tomorrow) },
    { label: '이번 주일', ymd: toYmd(nextSunday()) },
  ]
  const isQuick = quick.some((q) => q.ymd === startDate)

  const preview = useSplitPreview({
    book_number: draft.book_number,
    chapter_start: draft.chapter_start,
    chapter_end: draft.chapter_end,
    total_days: draft.days,
  })
  // 절 수보다 기간이 길면 백엔드가 줄인다 — 줄어든 날수를 곧바로 반영해 놀라지 않게
  useEffect(() => {
    if (preview.data && preview.data.total_days !== draft.days && preview.data.total_days < draft.days) {
      setDraft({ ...draft, days: preview.data.total_days })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.data])

  const endDate = useMemo(() => {
    const d = parseYmd(startDate)
    d.setDate(d.getDate() + draft.days - 1)
    return toYmd(d)
  }, [startDate, draft.days])

  return (
    <>
      <SheetBody className="pt-2">
        <h3 className="text-[21px] font-bold tracking-[-0.02em] text-ink-strong">언제부터, 얼마나?</h3>
        <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1 leading-[1.6]">
          <b className="text-ink-strong">{draft.book_name}{' '}
          {draft.chapter_start === draft.chapter_end
            ? `${draft.chapter_start}장`
            : `${draft.chapter_start}–${draft.chapter_end}장`}</b>
          을 며칠에 나눠 읽을지 정해요. 본문은 절 단위로 고르게 나눠드려요.
        </p>

        {/* 기간 */}
        <div className="mt-5">
          <SectionLabel>기간</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDraft({ ...draft, days: d })}
                className={`px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ${
                  draft.days === d
                    ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
                }`}
              >
                {d}일
              </button>
            ))}
            {!DURATION_PRESETS.includes(draft.days) && (
              <span className="px-3.5 py-2 rounded-full text-[13px] font-bold bg-brand text-white">
                {draft.days}일
              </span>
            )}
          </div>
          {/* 분량 미리보기 — 구버전 백엔드면 조용히 생략 */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[var(--brand-soft)]">
            {preview.data ? (
              <>
                <p className="text-[13.5px] font-bold text-brand">
                  하루 약 {Math.round(preview.data.avg_verses_per_day)}절 · 약 {preview.data.est_minutes_per_day}분
                </p>
                <p className="text-[12px] text-gray-600 dark:text-white/65 mt-1 leading-[1.6]">
                  {preview.data.sample_titles.slice(0, 3).map((t, i) => `${i + 1}일차 ${t}`).join(' · ')}
                  {preview.data.total_days > 3 ? ' …' : ''}
                </p>
              </>
            ) : preview.isLoading ? (
              <p className="text-[12.5px] text-gray-500 dark:text-white/55">분량을 계산하고 있어요…</p>
            ) : (
              <p className="text-[12.5px] text-gray-500 dark:text-white/55">
                총 {draft.chapter_end - draft.chapter_start + 1}장을 {draft.days}일에 나눠 읽어요
              </p>
            )}
          </div>
        </div>

        {/* 시작일 */}
        <div className="mt-5">
          <SectionLabel>시작일</SectionLabel>
          <div className="flex gap-2 flex-wrap items-center">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setStartDate(q.ymd)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ${
                  startDate === q.ymd
                    ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                    : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
                }`}
              >
                {q.label}
              </button>
            ))}
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              minDate={todayYmd}
              placeholder="날짜 선택"
              className={`!rounded-full !py-2 !px-3.5 !text-[13px] !font-bold ${
                !isQuick ? '!bg-brand !text-white !border-transparent' : ''
              }`}
            />
          </div>
          <p className="text-[12px] text-gray-500 dark:text-white/50 mt-2">
            {formatMd(startDate)} 시작 → {formatMd(endDate)} 마침
          </p>
        </div>

        {/* 이름·표식 */}
        <div className="mt-5">
          <SectionLabel>방 이름</SectionLabel>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] font-semibold focus:outline-none focus:border-brand"
          />
          <div className="flex gap-2 mt-2.5">
            {EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setDraft({ ...draft, emoji: e })}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  draft.emoji === e
                    ? 'bg-[var(--brand-soft)] ring-2 ring-[var(--brand-soft-strong)] text-brand scale-105'
                    : 'bg-gray-50 dark:bg-white/[0.05] text-gray-500 dark:text-white/60'
                }`}
                aria-label={e}
              >
                <RoomGlyph emoji={e} size={18} />
              </button>
            ))}
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <button
          type="button"
          onClick={onCreate}
          disabled={creating || !draft.title.trim()}
          className="relative w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold seal-chip [--seal-radius:1rem] disabled:opacity-50 active:scale-[0.985] transition-transform"
        >
          {creating ? '만드는 중...' : (
            <span className="inline-flex items-center gap-1.5">
              <CheckIcon size={13} /> 방 만들고 초대하기
            </span>
          )}
        </button>
      </SheetFooter>
    </>
  )
}

export default CreateRoomWizard
