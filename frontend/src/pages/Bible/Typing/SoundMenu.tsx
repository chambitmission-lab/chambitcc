import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
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

type Cap = (typeof SOUND_THEMES)[number]

const KEY_CAPS = SOUND_THEMES.filter((t) => t.group === 'keys')
const ANALOG_CAPS = SOUND_THEMES.filter((t) => t.group === 'analog')
const STEM = Object.fromEntries(SOUND_THEMES.map((t) => [t.key, t.stem])) as Record<Cap['key'], string>

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

  const renderCap = (c: Cap) => (
    <button
      key={c.key}
      type="button"
      role="menuitemradio"
      aria-checked={theme === c.key}
      className={`bt-cap${theme === c.key ? ' is-on' : ''}`}
      style={{ '--stem': c.stem } as CSSProperties}
      onClick={() => setSoundTheme(c.key)}
    >
      <span className="bt-cap__top">
        <span className="bt-cap__stem" aria-hidden />
        <span className="bt-cap__label">{c.label}</span>
        <span className="bt-cap__sub">{c.desc}</span>
      </span>
    </button>
  )

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
        {theme !== 'off' && <span className="bt-sound__led" style={{ '--stem': STEM[theme] } as CSSProperties} aria-hidden />}
      </button>
      {open && (
        <div className="bt-sound__menu" role="menu">
          <div className="bt-sound__head">
            <p className="bt-sound__title">쓰는 소리</p>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === 'off'}
              className={`bt-sound__mute${theme === 'off' ? ' is-on' : ''}`}
              onClick={() => setSoundTheme('off')}
            >
              <span className="material-icons-round" aria-hidden>
                volume_off
              </span>
              끄기
            </button>
          </div>
          <p className="bt-sound__group">키보드</p>
          <div className="bt-sound__plate">{KEY_CAPS.map(renderCap)}</div>
          <p className="bt-sound__group">아날로그</p>
          <div className="bt-sound__plate bt-sound__plate--analog">{ANALOG_CAPS.map(renderCap)}</div>
          <div className="bt-sound__ambient">
            <p className="bt-sound__title">배경 음악</p>
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
