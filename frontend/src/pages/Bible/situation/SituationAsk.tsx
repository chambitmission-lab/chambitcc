import { useEffect, useRef, useState } from 'react'
import { useSituationVerses } from '../../../hooks/useSituation'
import type { SituationCategory, SituationVerse } from '../../../types/situation'
import {
  ASK_PLACEHOLDERS,
  ASK_STARTERS,
  empathyFor,
  matchSituation,
  toneForCategory,
} from './situationMoods'

// 고르기 어려울 때 — 한 문장으로 꺼내면 공감 한 줄 + 말씀 한 절로 답한다.
// AI 없이 규칙(situationMoods.matchSituation)으로만 고른다. 입력 문장은 어디에도 저장하지 않는다.
const THINK_MS = 700

interface Props {
  categories: SituationCategory[]
  /** '말씀 더 보기' — 몰입 화면을 2번째 절부터 */
  onMore: (cat: SituationCategory, sentence: string, from: number) => void
  onPray: (verse: SituationVerse, sentence: string) => void
  onShare: (verse: SituationVerse) => void
  onRead: (verse: SituationVerse) => void
}

interface Asked {
  sentence: string
  category: SituationCategory
  guessed: boolean
}

const SituationAsk = ({ categories, onMore, onPray, onShare, onRead }: Props) => {
  const [value, setValue] = useState('')
  const [asked, setAsked] = useState<Asked | null>(null)
  const [thinking, setThinking] = useState(false)
  const [ph, setPh] = useState(0)
  const replyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 입력창 예시 문장이 천천히 바뀐다 — 무엇을 쓰면 되는지 보여 주는 용도
  useEffect(() => {
    if (value) return
    const t = window.setInterval(() => setPh((p) => (p + 1) % ASK_PLACEHOLDERS.length), 2800)
    return () => window.clearInterval(t)
  }, [value])

  const { data } = useSituationVerses(asked?.category.id ?? 0, !!asked)
  const verse = data?.verses[0]

  useEffect(() => {
    if (!thinking) return
    const t = window.setTimeout(() => setThinking(false), THINK_MS)
    return () => window.clearTimeout(t)
  }, [thinking])

  useEffect(() => {
    if (asked && !thinking) replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [asked, thinking])

  const ask = (raw: string) => {
    const sentence = raw.trim()
    if (!sentence) return
    const m = matchSituation(sentence, categories)
    if (!m) return
    setAsked({ sentence, category: m.category, guessed: m.hits === 0 })
    setThinking(true)
    setValue('')
  }

  return (
    <section className="sb-ask" aria-label="말로 꺼내기">
      <div className="sb-ask__head">
        <span className="sb-ask__lamp" aria-hidden="true">
          <span className="material-icons-round">edit_note</span>
        </span>
        <div>
          <h2>고르기 어렵다면, 한 문장으로 말해 주세요</h2>
          <p>지금 마음에 닿는 말씀을 찾아 드릴게요. 쓴 내용은 저장되지 않아요.</p>
        </div>
      </div>

      <form
        className="sb-ask__box"
        onSubmit={(e) => {
          e.preventDefault()
          ask(value)
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={ASK_PLACEHOLDERS[ph]}
          maxLength={120}
          enterKeyHint="send"
          aria-label="지금 마음을 한 문장으로"
        />
        <button type="submit" className="sb-ask__send" disabled={!value.trim()} aria-label="말씀 찾기">
          <span className="material-icons-round">arrow_upward</span>
        </button>
      </form>

      {!asked && (
        <div className="sb-ask__starters">
          {ASK_STARTERS.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {asked && (
        <div className="sb-ask__thread" ref={replyRef} aria-live="polite">
          <p className="sb-ask__me">{asked.sentence}</p>
          {thinking || !verse ? (
            <div className="sb-ask__typing" aria-label="말씀을 찾는 중">
              <i />
              <i />
              <i />
            </div>
          ) : (
            <div className="sb-ask__reply" key={`${asked.sentence}-${asked.category.id}`}>
              <p className="sb-ask__empathy">
                {asked.guessed
                  ? '그 마음, 말씀 앞에 그대로 가져와도 괜찮아요.'
                  : verse.message?.trim() || empathyFor(asked.category.name)}
              </p>
              <div className={`sb-ask__verse sb-tone--${toneForCategory(asked.category.name)}`}>
                <button type="button" className="sb-ask__verse-text" onClick={() => onRead(verse)}>
                  {verse.text}
                </button>
                <div className="sb-ask__verse-foot">
                  <span>
                    {verse.book_name_ko} {verse.chapter}:{verse.verse}
                  </span>
                  <span className="sb-ask__verse-acts">
                    <button type="button" onClick={() => onShare(verse)} aria-label="보내기">
                      <span className="material-icons-round">ios_share</span>
                    </button>
                    <button type="button" onClick={() => onRead(verse)} aria-label="본문 보기">
                      <span className="material-icons-round">menu_book</span>
                    </button>
                  </span>
                </div>
              </div>
              <div className="sb-ask__follow">
                {(data?.verses.length ?? 0) > 1 && (
                  <button
                    type="button"
                    className="is-primary"
                    onClick={() => onMore(asked.category, asked.sentence, 1)}
                  >
                    말씀 더 보기
                  </button>
                )}
                <button type="button" className="is-primary" onClick={() => onPray(verse, asked.sentence)}>
                  이 마음으로 기도하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAsked(null)
                    inputRef.current?.focus()
                  }}
                >
                  다시 말하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default SituationAsk
