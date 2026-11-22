// 기도멍 — 비 오는 밤 창가. 타이머도, 목표도, 기록도 없는 곳.
//
// 김 서린 창을 바라보며 머물고, 말 못 한 기도를 써서 올려드리면 유리에 손가락 글씨로 나타났다가
// 다시 서리는 김에 지워진다. 쓴 글은 저장하지도, 서버로 보내지도 않는다.
// 건너편 아파트에 불 켜진 창 하나하나가 지금 함께 머무는 사람이다(숫자만, 신원 없음).
//
// 2026-11-22 시안 셋(촛불·창가·물가) 중 창가 확정 — 향로·촛불은 재도입하지 않는다.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WindowScene from './scenes/WindowScene'
import type { SceneHandle } from './scenes/types'
import { useVigilPresence } from './useVigilPresence'
import { useAmbience } from '../PrayerFocus/useAmbience'
import { useWakeLock } from '../PrayerFocus/useWakeLock'
import './PrayerRest.css'

// 손대지 않으면 버튼·글상자가 스르르 숨고 장면만 남는다
const HIDE_CHROME_MS = 7000
// 글이 다 쓰이고 한동안 머물 즈음까지 한 줄이 머문다
const HEARD_MS = 8000

const VERSE = '시시로 저를 의지하고 그 앞에 마음을 토하라'
const VERSE_REF = '시편 62:8'

/** 함께 머무는 사람 한 줄 — 건너편 불 켜진 창이 곧 사람 수 */
const vigilLine = (others: number, mine: boolean) => {
  const total = others + (mine ? 1 : 0)
  if (others === 0) return mine ? '오늘 밤, 당신이 먼저 이 창가에 왔어요' : '고요한 밤이에요'
  return `지금 ${total}명이 함께 깨어 있어요`
}

const PrayerRest = () => {
  const navigate = useNavigate()
  const sceneRef = useRef<SceneHandle | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [text, setText] = useState('')
  const [chromeHidden, setChromeHidden] = useState(false)
  const [heard, setHeard] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const vigil = useVigilPresence()
  const ambience = useAmbience('rain')
  useWakeLock(true)

  // ── 무접촉 숨김
  const hideTimer = useRef<number | undefined>(undefined)
  const wake = useCallback(() => {
    setChromeHidden(false)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      const ta = textareaRef.current
      // 쓰는 중이면 숨기지 않는다
      if (ta && (document.activeElement === ta || ta.value.trim())) return
      setChromeHidden(true)
    }, HIDE_CHROME_MS)
  }, [])
  useEffect(() => {
    wake()
    const onAny = () => wake()
    window.addEventListener('pointermove', onAny)
    window.addEventListener('pointerdown', onAny)
    window.addEventListener('keydown', onAny)
    return () => {
      window.clearTimeout(hideTimer.current)
      window.removeEventListener('pointermove', onAny)
      window.removeEventListener('pointerdown', onAny)
      window.removeEventListener('keydown', onAny)
    }
  }, [wake])

  // 전체 화면 동안 뒤 문서가 스크롤되지 않게
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const close = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const toggleSound = () => {
    if (soundOn) ambience.pause()
    else ambience.play()
    setSoundOn(!soundOn)
  }

  const offer = () => {
    const ta = textareaRef.current
    const value = text.trim()
    if (!ta || !value) return
    const cs = getComputedStyle(ta)
    const rect = ta.getBoundingClientRect()
    const padL = parseFloat(cs.paddingLeft) || 0
    const padR = parseFloat(cs.paddingRight) || 0
    const padT = parseFloat(cs.paddingTop) || 0
    const fontSize = parseFloat(cs.fontSize) || 16
    const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.7
    sceneRef.current?.offer({
      text: value,
      left: rect.left + padL,
      top: rect.top + padT - ta.scrollTop,
      width: rect.width - padL - padR,
      font: `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`,
      lineHeight,
      color: cs.color,
    })
    // 글상자에서는 즉시 지운다 — 이제 글은 장면 안에 있다
    setText('')
    ta.blur()
    setHeard(true)
    window.setTimeout(() => setHeard(false), HEARD_MS)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      offer()
    }
  }

  return (
    <div className={`pr-root is-window ${chromeHidden ? 'is-quiet' : ''}`} onPointerDown={wake}>
      <WindowScene ref={sceneRef} others={vigil.others} />

      {/* 위 — 닫기 · 제목 · 빗소리 */}
      <header className="pr-top pr-chrome">
        <button type="button" className="pr-icon-btn" onClick={close} aria-label="닫기">
          <span className="material-icons-outlined">close</span>
        </button>
        <h1 className="pr-title font-serif-kr">창가에서</h1>
        <button
          type="button"
          className={`pr-icon-btn ${soundOn ? 'is-on' : ''}`}
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? '빗소리 끄기' : '빗소리 켜기'}
        >
          <span className="material-icons-outlined">{soundOn ? 'volume_up' : 'volume_off'}</span>
        </button>
      </header>

      {/* 말씀 ↔ 올려드린 뒤 한 줄 — 같은 자리에서 교차한다. 자리는 장면마다 다르다 */}
      <div className="pr-under">
        <p className={`pr-verse font-serif-kr pr-chrome-soft ${heard ? 'is-away' : ''}`}>
          {VERSE}
          <span>{VERSE_REF}</span>
        </p>
        <div className={`pr-heard ${heard ? 'is-shown' : ''}`} aria-live="polite">
          {heard && (
            <>
              <p className="font-serif-kr">주님만 읽으셨어요</p>
              <span>김이 다시 서리면 이 글도 사라져요 · 어디에도 남지 않아요</span>
            </>
          )}
        </div>
      </div>

      {/* 창턱 위 — 함께 깨어 있는 사람 */}
      <p className="pws-vigil font-serif-kr pr-chrome-soft">
        <span className="pws-vigil-dot" aria-hidden />
        {vigilLine(vigil.others, vigil.mine)}
        {vigil.others > 0 && <span className="pws-vigil-sub">건너편 불 켜진 창 하나하나가 지금 함께 머무는 사람이에요</span>}
      </p>

      {/* 아래 — 쓰고 올려드리기 */}
      <div className="pr-compose pr-chrome">
        <div className="pr-compose-card">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={wake}
            onKeyDown={onKeyDown}
            rows={3}
            maxLength={600}
            placeholder="말로 꺼내지 못한 기도를 창에 적어 보세요"
            className="pr-textarea font-serif-kr"
            aria-label="올려드릴 기도"
          />
          <div className="pr-compose-foot">
            <span className="pr-compose-note">
              <span className="material-icons-outlined">lock</span>
              저장되지 않아요 · 누구에게도 보이지 않아요
            </span>
            <button type="button" className="pr-offer-btn" onClick={offer} disabled={!text.trim()}>
              올려드리기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrayerRest
