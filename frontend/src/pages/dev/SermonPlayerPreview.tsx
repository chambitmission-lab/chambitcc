// /#/dev/sermon-player — /sermon 설교 영상 모달(SermonDetail) 감성 전면 개편 시안
//   ?v=a  시네마 앰비언트   — 유튜브 '앰비언트 모드'·Apple TV+. 어두운 극장, 영상 빛이 뒤로 번짐, '불 끄기'
//   ?v=b  말씀 곁에         — Spotify 가사 패널·YouVersion. 영상 옆에 본문·한 줄 붙잡기·지난 말씀 탭
//   ?v=c  계절 편지         — 참빛 고유 재료. 설교 날짜 계절의 교회 사진 위에 영상이 편지처럼 도착
//   ?v=d  몰입 + 미니 플레이어 — 유튜브 앱·넷플릭스. 내리면 영상이 위에 붙고, '작게 띄우기'로 목록 둘러보기
//   ?v=e  극장 몰입(A+D)     — D 뼈대(위에 붙기·작게 띄우기) + A 극장 톤·큰 영상 구도·불 끄기 (SermonTheaterE.tsx)
//   &device=mobile  모바일 폭(390) 틀 · 상단 바에서 전환
// 표본은 운영 설교 최근 6편(2026-11-17 스냅샷). 본문은 개역개정(운영 성경 API에서 받은 그대로).
// 유튜브 썸네일은 매주 같은 'LIVE' 템플릿이라 표지로 쓰지 않는다 — 표지는 우리 사진·말씀으로 만든다.
// 미리보기 틀이 컨테이너라 PC·모바일을 같은 화면에서 본다 → 본 구현 땐 @container 를 미디어쿼리로 옮긴다.

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily, ensureSerifKr } from '../../utils/deferredFonts'
import LetterSeasonFx from '../Ministry/LetterSeasonFx'
import { letterSeasonOf, seasonScene } from '../Ministry/letterSeason'
import signature from '../../assets/signature-andongcheol.png'
import './sermonPlayerPreview.css'
import './sermonTheaterE.css'
import SermonTheaterE from './SermonTheaterE'

/* ───────────────────────── 표본 ───────────────────────── */

interface S {
  id: number
  date: string
  slot: string
  pastor: string
  ref: string
  vid: string
  lead: string
}

export const SERMONS: S[] = [
  { id: 45, date: '2026-11-15', slot: '주일 3부', pastor: '안동철 담임목사', ref: '마태복음 14:13–21', vid: 'n9lDc82zOwQ', lead: '예수께서 들으시고 배를 타고 떠나사 따로 빈 들에 가시니 무리가 듣고 여러 고을로부터 걸어서 따라간지라' },
  { id: 44, date: '2026-11-08', slot: '주일 3부', pastor: '김윤하 원로목사', ref: '누가복음 20:19–26', vid: '7xg2oQUEEKI', lead: '서기관들과 대제사장들이 예수의 이 비유는 자기들을 가리켜 말씀하심인 줄 알고 즉시 잡고자 하되 백성을 두려워하더라' },
  { id: 43, date: '2026-11-01', slot: '주일 3부', pastor: '안동철 담임목사', ref: '열왕기하 23:21–30', vid: '4CMpNAyPw3c', lead: '왕이 뭇 백성에게 명령하여 이르되 이 언약책에 기록된 대로 너희의 하나님 여호와를 위하여 유월절을 지키라 하매' },
  { id: 42, date: '2026-10-25', slot: '주일 3부', pastor: '안동철 담임목사', ref: '누가복음 19:1–10', vid: 'qavIJtf_CtM', lead: '예수께서 여리고로 들어가 지나가시더라' },
  { id: 41, date: '2026-10-18', slot: '주일 3부', pastor: 'John van Eyk 목사', ref: '민수기 14:11–20', vid: 'advbww3gcVE', lead: '여호와께서 모세에게 이르시되 이 백성이 어느 때까지 나를 멸시하겠느냐 내가 그들 중에 많은 이적을 행하였으나 어느 때까지 나를 믿지 않겠느냐' },
  { id: 40, date: '2026-10-11', slot: '주일 3부', pastor: '안동철 담임목사', ref: '마태복음 9:35–10:1', vid: '3QDlMcg4-MQ', lead: '예수께서 모든 도시와 마을에 두루 다니사 그들의 회당에서 가르치시며 천국 복음을 전파하시며 모든 병과 모든 약한 것을 고치시니라' },
]

const PASSAGE: { v: number; t: string }[] = [
  { v: 13, t: '예수께서 들으시고 배를 타고 떠나사 따로 빈 들에 가시니 무리가 듣고 여러 고을로부터 걸어서 따라간지라' },
  { v: 14, t: '예수께서 나오사 큰 무리를 보시고 불쌍히 여기사 그 중에 있는 병자를 고쳐 주시니라' },
  { v: 15, t: '저녁이 되매 제자들이 나아와 이르되 이 곳은 빈 들이요 때도 이미 저물었으니 무리를 보내어 마을에 들어가 먹을 것을 사 먹게 하소서' },
  { v: 16, t: '예수께서 이르시되 갈 것 없다 너희가 먹을 것을 주라' },
  { v: 17, t: '제자들이 이르되 여기 우리에게 있는 것은 떡 다섯 개와 물고기 두 마리뿐이니이다' },
  { v: 18, t: '이르시되 그것을 내게 가져오라 하시고' },
  { v: 19, t: '무리를 명하여 잔디 위에 앉히시고 떡 다섯 개와 물고기 두 마리를 가지사 하늘을 우러러 축사하시고 떡을 떼어 제자들에게 주시매 제자들이 무리에게 주니' },
  { v: 20, t: '다 배불리 먹고 남은 조각을 열두 바구니에 차게 거두었으며' },
  { v: 21, t: '먹은 사람은 여자와 어린이 외에 오천 명이나 되었더라' },
]

export const CUR = SERMONS[0]
const REST = SERMONS.slice(1)

export const md = (d: string) => {
  const [, m, day] = d.split('-')
  return `${+m}.${day}`
}
export const longDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${y}년 ${+m}월 ${+day}일`
}
export const thumb = (vid: string, q: 'hq' | 'maxres' = 'hq') => `https://i.ytimg.com/vi/${vid}/${q}default.jpg`
const embed = (vid: string) =>
  `https://www.youtube.com/embed/${vid}?${new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
    origin: window.location.origin,
  })}`

/* ───────────────────────── 공용 조각 ───────────────────────── */

export const Icon = ({ n, className = '' }: { n: string; className?: string }) => (
  <span className={`material-icons-outlined ${className}`} aria-hidden>{n}</span>
)

export const PlayGlyph = ({ size = 30 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.2-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14z" />
  </svg>
)

export const PipGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <rect x="12" y="11.5" width="7" height="5" rx="1.2" fill="currentColor" stroke="none" />
  </svg>
)

/** 영상 자리 — 누르기 전엔 표지(cover), 누르면 그 자리에 플레이어. 표지는 변형마다 다르게 넘긴다 */
export const Player = ({
  sermon,
  cover,
  playing,
  onPlay,
  frameRef,
  className = '',
}: {
  sermon: S
  cover: ReactNode
  playing: boolean
  onPlay: () => void
  frameRef?: RefObject<HTMLIFrameElement | null>
  className?: string
}) => (
  <div className={`spp-player ${className}`}>
    {playing ? (
      <iframe
        ref={frameRef}
        src={embed(sermon.vid)}
        title="설교 영상"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    ) : (
      <button type="button" className="spp-player-cover" onClick={onPlay} aria-label="설교 영상 재생">
        {cover}
      </button>
    )}
  </div>
)

/** 한 줄 붙잡기 — 운영의 sermon-takeaways(본인만·이름 없이 목사님께 전하기)를 그대로 쓴다 */
export const Takeaway = ({ tone = 'default' }: { tone?: 'default' | 'night' | 'letter' }) => {
  const [text, setText] = useState('')
  const [share, setShare] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <div className={`spp-take spp-take--${tone}`}>
      <p className="spp-take-q">이 말씀에서 붙잡은 한 줄은?</p>
      {saved ? (
        <p className="spp-take-saved">
          “{text}”
          <span><Icon n="check" />말씀 노트에 담았어요{share ? ' · 목사님께 이름 없이 전했어요' : ''}</span>
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예) 내게 있는 작은 것도 주님 손에 드리면 넉넉해진다"
            rows={2}
          />
          <div className="spp-take-row">
            <label>
              <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
              목사님께 이름 없이 전하기
            </label>
            <button type="button" disabled={!text.trim()} onClick={() => setSaved(true)}>담기</button>
          </div>
        </>
      )}
    </div>
  )
}

/** 지난 말씀 — 썸네일이 매주 같아서 사진 대신 날짜·본문·첫 절로 구분한다 */
export const PastList = ({ layout, onPick }: { layout: 'rail' | 'rows'; onPick?: () => void }) => (
  <ul className={`spp-past spp-past--${layout}`}>
    {REST.map((s) => (
      <li key={s.id}>
        <button type="button" onClick={onPick}>
          <span className="spp-past-date"><b>{md(s.date)}</b>{s.slot}</span>
          <span className="spp-past-ref">{s.ref}</span>
          <span className="spp-past-lead">{s.lead}</span>
          <span className="spp-past-by">{s.pastor}</span>
        </button>
      </li>
    ))}
  </ul>
)

export const PassageText = ({ big = false }: { big?: boolean }) => (
  <ol className={`spp-passage${big ? ' is-big' : ''}`}>
    {PASSAGE.map((p) => (
      <li key={p.v}>
        <sup>{p.v}</sup>
        {p.t}
      </li>
    ))}
  </ol>
)

/* ───────────────────────── A 시네마 앰비언트 ───────────────────────── */

const VariantA = () => {
  const [playing, setPlaying] = useState(false)
  const [lightsOff, setLightsOff] = useState(false)
  const [sheet, setSheet] = useState<null | 'passage' | 'take'>(null)
  return (
    <div className={`spa${lightsOff ? ' is-lights-off' : ''}`}>
      {/* 앰비언트 — 영상 대표 이미지를 크게 흐려 뒤에 깐다(유튜브 앰비언트 모드). 정지 이미지라 움직임 없음 */}
      <div className="spa-ambient" aria-hidden>
        <img src={thumb(CUR.vid, 'maxres')} alt="" />
      </div>

      <header className="spa-top">
        <button type="button" className="spa-back"><Icon n="arrow_back" />설교 목록</button>
        <span className="spa-top-date">{longDate(CUR.date)} · {CUR.slot}</span>
        <div className="spa-top-actions">
          <button type="button" className={`spa-pill${lightsOff ? ' is-on' : ''}`} onClick={() => setLightsOff((v) => !v)}>
            <Icon n={lightsOff ? 'lightbulb' : 'nightlight'} />
            <span>{lightsOff ? '불 켜기' : '불 끄기'}</span>
          </button>
          <button type="button" className="spa-close" aria-label="닫기"><Icon n="close" /></button>
        </div>
      </header>

      <div className="spa-scroll">
        <Player
          sermon={CUR}
          playing={playing}
          onPlay={() => setPlaying(true)}
          className="spa-player"
          cover={
            <>
              <img className="spa-cover-img" src={seasonScene(letterSeasonOf(CUR.date), 'night')} alt="" />
              <span className="spa-cover-text">
                <span className="spa-cover-ref">{CUR.ref}</span>
                <span className="spa-cover-by">{CUR.pastor}</span>
              </span>
              <span className="spa-cover-play"><PlayGlyph size={34} /></span>
            </>
          }
        />

        <section className="spa-info">
          <div className="spa-info-main">
            <p className="spa-eyebrow">{CUR.pastor} · {CUR.slot} 예배</p>
            <h1 className="spa-title">{CUR.ref}</h1>
            <p className="spa-lead">{CUR.lead}</p>
          </div>
          <div className="spa-info-actions">
            <button type="button" className="spa-act" onClick={() => setSheet('passage')}><Icon n="menu_book" />본문 읽기</button>
            <button type="button" className="spa-act" onClick={() => setSheet('take')}><Icon n="edit_note" />한 줄 붙잡기</button>
            <button type="button" className="spa-act"><Icon n="ios_share" />나누기</button>
          </div>
        </section>

        <section className="spa-more">
          <h2>지난 주일 말씀</h2>
          <PastList layout="rail" />
        </section>
      </div>

      {sheet && (
        <div className="spa-sheet-wrap" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="spa-sheet">
            <div className="spa-sheet-head">
              <b>{sheet === 'passage' ? CUR.ref : '한 줄 붙잡기'}</b>
              <button type="button" aria-label="닫기" onClick={() => setSheet(null)}><Icon n="close" /></button>
            </div>
            {sheet === 'passage' ? <PassageText /> : <Takeaway tone="night" />}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── B 말씀 곁에 ───────────────────────── */

type BTab = 'passage' | 'take' | 'past'

const VariantB = () => {
  const [playing, setPlaying] = useState(false)
  const [tab, setTab] = useState<BTab>('passage')
  const TABS: [BTab, string][] = [['passage', '본문 말씀'], ['take', '한 줄 붙잡기'], ['past', '지난 말씀']]
  return (
    <div className="spb-overlay">
      <div className="spb-modal">
        <div className="spb-left">
          <header className="spb-top">
            <div className="spb-top-meta">
              <span className="spb-stamp"><b>{md(CUR.date)}</b>주일</span>
              <span className="spb-top-slot">{CUR.slot} 예배</span>
            </div>
            <button type="button" className="spb-close" aria-label="닫기"><Icon n="close" /></button>
          </header>
          <Player
            sermon={CUR}
            playing={playing}
            onPlay={() => setPlaying(true)}
            className="spb-player"
            cover={
              <>
                <img className="spb-cover-img" src={seasonScene(letterSeasonOf(CUR.date), 'day')} alt="" />
                <span className="spb-cover-play"><PlayGlyph /></span>
                <span className="spb-cover-cap">영상으로 다시 듣기</span>
              </>
            }
          />
          <div className="spb-info">
            <p className="spb-by">{CUR.pastor}</p>
            <h1 className="spb-title">{CUR.ref}</h1>
            <blockquote className="spb-lead">{CUR.lead}</blockquote>
          </div>
        </div>

        <aside className="spb-panel">
          <div className="spb-tabs" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="spb-panel-body">
            {tab === 'passage' && (
              <>
                <p className="spb-panel-cap">영상 들으며 함께 펼쳐 두세요</p>
                <PassageText big />
                <button type="button" className="spb-link"><Icon n="auto_stories" />성경에서 이어 읽기<Icon n="chevron_right" /></button>
              </>
            )}
            {tab === 'take' && (
              <>
                <Takeaway />
                <div className="spb-prev-take">
                  <p>지난주 내가 붙잡은 한 줄 · 11.08</p>
                  <blockquote>가이사의 것은 가이사에게, 하나님의 것은 하나님께 — 내 마음은 누구의 것인가</blockquote>
                </div>
              </>
            )}
            {tab === 'past' && <PastList layout="rows" />}
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ───────────────────────── C 계절 편지 ───────────────────────── */

const VariantC = ({ dark }: { dark: boolean }) => {
  const [playing, setPlaying] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)
  const season = letterSeasonOf(CUR.date)
  return (
    <div ref={boxRef} className="spc">
      <div className="spc-photo" style={{ backgroundImage: `url(${seasonScene(season, dark ? 'night' : 'day')})` }} aria-hidden />
      {/* 영상이 재생 중일 땐 낙엽을 멈춘다 — 보는 데 방해되지 않게 */}
      <LetterSeasonFx season={season} boxRef={boxRef} targetRef={targetRef} paused={playing} />

      <header className="spc-top">
        <button type="button" className="spc-back"><Icon n="arrow_back" />말씀 편지함</button>
        <button type="button" className="spc-close" aria-label="닫기"><Icon n="close" /></button>
      </header>

      <div className="spc-scroll">
        <div className="spc-grid">
          <div className="spc-letter">
            <div className="spc-postmark" aria-hidden>
              <span>2026</span>
              <b>{md(CUR.date)}</b>
              <span>주일 3부</span>
            </div>
            <p className="spc-eyebrow">이번 주 말씀 편지</p>
            <h1 className="spc-title">{CUR.ref}</h1>
            <p className="spc-lead">{CUR.lead}</p>
            <div className="spc-sign">
              <img src={signature} alt="" />
              <span>{CUR.pastor}</span>
            </div>
          </div>

          <div ref={targetRef} className="spc-window">
            <Player
              sermon={CUR}
              playing={playing}
              onPlay={() => setPlaying(true)}
              className="spc-player"
              cover={
                <>
                  <img className="spc-cover-img" src={dark ? '/images/visit/church-night.webp' : '/images/visit/church-day.webp'} alt="" />
                  <span className="spc-cover-veil" />
                  <span className="spc-cover-play"><PlayGlyph size={28} /></span>
                  <span className="spc-cover-cap">편지 열어 듣기</span>
                </>
              }
            />
          </div>
        </div>

        <div className="spc-after">
          <div className="spc-card">
            <p className="spc-card-k">말씀을 들은 뒤</p>
            <Takeaway tone="letter" />
          </div>
          <div className="spc-card">
            <p className="spc-card-k">지난 편지</p>
            <PastList layout="rows" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── D 몰입 + 미니 플레이어 ───────────────────────── */

type DMode = 'full' | 'docked' | 'float'

const VariantD = () => {
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [mode, setMode] = useState<DMode>('full')
  const scrollRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)

  // 영상 높이만큼 내려가면 위에 붙인다(유튜브 앱처럼). 떠 있는 동안엔 건드리지 않는다
  const onScroll = () => {
    const el = scrollRef.current
    if (!el || mode === 'float') return
    const threshold = (el.clientWidth * 9) / 16 * 0.55
    setMode(el.scrollTop > threshold ? 'docked' : 'full')
  }

  // 같은 iframe을 그대로 두고 명령만 보낸다 — 다시 로드하지 않는다
  const toggle = () => {
    const w = frameRef.current?.contentWindow
    if (!w) return
    w.postMessage(JSON.stringify({ event: 'command', func: paused ? 'playVideo' : 'pauseVideo', args: [] }), 'https://www.youtube.com')
    setPaused((p) => !p)
  }

  const backToFull = () => {
    setMode('full')
    scrollRef.current?.scrollTo({ top: 0 })
  }

  return (
    <div className={`spd is-${mode}`}>
      {/* 떠 있을 때 뒤로 보이는 설교 목록(표본) */}
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

      <div className="spd-sheet">
        <header className="spd-top">
          <button type="button" className="spd-icon" aria-label="작게 띄우기" onClick={() => setMode('float')}>
            <Icon n="expand_more" />
          </button>
          <span className="spd-top-t">{md(CUR.date)} {CUR.slot}</span>
          <button type="button" className="spd-icon" aria-label="닫기"><Icon n="close" /></button>
        </header>

        <div ref={scrollRef} className="spd-scroll" onScroll={onScroll}>
          <div className="spd-player-slot" />
          <section className="spd-info">
            <p className="spd-by">{CUR.pastor}</p>
            <h1 className="spd-title">{CUR.ref}</h1>
            <div className="spd-chips">
              <button type="button"><Icon n="ios_share" />나누기</button>
              <button type="button" onClick={() => setMode('float')}><PipGlyph />작게 띄우기</button>
            </div>
          </section>
          <section className="spd-block">
            <h2>오늘의 본문</h2>
            <PassageText big />
          </section>
          <section className="spd-block">
            <h2>한 줄 붙잡기</h2>
            <Takeaway />
          </section>
          <section className="spd-block">
            <h2>이어서 들을 말씀</h2>
            <PastList layout="rows" />
          </section>
        </div>
      </div>

      {/* 플레이어는 시트 밖 한 자리 — 모드가 바뀌어도 iframe이 다시 로드되지 않는다 */}
      <div className="spd-player-wrap">
        <Player
          sermon={CUR}
          playing={playing}
          onPlay={() => setPlaying(true)}
          frameRef={frameRef}
          className="spd-player"
          cover={
            <>
              <img className="spd-cover-img" src="/images/visit/church-night.webp" alt="" />
              <span className="spd-cover-ref">{CUR.ref}</span>
              <span className="spd-cover-play"><PlayGlyph size={30} /></span>
            </>
          }
        />
        <div className="spd-mini">
          <button type="button" className="spd-mini-text" onClick={backToFull}>
            <b>{CUR.ref}</b>
            <span>{CUR.pastor}</span>
          </button>
          {playing && (
            <button type="button" className="spd-icon" aria-label={paused ? '재생' : '일시정지'} onClick={toggle}>
              <Icon n={paused ? 'play_arrow' : 'pause'} />
            </button>
          )}
          {mode === 'float' && (
            <button type="button" className="spd-icon" aria-label="크게 보기" onClick={backToFull}>
              <Icon n="open_in_full" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── 미리보기 틀 ───────────────────────── */

const VARIANTS: { k: string; name: string; bench: string; note: string }[] = [
  { k: 'e', name: '극장 몰입 (A+D)', bench: 'D 뼈대 + A 극장 톤', note: '큰 영상 + 앰비언트 빛 + 불 끄기. 내리면 영상이 위에 붙고, ⌄ 또는 "작게 띄우기"로 구석에 띄운 채 목록을 둘러봅니다. 불이 꺼진 동안 영상 밖을 누르면 다시 켜져요.' },
  { k: 'a', name: '시네마 앰비언트', bench: '유튜브 앰비언트 모드 · Apple TV+', note: '어두운 극장. 영상 색이 뒤로 은은히 번지고, "불 끄기"로 영상만 남깁니다. 본문·한 줄은 아래에서 올라오는 시트로.' },
  { k: 'b', name: '말씀 곁에', bench: 'Spotify 가사 패널 · YouVersion', note: 'PC는 영상 옆에 본문을 펼쳐 둔 2단, 모바일은 영상이 위에 고정되고 아래 탭. 라이트/다크 그대로 따라감.' },
  { k: 'c', name: '계절 편지', bench: '참빛 말씀 편지 · 목양칼럼 A2', note: '설교 날짜 계절의 교회 사진 위에 영상이 편지처럼 도착. 낙엽은 재생을 누르면 멈춥니다. 목록 화면과 한 세계.' },
  { k: 'd', name: '몰입 + 미니 플레이어', bench: '유튜브 앱 · 넷플릭스 PIP', note: '내리면 영상이 위에 작게 붙고, ⌄ 또는 "작게 띄우기"로 구석에 띄운 채 목록을 둘러봅니다. 재생은 끊기지 않음.' },
]

const SermonPlayerPreview = () => {
  const [params, setParams] = useSearchParams()
  const v = params.get('v') ?? 'e'
  const device = params.get('device') === 'mobile' ? 'mobile' : 'pc'
  const { theme, toggleTheme } = useTheme()
  const info = VARIANTS.find((x) => x.k === v) ?? VARIANTS[0]

  useEffect(() => {
    void ensureSerifKr()
    void ensureFontFamily('nanumPen')
  }, [])

  const set = (k: string, val: string) => {
    const next = new URLSearchParams(params)
    next.set(k, val)
    setParams(next, { replace: true })
  }

  return (
    <div className="spp-root">
      <div className="spp-bar">
        <div className="spp-bar-tabs">
          {VARIANTS.map((x) => (
            <button key={x.k} type="button" className={x.k === info.k ? 'is-on' : ''} onClick={() => set('v', x.k)}>
              <b>{x.k.toUpperCase()}</b>{x.name}
            </button>
          ))}
        </div>
        <div className="spp-bar-tools">
          <button type="button" onClick={() => set('device', device === 'pc' ? 'mobile' : 'pc')}>
            {device === 'pc' ? '모바일로 보기' : 'PC로 보기'}
          </button>
          <button type="button" onClick={toggleTheme}>{theme === 'dark' ? '라이트' : '다크'}</button>
        </div>
      </div>
      <p className="spp-note"><b>{info.bench}</b> — {info.note}</p>

      <div className={`spp-stage is-${device}`}>
        {/* key: 변형·기기를 바꾸면 재생 상태를 처음으로 */}
        <div className="spp-screen" key={`${info.k}-${device}`}>
          {info.k === 'a' && <VariantA />}
          {info.k === 'b' && <VariantB />}
          {info.k === 'c' && <VariantC dark={theme === 'dark'} />}
          {info.k === 'd' && <VariantD />}
          {info.k === 'e' && <SermonTheaterE />}
        </div>
      </div>
    </div>
  )
}

export default SermonPlayerPreview
