import { useState } from 'react'
import './ReadAgainCard.css'
import { genreStyle } from '../../../components/bible/bookGenre'
import type { ReadingEcho, ReadingEchoTrace } from '../../../api/bibleReading'
import { useReadingCycleEcho, useReadingCycles, useSetReadingLens } from '../../../hooks/useBibleReading'
import { safeStorage } from '../../../utils/safeStorage'
import { showToast } from '../../../utils/toast'
import { READING_LENSES, defaultLensFor, lensQuestion, resolveLens, type ReadingLensId } from '../data/readingLenses'
import { formatMonthDay } from '../../../utils/date'

// 펼침 상태 — 질문은 한 줄에 이미 보이므로 기본은 접힘. 펼치면 지난 회차의 흔적·렌즈 고르기
const OPEN_KEY = 'bible-readagain-open'
// 흔적 목록은 처음엔 이만큼만 — 나머지는 '더 보기'
const TRACE_PREVIEW = 3

interface ReadAgainCardProps {
  bookNumber: number
  chapter: number
  /** 로그인했을 때만 — 회차는 개인 기록이다 */
  enabled: boolean
  /** 한 줄 위 작은 머리글 (장 끝: "다 읽으셨나요? 이번 회차 질문") */
  kicker?: string
}

const fmtDate = (iso: string): string => formatMonthDay(iso, { year: 'auto' })

const TRACE_LABEL: Record<ReadingEchoTrace['kind'], string> = {
  note: '메모',
  reflection: '나눈 묵상',
  word: '단어 노트',
  highlight: '형광펜',
  favorite: '즐겨찾기',
}

const TRACE_ICON: Partial<Record<ReadingEchoTrace['kind'], string>> = {
  note: 'edit_note',
  reflection: 'forum',
  word: 'sell',
  favorite: 'favorite',
}

const TraceRow = ({ trace }: { trace: ReadingEchoTrace }) => {
  const icon = TRACE_ICON[trace.kind]
  return (
    <li className="ra-trace">
      <span className="ra-trace__icon" aria-hidden>
        {icon ? (
          <span className="material-icons-round">{icon}</span>
        ) : (
          <span className="ra-trace__dot" style={{ background: `var(--hl-${trace.color ?? 'yellow'})` }} />
        )}
      </span>
      <span className="ra-trace__body">
        <span className="ra-trace__meta">
          <b>{trace.verse}절</b> · {TRACE_LABEL[trace.kind]}
          {trace.kind === 'word' && trace.word ? ` ‘${trace.word}’` : ''}
          <span className="ra-trace__when"> · {trace.cycle_no}독 때 {fmtDate(trace.at)}</span>
        </span>
        {trace.text && <span className="ra-trace__text">{trace.text}</span>}
      </span>
    </li>
  )
}

/** '지난 회차의 나' 한 줄 + 펼치는 흔적 목록. 한 줄 자리는 불러오는 동안에도 비워 둬 카드가 흔들리지 않는다 */
const EchoSection = ({ echo, pending, cycleNo }: { echo: ReadingEcho | undefined; pending: boolean; cycleNo: number }) => {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  if (pending) {
    return (
      <div className="ra-echo" aria-hidden>
        <p className="ra-echo__label">지난 회차의 나</p>
        <span className="ra-echo__line ra-echo__line--skel" />
      </div>
    )
  }
  if (!echo) return null

  const last = echo.past_reads[echo.past_reads.length - 1]
  const traces = echo.traces
  if (!last && traces.length === 0) return null
  const shown = showAll ? traces : traces.slice(0, TRACE_PREVIEW)

  return (
    <div className="ra-echo">
      <p className="ra-echo__label">지난 회차의 나</p>
      <p className="ra-echo__line">
        {last ? (
          <>
            {last.cycle_no}독 때 <b>{fmtDate(last.read_at)}</b>에 이 장을 읽으셨어요.
            {echo.past_reads.length > 1 ? ` 오늘이 이 장을 ${cycleNo}번째 만나는 날이에요.` : ''}
          </>
        ) : (
          '지난 회차에 이 장에 남긴 흔적이 있어요.'
        )}
      </p>
      {traces.length > 0 && (
        <>
          <button type="button" className="ra-echo__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span className="material-icons-round" aria-hidden>history</span>
            그때 남긴 흔적 {traces.length}개
            <span className={`material-icons-round ra-echo__chev${open ? ' is-open' : ''}`} aria-hidden>expand_more</span>
          </button>
          {open && (
            <>
              <ul className="ra-traces">
                {shown.map((t, i) => (
                  <TraceRow key={`${t.kind}-${t.verse}-${i}`} trace={t} />
                ))}
              </ul>
              {!showAll && traces.length > TRACE_PREVIEW && (
                <button type="button" className="ra-echo__more" onClick={() => setShowAll(true)}>
                  {traces.length - TRACE_PREVIEW}개 더 보기
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * 다시 읽는 길 — 2독부터 장 끝(VerseList, 다 읽은 뒤)에 놓이는 이번 회차 질문 한 줄.
 * 읽기 전에 숙제처럼 주지 않고, 읽고 나서 돌아보는 질문으로 (BibleProject 방식).
 *
 * ① 이번 회차의 렌즈(그리스도를 찾아서 등)로 이 장에 맞는 질문 하나를 준다.
 * ② 지난 회차에 이 장을 언제 읽었는지, 그때 남긴 메모·묵상·형광펜을 다시 보여 준다.
 * 한 줄에 렌즈와 질문을 다 보이고, 펼치면 ②와 렌즈 고르기. 1독 중이거나 로그인 전이면 렌더하지 않는다.
 */
const ReadAgainCard = ({ bookNumber, chapter, enabled, kicker }: ReadAgainCardProps) => {
  const { data: cycles } = useReadingCycles(enabled)
  const cycleNo = cycles?.current_cycle ?? 1
  const active = enabled && cycleNo >= 2
  const { data: echo, isPending: echoPending } = useReadingCycleEcho(bookNumber, chapter, active)
  const setLens = useSetReadingLens()
  const [open, setOpen] = useState(() => safeStorage.get(OPEN_KEY) === '1')
  const [picking, setPicking] = useState(false)

  if (!active || !cycles) return null

  const savedLens = cycles.cycles.find((c) => c.cycle_no === cycleNo)?.lens ?? null
  const lens = resolveLens(cycleNo, savedLens)
  const question = lensQuestion(lens.id, bookNumber, chapter)

  const toggleOpen = () => {
    setOpen((prev) => {
      safeStorage.set(OPEN_KEY, prev ? '0' : '1')
      return !prev
    })
    setPicking(false)
  }

  const pickLens = (id: ReadingLensId) => {
    setPicking(false)
    if (id === lens.id) return
    // 회차 기본값을 고르면 저장값을 비운다 — 나중에 기본 렌즈가 바뀌어도 따라가게
    const value = id === defaultLensFor(cycleNo) ? null : id
    setLens.mutate(value, {
      onError: () => showToast('렌즈를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.', 'error'),
    })
  }

  return (
    <div style={genreStyle(bookNumber)} className={kicker ? 'ra-wrap--end' : undefined}>
      {kicker && <p className="ra-kicker">{kicker}</p>}
      <section className={`ra-card${open ? ' is-open' : ''}`} aria-label={`${cycleNo}독 다시 읽는 길`}>
        <button type="button" className="ra-head" onClick={toggleOpen} aria-expanded={open}>
          <span className="material-icons-round ra-head__icon" aria-hidden>{lens.icon}</span>
          <span className="ra-head__body">
            <b className="ra-head__title">
              {cycleNo}독 · {lens.name}
            </b>
            <span className="ra-head__question"> — {question}</span>
          </span>
          <span className={`material-icons-round ra-head__chev${open ? ' is-open' : ''}`} aria-hidden>
            expand_more
          </span>
        </button>

        {open && (
          <div className="ra-content">
            <EchoSection key={`${bookNumber}-${chapter}`} echo={echo} pending={echoPending} cycleNo={cycleNo} />

            <div className="ra-lens">
              <button
                type="button"
                className="ra-lens__toggle"
                aria-expanded={picking}
                onClick={() => setPicking((v) => !v)}
                disabled={setLens.isPending}
              >
                <span className="material-icons-round" aria-hidden>tune</span>
                다른 렌즈로 읽기
              </button>
              {picking && (
                <ul className="ra-lens__list" role="listbox" aria-label="읽기 렌즈">
                  {READING_LENSES.map((l) => {
                    const selected = l.id === lens.id
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`ra-lens__opt${selected ? ' is-selected' : ''}`}
                          onClick={() => pickLens(l.id)}
                        >
                          <span className="material-icons-round ra-lens__icon" aria-hidden>{l.icon}</span>
                          <span className="ra-lens__text">
                            <span className="ra-lens__name">
                              {l.name}
                              {l.id === defaultLensFor(cycleNo) && <span className="ra-lens__tag">{cycleNo}독 추천</span>}
                            </span>
                            <span className="ra-lens__sum">{l.summary}</span>
                          </span>
                          {selected && <span className="material-icons-round ra-lens__check" aria-hidden>check</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ReadAgainCard
