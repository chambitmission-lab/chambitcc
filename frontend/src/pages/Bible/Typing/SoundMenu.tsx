import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  AMBIENTS,
  SOUND_THEMES,
  getAmbient,
  getSoundTheme,
  pauseAmbient,
  preloadTypingSound,
  resumeAmbient,
  setAmbient,
  setSoundTheme,
  subscribeSound,
} from './typingSound'

/** 쓰기 화면 머리의 소리 버튼 — 타건음 테마·배경(피아노). 화면을 떠나면 배경을 멈춘다 */
const SoundMenu = () => {
  const theme = useSyncExternalStore(subscribeSound, getSoundTheme)
  const ambient = useSyncExternalStore(subscribeSound, getAmbient)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    preloadTypingSound()
    // 골라 둔 배경은 첫 입력 때 다시 튼다(자동 재생 정책) — 떠날 때 끈다
    const kick = () => resumeAmbient()
    document.addEventListener('keydown', kick, { once: true })
    document.addEventListener('pointerdown', kick, { once: true })
    return () => {
      document.removeEventListener('keydown', kick)
      document.removeEventListener('pointerdown', kick)
      pauseAmbient()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const on = theme !== 'off' || ambient !== 'off'
  return (
    <div className="bt-sound" ref={boxRef}>
      <button
        type="button"
        className={`bt-icon-btn${on ? ' is-on' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="쓰는 소리 고르기"
        title="쓰는 소리"
      >
        <span className="material-icons-round">{on ? 'music_note' : 'music_off'}</span>
      </button>
      {open && (
        <div className="bt-sound__menu" role="menu">
          <p className="bt-sound__title">쓰는 소리</p>
          {SOUND_THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.key}
              className={`bt-sound__item${theme === t.key ? ' is-on' : ''}`}
              onClick={() => setSoundTheme(t.key)}
            >
              <span className="bt-sound__label">{t.label}</span>
              <span className="bt-sound__desc">{t.desc}</span>
            </button>
          ))}
          <div className="bt-sound__ambient">
            <p className="bt-sound__title">배경</p>
            <div className="bt-sound__chips" role="radiogroup" aria-label="배경 소리">
              {AMBIENTS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  role="radio"
                  aria-checked={ambient === a.key}
                  className={`bt-sound__chip${ambient === a.key ? ' is-on' : ''}`}
                  onClick={() => setAmbient(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SoundMenu
