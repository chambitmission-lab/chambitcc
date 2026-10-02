import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  compare,
  countKeystrokes,
  cpmOf,
  finalAccuracy,
  initialOf,
  isHangul,
  normalizeTyped,
  type CharState,
} from './hangulTyping'
import type { TypingMode } from '../../../api/bibleTyping'

export interface TypingFinish {
  accuracy: number
  keystrokes: number
  charCount: number
  durationMs: number
  /** 붙여넣기·자동 입력이 의심되는 한꺼번 입력이 있었다 */
  suspicious: boolean
}

interface TypingPadProps {
  /** 성경 본문 원문 — 표시는 원문 그대로(문장부호 포함), 비교는 정규화본으로 */
  text: string
  mode: TypingMode
  ignorePunct: boolean
  onFinish: (result: TypingFinish) => void
  /** 첫 글자를 친 순간(스프린트 시계 등) */
  onStart?: () => void
  autoFocus?: boolean
  disabled?: boolean
}

// 문장부호 무시일 때 표시에서 "비교 대상이 아닌" 글자
const PUNCT_CHAR = /[^0-9A-Za-zㄱ-ㆎ가-힣\s]/

interface DisplayItem {
  ch: string
  /** 정규화본에서의 위치 — null 이면 표시만 하는 글자(무시된 문장부호·겹친 공백) */
  idx: number | null
}

/**
 * 원문을 표시용 글자 목록과 비교용 정규화 문자열로 동시에 만든다.
 * 표시와 비교의 위치가 한 곳에서 정해져야 문장부호를 빼고 비교하면서도
 * 화면엔 원문(쉼표·따옴표 포함)을 그대로 보여줄 수 있다.
 */
const buildDisplay = (raw: string, ignorePunct: boolean): { target: string; items: DisplayItem[] } => {
  const items: DisplayItem[] = []
  let target = ''
  const src = raw.replace(/\s+/g, ' ').trim()
  for (const ch of src) {
    if (ch === ' ') {
      if (target.length > 0 && !target.endsWith(' ')) {
        items.push({ ch, idx: target.length })
        target += ' '
      } else {
        items.push({ ch, idx: null })
      }
    } else if (ignorePunct && PUNCT_CHAR.test(ch)) {
      items.push({ ch, idx: null })
    } else {
      items.push({ ch, idx: target.length })
      target += ch
    }
  }
  // 끝에 남은 공백(문장부호 뒤)은 비교에서 뺀다
  if (target.endsWith(' ')) {
    target = target.slice(0, -1)
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].idx === target.length) {
        items[i] = { ...items[i], idx: null }
        break
      }
    }
  }
  return { target, items }
}

// 한 번에 이만큼 넘게 늘어나면 붙여넣기·자동 입력으로 본다(예측 단어 선택은 이보다 짧다)
const BULK_INPUT_CHARS = 12

const TypingPad = ({ text, mode, ignorePunct, onFinish, onStart, autoFocus = true, disabled = false }: TypingPadProps) => {
  const { target, items } = useMemo(() => buildDisplay(text, ignorePunct), [text, ignorePunct])
  const [value, setValue] = useState('')
  const [hint, setHint] = useState(false)
  const [peek, setPeek] = useState(false)
  const [nudge, setNudge] = useState(false)
  // 실시간 타수용 시계 — 렌더 중 Date.now() 를 부르지 않도록 상태로 든다
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)
  const suspiciousRef = useRef(false)
  const finishedRef = useRef(false)
  const prevLenRef = useRef(0)
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const opts = useMemo(() => ({ ignorePunct }), [ignorePunct])
  const typed = normalizeTyped(value, opts)
  const cmp = useMemo(() => compare(target, typed), [target, typed])
  const memorize = mode === 'memorize'

  // 실시간 타수 갱신
  useEffect(() => {
    if (startedAt === null || disabled) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [startedAt, disabled])

  useEffect(() => {
    if (autoFocus && !disabled) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus, disabled])

  useEffect(() => () => {
    if (peekTimer.current) clearTimeout(peekTimer.current)
  }, [])

  const finish = useCallback(
    (raw: string) => {
      if (finishedRef.current || disabled) return
      const final = normalizeTyped(raw, opts).trimEnd()
      // 너무 일찍 Enter — 끝까지 쓰도록 살짝 알려준다
      if (final.length < target.length * 0.6) {
        setNudge(true)
        setTimeout(() => setNudge(false), 1600)
        return
      }
      finishedRef.current = true
      const startedAt = startedAtRef.current ?? Date.now()
      onFinish({
        accuracy: Math.round(finalAccuracy(target, final) * 1000) / 1000,
        keystrokes: Math.max(1, countKeystrokes(final)),
        charCount: target.length,
        durationMs: Math.max(1, Date.now() - startedAt),
        suspicious: suspiciousRef.current,
      })
    },
    [disabled, onFinish, opts, target],
  )

  const handleChange = (raw: string) => {
    if (finishedRef.current) return
    const hadBreak = /[\r\n]/.test(raw)
    const clean = raw.replace(/[\r\n]+/g, '')
    if (startedAtRef.current === null && clean.trim().length > 0) {
      const t = Date.now()
      startedAtRef.current = t
      setStartedAt(t)
      setNow(t)
      onStart?.()
    }
    const n = normalizeTyped(clean, opts)
    if (!composingRef.current && n.length - prevLenRef.current > BULK_INPUT_CHARS) suspiciousRef.current = true
    prevLenRef.current = n.length
    setValue(clean)

    // 완료 조건 — Enter, 끝에서 한 칸 띄우기, 또는 마지막 글자가 조합이 없는 글자(마침표 등)일 때 정확히 일치
    if (hadBreak) {
      finish(clean)
    } else if (n === `${target} `) {
      finish(clean)
    } else if (!composingRef.current && n === target && !isHangul(target[target.length - 1] ?? '')) {
      finish(clean)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    // 조합 중 Enter 는 글자가 확정된 뒤의 값으로 판정한다
    const el = e.currentTarget
    requestAnimationFrame(() => finish(el.value))
  }

  // 붙여넣기·끌어다 놓기 차단 (모바일 클립보드 제안 포함)
  const handleBeforeInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const ne = e.nativeEvent as InputEvent
    const type = ne.inputType ?? ''
    if (type.startsWith('insertFromPaste') || type === 'insertFromDrop' || type === 'insertFromYank') {
      e.preventDefault()
      return
    }
    // Android 키보드의 Enter 는 keydown 으로 오지 않는다(229) — 줄바꿈 입력으로 잡는다
    if (type === 'insertLineBreak' || type === 'insertParagraph') {
      e.preventDefault()
      const el = e.currentTarget
      requestAnimationFrame(() => finish(el.value))
    }
  }

  const doPeek = () => {
    setPeek(true)
    if (peekTimer.current) clearTimeout(peekTimer.current)
    peekTimer.current = setTimeout(() => setPeek(false), 2200)
    inputRef.current?.focus({ preventScroll: true })
  }

  const elapsed = startedAt !== null ? now - startedAt : 0
  const liveCpm = elapsed > 1500 ? cpmOf(countKeystrokes(typed), elapsed) : 0
  const liveAcc = cmp.judged > 0 ? Math.round((cmp.correct / cmp.judged) * 100) : 100
  const progress = target.length ? Math.min(100, Math.round((Math.min(typed.length, target.length) / target.length) * 100)) : 0
  const atEnd = typed.trimEnd().length >= target.length
  const caret = typed.length

  const glyph = (it: DisplayItem, state: CharState | null) => {
    if (!memorize || peek || it.idx === null || it.ch === ' ') return it.ch
    if (state === 'correct' || state === 'wrong') return it.ch
    return hint ? initialOf(it.ch) : '○'
  }

  return (
    <div className={`bt-pad${disabled ? ' is-disabled' : ''}`}>
      <p className={`bt-target${memorize ? ' is-memorize' : ''}${hint ? ' has-hint' : ''}`} aria-label={memorize ? '암송할 말씀(가려짐)' : text}>
        {items.map((it, i) => {
          const state = it.idx === null ? null : cmp.states[it.idx]
          const isCaret = it.idx !== null && it.idx === caret && !disabled
          return (
            <span
              key={i}
              className={[
                'bt-ch',
                it.idx === null ? 'bt-ch--skip' : `bt-ch--${state}`,
                it.ch === ' ' ? 'bt-ch--space' : '',
                isCaret ? 'bt-ch--caret' : '',
              ].join(' ')}
            >
              {glyph(it, state)}
            </span>
          )
        })}
      </p>

      <div className="bt-progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      <textarea
        ref={inputRef}
        className="bt-input"
        value={value}
        rows={2}
        disabled={disabled}
        placeholder={memorize ? '기억나는 대로 써 보세요' : '위 말씀을 따라 써 보세요'}
        aria-label="말씀 따라 쓰기 입력"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        data-gramm="false"
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onCompositionStart={() => {
          composingRef.current = true
        }}
        onCompositionEnd={(e) => {
          composingRef.current = false
          handleChange(e.currentTarget.value)
        }}
      />

      <div className="bt-live">
        <span className="bt-live__item">
          <b>{liveCpm}</b>타/분
        </span>
        <span className="bt-live__item">
          정확도 <b>{liveAcc}</b>%
        </span>
        {memorize && (
          <span className="bt-live__tools">
            <button type="button" className={`bt-chip${hint ? ' is-on' : ''}`} onClick={() => setHint((h) => !h)}>
              초성 힌트
            </button>
            <button type="button" className="bt-chip" onClick={doPeek}>
              잠깐 보기
            </button>
          </span>
        )}
        <span className={`bt-live__hint${atEnd ? ' is-ready' : ''}${nudge ? ' is-nudge' : ''}`}>
          {nudge ? '끝까지 써 주세요' : atEnd ? '띄어쓰기나 Enter로 완료' : `${Math.min(typed.length, target.length)}/${target.length}`}
        </span>
      </div>
    </div>
  )
}

export default TypingPad
