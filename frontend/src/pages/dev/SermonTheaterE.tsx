// /#/dev/sermon-player?v=e — 극장 몰입(A+D)
// 뼈대 = D(내리면 위에 붙기 · 작게 띄우기), 옷 = A(어두운 극장 · 앰비언트 빛 · 큰 영상 구도 · 불 끄기).
// 플레이어(iframe)는 스크롤 영역 밖 한 자리에 두고, 펼친 상태에선 자리표시(slot) 위치를 매 프레임 따라간다.
// 그래서 A처럼 내용과 함께 자연스럽게 스크롤되면서도, 위에 붙거나 구석에 떠도 다시 로드되지 않는다.

import { useEffect, useRef, useState } from 'react'
import { letterSeasonOf, seasonScene } from '../Ministry/letterSeason'
import { CUR, SERMONS, Icon, PassageText, PastList, PipGlyph, PlayGlyph, Player, Takeaway, longDate, md, thumb } from './SermonPlayerPreview'

type EMode = 'full' | 'docked' | 'float'

const SermonTheaterE = () => {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [lightsOff, setLightsOff] = useState(false)
  const [hint, setHint] = useState(false)
  const [mode, setMode] = useState<EMode>('full')
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // 자리표시 위치를 재고, 영상의 2/3가 상단 바 뒤로 들어가면 위에 붙인다
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const root = rootRef.current
      const slot = slotRef.current
      const top = topRef.current
      if (!root || !slot || !top) return
      const r = root.getBoundingClientRect()
      const s = slot.getBoundingClientRect()
      setBox({ top: s.top - r.top, left: s.left - r.left, width: s.width })
      if (modeRef.current === 'float') return
      const barBottom = top.getBoundingClientRect().bottom
      setMode(s.bottom < barBottom + s.height * 0.34 ? 'docked' : 'full')
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    const sc = scrollRef.current
    sc?.addEventListener('scroll', schedule, { passive: true })
    const ro = new ResizeObserver(schedule)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => {
      sc?.removeEventListener('scroll', schedule)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const play = () => {
    setPlaying(true)
    // 재생을 누르면 한 번만 살짝 권한다 — 강요하지 않고 4초 뒤 사라짐
    if (!lightsOff) {
      setHint(true)
      window.setTimeout(() => setHint(false), 4200)
    }
  }

  // 같은 iframe에 명령만 보낸다 — 다시 로드하지 않는다
  const toggle = () => {
    const w = frameRef.current?.contentWindow
    if (!w) return
    w.postMessage(JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }), 'https://www.youtube.com')
    setPaused((p) => !p)
  }

  const backToFull = () => {
    modeRef.current = 'full'
    setMode('full')
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const goFloat = () => {
    setLightsOff(false)
    setHint(false)
    setMode('float')
  }

  const lights = (off: boolean) => {
    setHint(false)
    setLightsOff(off)
  }

  const fullStyle = mode === 'full' && box ? { top: box.top, left: box.left, width: box.width } : undefined

  return (
    <div ref={rootRef} className={`spe is-${mode}${lightsOff ? ' is-lights-off' : ''}`}>
      {/* 떠 있을 때 뒤로 보이는 설교 목록(표본) — 실제론 /sermon 화면 */}
      <div className="spd-under" aria-hidden={mode !== 'float'}>
        <p className="spd-under-h">설교</p>
        <p className="spd-under-sub">영상은 작게 띄워 둔 채 둘러보세요</p>
        {SERMONS.map((s) => (
          <div key={s.id} className="spd-under-row">
            <b>{md(s.date)}</b>
            <span>{s.ref}<small>{s.pastor}</small></span>
          </div>
        ))}
      </div>

      <div className="spe-theater">
        <div className="spa-ambient spe-ambient" aria-hidden>
          <img src={thumb(CUR.vid, 'maxres')} alt="" />
        </div>

        <header ref={topRef} className="spe-top">
          <button type="button" className="spe-icon" aria-label="작게 띄우기" onClick={goFloat}>
            <Icon n="expand_more" />
          </button>
          <span className="spe-top-date">{longDate(CUR.date)} · {CUR.slot}</span>
          <div className="spe-top-actions">
            <button type="button" className={`spa-pill${lightsOff ? ' is-on' : ''}`} onClick={() => lights(!lightsOff)}>
              <Icon n={lightsOff ? 'lightbulb' : 'nightlight'} />
              <span>{lightsOff ? '불 켜기' : '불 끄기'}</span>
            </button>
            <button type="button" className="spa-close" aria-label="닫기"><Icon n="close" /></button>
          </div>
        </header>

        <div ref={scrollRef} className="spe-scroll">
          <div ref={slotRef} className="spe-slot" />

          {/* 불이 꺼진 동안엔 영상 밖 아무 곳이나 누르면 다시 켜진다 */}
          <div
            className="spe-content"
            onClickCapture={(e) => {
              if (!lightsOff) return
              e.stopPropagation()
              e.preventDefault()
              lights(false)
            }}
          >
            <section className="spa-info spe-info">
              <div className="spa-info-main">
                <p className="spa-eyebrow">{CUR.pastor} · {CUR.slot} 예배</p>
                <h1 className="spa-title">{CUR.ref}</h1>
                <p className="spa-lead">{CUR.lead}</p>
              </div>
              <div className="spa-info-actions">
                <button type="button" className="spa-act" onClick={() => lights(true)}><Icon n="nightlight" />불 끄고 보기</button>
                <button type="button" className="spa-act" onClick={goFloat}><PipGlyph />작게 띄우기</button>
                <button type="button" className="spa-act"><Icon n="ios_share" />나누기</button>
              </div>
            </section>

            <section className="spe-block">
              <h2>오늘의 본문</h2>
              <PassageText big />
            </section>

            <section className="spe-block">
              <h2>한 줄 붙잡기</h2>
              <Takeaway tone="night" />
            </section>

            <section className="spa-more spe-more">
              <h2>지난 주일 말씀</h2>
              <PastList layout="rail" />
            </section>
          </div>
        </div>

        {hint && (
          <button type="button" className="spe-hint" onClick={() => lights(true)}>
            <Icon n="nightlight" />불을 끄면 말씀에 더 집중할 수 있어요
          </button>
        )}
      </div>

      {/* 플레이어 — 한 자리. full=자리표시 따라가기 / docked=위 한 줄 / float=구석 */}
      <div className="spe-player-wrap" style={fullStyle}>
        <Player
          sermon={CUR}
          playing={playing}
          onPlay={play}
          frameRef={frameRef}
          className="spe-player"
          cover={
            <>
              <img className="spa-cover-img" src={seasonScene(letterSeasonOf(CUR.date), 'night')} alt="" />
              <span className="spa-cover-text spe-cover-text">
                <span className="spa-cover-ref">{CUR.ref}</span>
                <span className="spa-cover-by">{CUR.pastor}</span>
              </span>
              <span className="spa-cover-play spe-cover-play"><PlayGlyph size={34} /></span>
            </>
          }
        />
        <div className="spe-mini">
          <button type="button" className="spe-mini-text" onClick={backToFull}>
            <b>{CUR.ref}</b>
            <span>{CUR.pastor}</span>
          </button>
          {playing && (
            <button type="button" className="spe-icon" aria-label={paused ? '재생' : '일시정지'} onClick={toggle}>
              <Icon n={paused ? 'play_arrow' : 'pause'} />
            </button>
          )}
          <button type="button" className="spe-icon" aria-label="크게 보기" onClick={backToFull}>
            <Icon n="open_in_full" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SermonTheaterE
