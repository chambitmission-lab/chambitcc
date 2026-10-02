import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { compare, countKeystrokes, cpmOf, finalAccuracy, initialOf, isHangul, normalizeTyped, type CharState } from './hangulTyping'
import type { TypingMode } from '../../../api/bibleTyping'
import { useMediaQuery } from '../../../hooks/useMediaQuery'

export interface TypingFinish {
  accuracy: number
  keystrokes: number
  charCount: number
  durationMs: number
  /** 붙여넣기·자동 입력이 의심되는 한꺼번 입력이 있었다 */
  suspicious: boolean
  /** 이 절에서 가장 길게 이어 간 연속 정확 글자 수 */
  maxCombo: number
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

// 연속 정확 글자 수 — 맨 끝(지금 치는 자리)에서 거슬러 올라가며 센다.
// 조합 중인 마지막 글자(pending)는 건너뛰고, 틀린 글자를 만나면 멈춘다.
const tailCombo = (states: CharState[], upto: number): number => {
  let n = 0
  for (let i = Math.min(upto, states.length) - 1; i >= 0; i--) {
    const st = states[i]
    if (st === 'pending') continue
    if (st !== 'correct') break
    n++
  }
  return n
}

// 콤보 칩을 띄우는 최소 글자 수, 반짝 튀는 단위
const COMBO_SHOW = 5
const COMBO_STEP = 10
// 이만큼 쉬면 커서가 깜빡이기 시작한다(치는 동안엔 또렷하게)
const CARET_IDLE_MS = 650

// 겹쳐 쓰기에서 막는 이동 키 — 보이지 않는 입력칸의 커서가 중간으로 가면 안 된다
const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])

// 한 번에 이만큼 넘게 늘어나면 붙여넣기·자동 입력으로 본다(예측 단어 선택은 이보다 짧다)
const BULK_INPUT_CHARS = 12

const TypingPad = ({ text, mode, ignorePunct, onFinish, onStart, autoFocus = true, disabled = false }: TypingPadProps) => {
  const { target, items } = useMemo(() => buildDisplay(text, ignorePunct), [text, ignorePunct])
  const [value, setValue] = useState('')
  const [hint, setHint] = useState(false)
  const [peek, setPeek] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [focused, setFocused] = useState(false)
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
  const targetRef = useRef<HTMLParagraphElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const caretIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxComboRef = useRef(0)

  const opts = useMemo(() => ({ ignorePunct }), [ignorePunct])
  const typed = normalizeTyped(value, opts)
  const cmp = useMemo(() => compare(target, typed), [target, typed])
  const memorize = mode === 'memorize'
  // PC 는 말씀 위에 바로 겹쳐 쓴다(물리 키보드라 보이는 입력칸이 필요 없다).
  // 모바일은 화면 키보드·자동완성 때문에 진짜 입력칸을 아래에 둔다
  const inline = useMediaQuery('(min-width: 1024px)')
  const combo = tailCombo(cmp.states, typed.length)

  // 실시간 타수 갱신
  useEffect(() => {
    if (startedAt === null || disabled) return
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [startedAt, disabled])

  useEffect(() => {
    if (autoFocus && !disabled) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus, disabled])

  useEffect(
    () => () => {
      if (peekTimer.current) clearTimeout(peekTimer.current)
      if (caretIdleTimer.current) clearTimeout(caretIdleTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (combo > maxComboRef.current) maxComboRef.current = combo
  }, [combo])

  // 미끄러지는 커서 — 글자 span 의 위치를 재서 하나뿐인 커서를 transform 으로 옮긴다.
  // 글자마다 box-shadow 를 깜빡이던 방식보다 눈이 덜 튀고, 줄바꿈도 부드럽게 따라간다
  const caretPos = typed.length
  const placeCaret = useCallback(() => {
    const p = targetRef.current
    const c = caretRef.current
    if (!p || !c) return
    let el = p.querySelector<HTMLElement>(`[data-idx="${caretPos}"]`)
    let after = false
    if (!el) {
      const all = p.querySelectorAll<HTMLElement>('[data-idx]')
      el = all[all.length - 1] ?? null
      after = true
    }
    if (!el) return
    const x = el.offsetLeft + (after ? el.offsetWidth : 0)
    c.style.transform = `translate3d(${x}px, ${el.offsetTop}px, 0)`
    c.style.height = `${el.offsetHeight}px`
    // 겹쳐 쓰기 — 보이지 않는 입력칸도 커서 자리로 옮겨 한글 입력기 후보창이 그 곁에 뜨게 한다
    const input = inputRef.current
    if (inline && input) input.style.transform = `translate3d(${x}px, ${el.offsetTop}px, 0)`
  }, [caretPos, inline])

  useLayoutEffect(() => {
    placeCaret()
    const c = caretRef.current
    if (!c) return
    c.classList.remove('is-idle')
    if (caretIdleTimer.current) clearTimeout(caretIdleTimer.current)
    caretIdleTimer.current = setTimeout(() => c.classList.add('is-idle'), CARET_IDLE_MS)
  }, [placeCaret, items, peek, hint, disabled])

  useEffect(() => {
    const p = targetRef.current
    if (!p || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => placeCaret())
    ro.observe(p)
    return () => ro.disconnect()
  }, [placeCaret])

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
        maxCombo: Math.max(maxComboRef.current, tailCombo(compare(target, final).states, final.length)),
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
    // 암송 도구 단축키 — 한글 입력 상태에서도 잡히도록 e.code 로 본다
    if (memorize && e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === 'KeyH') {
        e.preventDefault()
        setHint((h) => !h)
        return
      }
      if (e.code === 'KeyP') {
        e.preventDefault()
        doPeek()
        return
      }
    }
    if (inline && NAV_KEYS.has(e.key)) {
      e.preventDefault()
      return
    }
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
  const comboTier = Math.floor(combo / COMBO_STEP)

  const glyph = (it: DisplayItem, state: CharState | null) => {
    // 겹쳐 쓰기 — 친 자리에는 내가 실제로 친 글자(조합 중·틀린 글자)를 원문 글자 폭 위에 얹는다
    if (inline && it.idx !== null && (state === 'wrong' || state === 'pending')) {
      const mine = typed[it.idx]
      return (
        <>
          <span className="bt-ch__keep">{it.ch === ' ' ? ' ' : it.ch}</span>
          <span className="bt-ch__typed">{mine === ' ' ? ' ' : mine}</span>
        </>
      )
    }
    if (!memorize || peek || it.idx === null || it.ch === ' ') return it.ch
    if (state === 'correct' || state === 'wrong') return it.ch
    return hint ? initialOf(it.ch) : '○'
  }

  const inputEl = (
    <textarea
      ref={inputRef}
      className={`bt-input${inline ? ' bt-input--ghost' : ''}`}
      value={value}
      rows={inline ? 1 : 2}
      disabled={disabled}
      placeholder={memorize ? '기억나는 대로 써 보세요' : '위 말씀을 따라 써 보세요'}
      aria-label="말씀 따라 쓰기 입력"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      data-gramm="false"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onSelect={
        inline
          ? (e) => {
              const el = e.currentTarget
              const n = el.value.length
              if (!composingRef.current && (el.selectionStart !== n || el.selectionEnd !== n)) el.setSelectionRange(n, n)
            }
          : undefined
      }
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
  )

  return (
    <div className={`bt-pad${disabled ? ' is-disabled' : ''}${focused ? ' is-focused' : ''}`}>
      <p
        ref={targetRef}
        className={`bt-target${memorize ? ' is-memorize' : ''}${hint ? ' has-hint' : ''}`}
        aria-label={memorize ? '암송할 말씀(가려짐)' : text}
        onClick={() => inputRef.current?.focus({ preventScroll: true })}
      >
        {items.map((it, i) => {
          const state = it.idx === null ? null : cmp.states[it.idx]
          return (
            <span
              key={i}
              data-idx={it.idx ?? undefined}
              className={['bt-ch', it.idx === null ? 'bt-ch--skip' : `bt-ch--${state}`, it.ch === ' ' ? 'bt-ch--space' : ''].join(' ')}
            >
              {glyph(it, state)}
            </span>
          )
        })}
        {inline &&
          typed.length > target.length &&
          [...typed.slice(target.length)].map((ch, k) => (
            <span key={`x${k}`} className="bt-ch bt-ch--wrong bt-ch--extra">
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        {!disabled && <span ref={caretRef} className="bt-caret" aria-hidden />}
        {inline && inputEl}
        {!disabled && !focused && (
          <span className="bt-refocus" aria-hidden>
            <span className="material-icons-round">keyboard</span>
            누르거나 아무 키나 치면 이어 써요
          </span>
        )}
      </p>

      <div className="bt-progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      {!inline && inputEl}

      <div className="bt-live">
        <span className="bt-live__item">
          <b>{liveCpm}</b>타/분
        </span>
        <span className="bt-live__item">
          정확도 <b>{liveAcc}</b>%
        </span>
        {combo >= COMBO_SHOW && !disabled && (
          <span key={comboTier} className={`bt-combo${comboTier > 0 ? ' is-pop' : ''}`} title="틀리지 않고 이어 쓴 글자 수">
            <span className="material-icons-round" aria-hidden>
              bolt
            </span>
            <b>{combo}</b>연속
          </span>
        )}
        {memorize && (
          <span className="bt-live__tools">
            <button type="button" className={`bt-chip${hint ? ' is-on' : ''}`} onClick={() => setHint((h) => !h)} title="Alt + H">
              초성 힌트
            </button>
            <button type="button" className="bt-chip" onClick={doPeek} title="Alt + P">
              잠깐 보기
            </button>
          </span>
        )}
        <span className={`bt-live__hint${atEnd ? ' is-ready' : ''}${nudge ? ' is-nudge' : ''}`}>
          {nudge
            ? '끝까지 써 주세요'
            : atEnd
              ? '띄어쓰기나 Enter로 완료'
              : inline && typed.length === 0
                ? '말씀 위에 바로 써 보세요'
                : `${Math.min(typed.length, target.length)}/${target.length}`}
        </span>
      </div>
    </div>
  )
}

export default TypingPad
