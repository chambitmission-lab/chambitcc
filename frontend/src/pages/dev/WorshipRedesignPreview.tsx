import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { visitSceneFor } from '../../utils/themeAssets'
import LetterSeasonFx from '../Ministry/LetterSeasonFx'
import './worshipRedesignPreview.css'

/**
 * /#/dev/worship-redesign — /worship 전면 개편 시안. "처음 온 성도"가 주 사용자.
 *   ?v=a 이번 주일 초대 + 내 주일 아침 · b 두 갈래 문(처음/다니는 분) · c 대림절 초대장(절기 옷)
 * 표본 예배만(운영 시간표 그대로), 오늘 = 2026-11-26(목), 이번 주일 = 11/29 대림절 첫째 주일.
 */

type VKey = 'a2' | 'a' | 'b' | 'c'
const VARIANTS: { key: VKey; label: string; note: string }[] = [
  {
    key: 'a2',
    label: 'A2 사계절 주일 아침 길',
    note: '사진·문구는 A 그대로, 아래 패널만 계절 옷. ① 시간 카드 위 띠 = 그 시각 주일 하늘색(이른 새벽 → 밝은 아침 → 깊은 한낮 → 열린 오후), 고른 카드는 계절 색 테두리 + 계절 잎이 내려앉음. ② "그날 아침"은 상동역(7호선 배지) → 교회 입구 → 예배당 → 새가족실 커피를 잇는 발자국 길 — 길 색·머리말·첫 줄 돌봄 문구가 계절마다 바뀜(가을 "단풍길 따라", 겨울 "눈길, 천천히"). 계절은 사진과 같은 기준으로 저절로 바뀜, 아래 계절 버튼은 미리보기용.',
  },
  {
    key: 'a',
    label: 'A 이번 주일 초대 + 내 주일 아침',
    note: '계절 교회 사진 하늘 위에 "자리 하나 비워둘게요". 바로 아래 "몇 시에 오실래요?" 큰 시간 버튼 4개 → 고른 예배에 맞춰 "그날 아침" 4줄(상동역 도착 → 입구 → 예배 → 새가족실 커피) 시각이 저절로 바뀜. 길찾기·내 달력에 담기. 아래로 평일 모임 · 걱정 묻고 답하기 · 지난 설교/생중계.',
  },
  {
    key: 'b',
    label: 'B 두 갈래 문',
    note: '맨 위는 누구에게나 필요한 "주일 예배 시간" 한 줄(크게). 그 아래 문 두 개 — "처음 와 봐요" / "다니고 있어요". 처음: 번호 붙은 4단계 안내 + 걱정 답. 다니는 분: 전체 시간표(평일 포함) + 생중계·지난 설교·주보 바로가기. 한 화면이 두 사람을 다 챙김.',
  },
  {
    key: 'c',
    label: 'C 대림절 초대장 (절기 옷)',
    note: '히어로가 교회력에 따라 옷을 갈아입음. 지금은 대림절 — 눈 내린 밤 교회 사진 + 대림절 초 4개 중 이번 주(첫째 주) 한 개만 켜짐. 시간표는 초대장 명조 한 장. "처음 오신 분께 드리는 세 가지 약속". 다른 절기(부활절·추수감사)는 사진·소품만 바뀜.',
  },
]

type Svc = { order: number; name: string; start: number; place: string }
const SUNDAY: Svc[] = [
  { order: 1, name: '이른예배', start: 7 * 60 + 30, place: '오렌엘 홀' },
  { order: 2, name: '밝은예배', start: 9 * 60 + 20, place: '본당' },
  { order: 3, name: '깊은예배', start: 11 * 60 + 20, place: '본당' },
  { order: 4, name: '열린예배', start: 13 * 60 + 30, place: '본당' },
]
const WEEKDAY = [
  { icon: 'wb_twilight', name: '새벽기도회', day: '월요일~금요일', times: ['오전 5:30'], place: '본당', tag: '하루를 말씀으로 여는 시간' },
  { icon: 'menu_book', name: '수요기도회', day: '수요일', times: ['오전 10:30 오렌엘 홀', '오후 7:30 본당'], place: '', tag: '말씀 앞에 머무는 시간' },
  { icon: 'nights_stay', name: '금요기도회', day: '금요일', times: ['오후 8:30'], place: '본당', tag: '한 주의 짐을 내려놓는 밤' },
]
const FAQ = [
  { q: '앞으로 불려 나가서 자기소개 시키나요?', a: '안 시킵니다. 대신 새가족실에서 따뜻한 커피 한 잔 드려요.' },
  { q: '옷은 어떻게 입고 가요?', a: '지금 입고 계신 그대로요. 예수님도 샌들 신으셨습니다.' },
  { q: '아는 사람이 한 명도 없어요.', a: '다들 그렇게 시작했습니다. 혼자 조용히 앉았다 가셔도 아무도 붙잡지 않아요.' },
  { q: '늦잠 자서 1부를 놓쳤어요.', a: '4부까지 있습니다. 그래도 놓치면 설교 다시보기가 있어요.' },
]

const ampm = (m: number) => (m < 720 ? '오전' : '오후')
const hm = (m: number) => {
  const h = Math.floor(m / 60) % 12 || 12
  return `${h}:${String(m % 60).padStart(2, '0')}`
}
const fmt = (m: number) => `${ampm(m)} ${hm(m)}`

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-icons-round ${className}`} aria-hidden="true">{name}</span>
)

const useScene = (forceDark = false) => {
  const { theme } = useTheme()
  return visitSceneFor(forceDark || theme === 'dark' ? 'dark' : 'light', new Date(2026, 10, 29))!.src
}

// ───────────────────────── A2 사계절 ─────────────────────────
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
const SEASON_KO: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }
// 계절마다 바뀌는 길 머리말 + 첫 걸음 돌봄 한 줄 (날씨는 정보가 아니라 돌봄)
const SEASON_WALK: Record<Season, { head: string; care: string }> = {
  spring: { head: '꽃길 따라 오세요', care: '큰길 가로수에 꽃이 피었어요. 천천히 구경하며 오세요.' },
  summer: { head: '초록 그늘 따라 오세요', care: '더운 날엔 그늘 따라 천천히 오세요. 서두르지 않으셔도 돼요.' },
  autumn: { head: '단풍길 따라 오세요', care: '교회 앞 붉은 단풍나무가 먼저 반겨 드려요.' },
  winter: { head: '눈길, 천천히 오세요', care: '길이 미끄러울 수 있어요. 늦어도 괜찮으니 천천히 오세요.' },
}
// 각 예배 시각의 주일 하늘 — 이른(새벽) · 밝은(아침) · 깊은(한낮) · 열린(오후)
const HOUR_SKY: Record<number, string> = {
  1: 'linear-gradient(100deg, #f6c7a6 0%, #e9c9c9 40%, #b8cbe8 100%)',
  2: 'linear-gradient(100deg, #d6ebfb 0%, #a9d2f5 100%)',
  3: 'linear-gradient(100deg, #79b4f1 0%, #3f8ae0 100%)',
  4: 'linear-gradient(100deg, #9cc4ec 0%, #f3d79c 100%)',
}

// 길 위 정거장 아이콘 — 라인 아이콘(이모지·클립아트 대신)
const StopIcon = ({ kind }: { kind: 'subway' | 'door' | 'cross' | 'cup' }) => {
  if (kind === 'subway') return <span className="wrp-stop-7" aria-label="7호선">7</span>
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...common}>
      {kind === 'door' && (<><path d="M5 21V9.5L12 4l7 5.5V21" /><path d="M9.5 21v-6.5a2.5 2.5 0 0 1 5 0V21" /><path d="M3 21h18" /></>)}
      {kind === 'cross' && (<><path d="M12 3v18" /><path d="M7 8.5h10" /></>)}
      {kind === 'cup' && (<><path d="M4.5 10h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" /><path d="M16.5 11.5h1.5a2.5 2.5 0 0 1 0 5h-1.6" /><path d="M8.5 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3" /></>)}
    </svg>
  )
}

const SeasonWalk = ({ svc, season }: { svc: Svc; season: Season }) => {
  const steps = [
    { t: svc.start - 20, icon: 'subway' as const, label: '상동역 도착', title: '7호선 상동역에서 걸어서 5분', body: SEASON_WALK[season].care, seg: '걸어서 5분' },
    { t: svc.start - 10, icon: 'door' as const, label: '교회 입구', title: '"처음 왔어요" 한마디면 충분해요', body: `안내하는 분이 ${svc.place}까지 같이 가 드려요. 혼자 조용히 앉으셔도 괜찮아요.`, seg: '자리 잡고' },
    { t: svc.start, icon: 'cross' as const, label: `${svc.order}부 예배`, title: '앉아서 듣기만 하셔도 됩니다', body: '찬양 가사와 성경 본문은 화면에 다 나와요. 앞에 불려 나가는 일은 없어요.', seg: '예배 마치고' },
    { t: svc.start + 70, icon: 'cup' as const, label: '새가족실', title: '따뜻한 커피 한 잔, 원하시면요', body: '잠깐 쉬어 가셔도, 바로 가셔도 됩니다.', seg: '' },
  ]
  return (
    <ol className="wrp-walk">
      {steps.map((s, i) => (
        <li key={s.label} className="wrp-walk-stop" style={{ animationDelay: `${i * 90}ms` }}>
          <div className="wrp-walk-rail" aria-hidden="true">
            <span className="wrp-walk-pin"><StopIcon kind={s.icon} /></span>
            {s.seg && <span className="wrp-walk-seg"><span>{s.seg}</span></span>}
          </div>
          <div className="wrp-walk-text">
            <p className="wrp-walk-time"><em>{ampm(s.t)}</em> {hm(s.t)} <span>{s.label}</span></p>
            <p className="wrp-walk-title">{s.title}</p>
            <p className="wrp-walk-body">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// 평일 모임 — 주일 카드처럼 "그 시각의 하늘"을 입힌다(새벽 · 낮 · 저녁 · 밤)
const DAY_SKY = {
  dawn: 'linear-gradient(160deg, #2c4a86 0%, #7d7fb8 55%, #f2b49a 100%)',
  day: 'linear-gradient(160deg, #8ec5f4 0%, #cfe6fb 100%)',
  dusk: 'linear-gradient(160deg, #5a6fb0 0%, #c98fa6 60%, #f3c08f 100%)',
  night: 'linear-gradient(160deg, #0f1d44 0%, #24356e 100%)',
} as const
type SkyKey = keyof typeof DAY_SKY
const WEEKDAY_SKY: { name: string; day: string; sky: SkyKey; icon: string; when: string; tag: string; slots: { time: string; place: string; sky: SkyKey }[] }[] = [
  { name: '새벽기도회', day: '월요일 ~ 금요일', sky: 'dawn', icon: 'wb_twilight', when: '새벽', tag: '하루를 말씀으로 여는 시간', slots: [{ time: '오전 5:30', place: '본당', sky: 'dawn' }] },
  { name: '수요기도회', day: '수요일', sky: 'day', icon: 'menu_book', when: '낮 · 저녁', tag: '말씀 앞에 머무는 시간', slots: [{ time: '오전 10:30', place: '오렌엘 홀', sky: 'day' }, { time: '오후 7:30', place: '본당', sky: 'dusk' }] },
  { name: '금요기도회', day: '금요일', sky: 'night', icon: 'nights_stay', when: '밤', tag: '한 주의 짐을 내려놓는 밤', slots: [{ time: '오후 8:30', place: '본당', sky: 'night' }] },
]

const WeekdaySky = ({ season }: { season: Season }) => (
  <div className="wrp-wks">
    {WEEKDAY_SKY.map((w) => (
      <article key={w.name} className="wrp-wks-card">
        {/* 그 시각의 우리 교회 — 히어로와 같은 계절 사진. 새벽은 밤 사진 위로 동이 트고, 낮은 맑은 날, 밤은 불 켜진 창 */}
        <div className={`wrp-wks-sky wrp-wks-sky--${w.sky}`}>
          <img src={`/images/visit/scene-${season}-${w.sky === 'day' ? 'day' : 'night'}.webp`} alt="" aria-hidden="true" />
          <span className="wrp-wks-veil" aria-hidden="true" />
          <Icon name={w.icon} className="wrp-wks-icon" />
          <span className="wrp-wks-when">{w.when}</span>
        </div>
        <div className="wrp-wks-body">
          <p className="wrp-wks-name">{w.name}</p>
          <p className="wrp-wks-day">{w.day}</p>
          <p className="wrp-wks-tag">{w.tag}</p>
          <div className="wrp-wks-slots">
            {w.slots.map((sl) => (
              <p key={sl.time} className="wrp-wks-slot">
                <span className="wrp-wks-dot" style={{ background: DAY_SKY[sl.sky] }} aria-hidden="true" />
                <b>{sl.time}</b>
                <span>{sl.place}</span>
              </p>
            ))}
          </div>
        </div>
      </article>
    ))}
  </div>
)

// 걱정 묻고 답하기 — 한 장의 계절 편지지 안에, 답의 첫 문장은 굵게("안 시킵니다.")
const FaqSeason = () => {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="wrp-fq">
      {FAQ.map((f, i) => {
        const on = open === i
        const cut = f.a.search(/[.!?]\s/)
        const lead = cut > 0 ? f.a.slice(0, cut + 1) : f.a
        const rest = cut > 0 ? f.a.slice(cut + 1).trim() : ''
        return (
          <div key={f.q} className={`wrp-fq-item${on ? ' is-open' : ''}`}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)}>
              <span className="wrp-fq-q" aria-hidden="true">Q</span>
              <span className="wrp-fq-text">{f.q}</span>
              <Icon name={on ? 'remove' : 'add'} className="wrp-fq-toggle" />
            </button>
            {on && (
              <div className="wrp-fq-answer">
                <p><b>{lead}</b>{rest && ` ${rest}`}</p>
                <p className="wrp-fq-sign">— 참빛교회에서</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 오시기 어려우면 — 위 평일 카드처럼 사진이 있는 카드 두 장.
// 설교 = 그 주일 실제 예배 영상 첫 장면(유튜브 썸네일), 온라인 = 불 켜진 밤 교회(계절 사진)
const LAST_SERMON = { date: '11월 22일', verse: '마가복음 5장 1~5절, 15~20절', service: '주일 3부 예배', pastor: '안동철 담임목사', vid: 'BVYAWrk_U80' }

const MoreSeason = ({ season }: { season: Season }) => (
  <div className="wrp-mo">
    <a className="wrp-mo-card">
      <div className="wrp-mo-photo">
        <img src={`https://img.youtube.com/vi/${LAST_SERMON.vid}/hqdefault.jpg`} alt="" aria-hidden="true" className="wrp-mo-thumb" />
        <span className="wrp-mo-veil" aria-hidden="true" />
        <span className="wrp-mo-play" aria-hidden="true"><Icon name="play_arrow" /></span>
        <span className="wrp-mo-tag">지난 주일 · {LAST_SERMON.date}</span>
      </div>
      <div className="wrp-mo-body">
        <p className="wrp-mo-kicker">놓친 설교, 다시 들어요</p>
        <p className="wrp-mo-title">{LAST_SERMON.verse}</p>
        <p className="wrp-mo-sub">{LAST_SERMON.service} · {LAST_SERMON.pastor}</p>
        <span className="wrp-mo-cta">설교 다시 보기 <Icon name="chevron_right" /></span>
      </div>
    </a>
    <a className="wrp-mo-card">
      <div className="wrp-mo-photo">
        <img src={`/images/visit/scene-${season}-night.webp`} alt="" aria-hidden="true" className="wrp-mo-church" />
        <span className="wrp-mo-veil wrp-mo-veil--night" aria-hidden="true" />
        <span className="wrp-mo-tag"><Icon name="smart_display" /> 유튜브로 함께</span>
        <p className="wrp-mo-photo-line">창마다 불이 켜지면,<br />집에서도 같은 예배예요</p>
      </div>
      <div className="wrp-mo-body">
        <p className="wrp-mo-kicker">온라인 예배</p>
        <p className="wrp-mo-title">멀리 계셔도 같은 시간에</p>
        <p className="wrp-mo-sub">몸이 불편하시거나 멀리 계실 땐 유튜브로 함께 드려요</p>
        <span className="wrp-mo-cta">교회 유튜브 채널 <Icon name="chevron_right" /></span>
      </div>
    </a>
  </div>
)

const VariantA2 = ({ season }: { season: Season }) => {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  // /visit 과 같은 장면 정의 — 사진 + 그 사진 하늘에 맞는 글씨 색(ink). 계절 버튼 미리보기용으로 그 계절 날짜를 넣는다
  const SEASON_DATE: Record<Season, Date> = { spring: new Date(2026, 3, 15), summer: new Date(2026, 6, 15), autumn: new Date(2026, 9, 15), winter: new Date(2026, 0, 15) }
  const sceneDef = visitSceneFor(dark ? 'dark' : 'light', SEASON_DATE[season])!
  const scene = sceneDef.src
  const [pick, setPick] = useState(3)
  const svc = SUNDAY.find((s) => s.order === pick)!
  const boxRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLSpanElement>(null)
  return (
    <div className={`wrp-a wrp-season--${season}`}>
      <section className="wrp-a-hero">
        {/* 계절 입자는 사진 위에서만 — 아래 시간·안내 글자 위로는 지나가지 않게(어지럽다는 피드백) */}
        <div ref={boxRef} className="wrp-a-photo wrp-a2-photo" data-ink={sceneDef.ink} data-ink-m={sceneDef.inkMobile ?? sceneDef.ink}>
          <img src={scene} alt="참빛교회 전경" />
          <span className="wrp-a-shade" aria-hidden="true" />
          <span className="wrp-a2-halo" aria-hidden="true" />
          <LetterSeasonFx key={season} season={season} boxRef={boxRef} targetRef={groundRef} />
          <span ref={groundRef} className="wrp-a2-ground" aria-hidden="true" />
          <div className="wrp-a-copy">
            <p className="wrp-a-kicker">11월 29일 주일 · 대림절 첫째 주일</p>
            <h1>이번 주일,<br />자리 하나 비워둘게요</h1>
            <p className="wrp-a-sub">처음이어도 괜찮아요. 편한 시간을 골라 보세요.</p>
          </div>
        </div>
        <div className={`wrp-a2-panel wrp-season--${season}`}>
          <div>
          <div className="relative">
            <p className="wrp-h2">몇 시에 오실래요?</p>
            <div className="wrp-a2-times" role="radiogroup" aria-label="주일 예배 시간">
              {SUNDAY.map((s) => {
                const on = pick === s.order
                return (
                  <button
                    key={s.order}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`wrp-a2-time${on ? ' is-on' : ''}`}
                    onClick={() => setPick(s.order)}
                  >
                    <span
                      className="wrp-a2-sky"
                      style={{ background: HOUR_SKY[s.order] }}
                      aria-hidden="true"
                    />
                    <span className="wrp-a2-body">
                      <span className="wrp-a2-order">{s.order}부 · {s.name}</span>
                      <span className="wrp-a2-clock"><em>{ampm(s.start)}</em>{hm(s.start)}</span>
                      <span className="wrp-a2-place">{s.place}</span>
                    </span>
                    {on && <span className="wrp-a2-check"><Icon name="check" /></span>}
                  </button>
                )
              })}
            </div>
          </div>
          </div>

          <div className="relative">
            <div className="wrp-a2-morning">
              <p className="wrp-a2-head">
                <span className="wrp-a2-season">{SEASON_KO[season]}</span>
                {SEASON_WALK[season].head}
              </p>
              <p className="wrp-a2-sub">{svc.order}부로 오시면, 그날 아침은 이렇게 흘러가요</p>
              <SeasonWalk key={svc.order} svc={svc} season={season} />
              <div className="wrp-a-actions">
                <a className="wrp-btn wrp-btn--brand"><Icon name="directions" /> 길찾기</a>
                <a className="wrp-btn"><Icon name="event" /> 내 달력에 담기</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrp-sec">
        <h2 className="wrp-h2">평일에도 모여요</h2>
        <p className="wrp-a2-sub wrp-sec-sub">주일 말고도, 하루의 여러 시간에 함께 기도해요</p>
        <WeekdaySky season={season} />
      </section>
      <section className="wrp-sec">
        <h2 className="wrp-h2">솔직히, 걱정되는 것들</h2>
        <p className="wrp-a2-sub wrp-sec-sub">처음 오시는 분들이 가장 많이 물어보셨어요</p>
        <FaqSeason />
      </section>
      <section className="wrp-sec">
        <h2 className="wrp-h2">오시기 어려우면</h2>
        <p className="wrp-a2-sub wrp-sec-sub">주일에 못 오셔도 말씀은 이어져요</p>
        <MoreSeason season={season} />
      </section>
    </div>
  )
}

// ───────────────────────── A ─────────────────────────
const MorningFlow = ({ svc }: { svc: Svc }) => {
  const steps = [
    { t: svc.start - 20, label: '상동역 도착', title: '7호선 상동역에서 걸어서 5분', body: '큰길 따라 오시면 하얀 건물, 금색 "참빛교회" 간판이 보여요. 차로 오셔도 됩니다.' },
    { t: svc.start - 10, label: '입구에서', title: '"처음 왔어요" 한마디면 충분해요', body: `안내하는 분이 ${svc.place}까지 같이 가 드려요. 혼자 조용히 앉으셔도 괜찮아요.` },
    { t: svc.start, label: `${svc.order}부 예배 시작`, title: '앉아서 듣기만 하셔도 됩니다', body: '찬양 가사와 성경 본문은 화면에 다 나와요. 앞에 불려 나가는 일은 없어요.' },
    { t: svc.start + 70, label: '새가족실', title: '따뜻한 커피 한 잔, 원하시면요', body: '잠깐 쉬어 가셔도, 바로 가셔도 됩니다.' },
  ]
  return (
    <ol className="wrp-flow">
      {steps.map((s, i) => (
        <li key={s.label} className="wrp-flow-row" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="wrp-flow-time">
            <em>{ampm(s.t)}</em>
            {hm(s.t)}
          </span>
          <span className="wrp-flow-dot" aria-hidden="true" />
          <div className="min-w-0">
            <p className="wrp-flow-label">{s.label}</p>
            <p className="wrp-flow-title">{s.title}</p>
            <p className="wrp-flow-body">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const WeekdayRows = () => (
  <div className="wrp-wk">
    {WEEKDAY.map((w) => (
      <div key={w.name} className="wrp-wk-row">
        <span className="wrp-wk-icon"><Icon name={w.icon} /></span>
        <div className="min-w-0 flex-1">
          <p className="wrp-wk-name">{w.name} <span className="wrp-pill">{w.day}</span></p>
          <p className="wrp-wk-tag">{w.tag}</p>
        </div>
        <div className="wrp-wk-times">
          {w.times.map((t) => <b key={t}>{t}</b>)}
          {w.place && <span>{w.place}</span>}
        </div>
      </div>
    ))}
  </div>
)

const Faq = () => {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="wrp-faq">
      {FAQ.map((f, i) => (
        <div key={f.q} className={`wrp-faq-item${open === i ? ' is-open' : ''}`}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)}>
            <span>{f.q}</span>
            <Icon name={open === i ? 'remove' : 'add'} />
          </button>
          {open === i && <p>{f.a}</p>}
        </div>
      ))}
    </div>
  )
}

const MoreLinks = () => (
  <div className="wrp-more">
    <a className="wrp-more-card">
      <span className="wrp-more-kicker">지난 주일 설교 · 11월 22일</span>
      <b>마가복음 5장 1~5절, 15~20절</b>
      <span>3부 예배 · 안동철 담임목사</span>
      <span className="wrp-more-cta">설교 다시 보기 <Icon name="chevron_right" /></span>
    </a>
    <a className="wrp-more-card">
      <span className="wrp-more-kicker">온라인 예배</span>
      <b>멀리 계셔도 같은 시간에</b>
      <span>주일 예배를 유튜브로 함께 드려요</span>
      <span className="wrp-more-cta">교회 유튜브 채널 <Icon name="chevron_right" /></span>
    </a>
  </div>
)

const VariantA = () => {
  const scene = useScene()
  const [pick, setPick] = useState(3)
  const svc = SUNDAY.find((s) => s.order === pick)!
  return (
    <div className="wrp-a">
      <section className="wrp-a-hero">
        <div className="wrp-a-photo">
          <img src={scene} alt="참빛교회 전경" />
          <span className="wrp-a-shade" aria-hidden="true" />
          <div className="wrp-a-copy">
            <p className="wrp-a-kicker">11월 29일 주일 · 대림절 첫째 주일</p>
            <h1>이번 주일,<br />자리 하나 비워둘게요</h1>
            <p className="wrp-a-sub">처음이어도 괜찮아요. 편한 시간을 골라 보세요.</p>
          </div>
        </div>
        <div className="wrp-a-panel">
          <p className="wrp-h2">몇 시에 오실래요?</p>
          <div className="wrp-a-times" role="radiogroup" aria-label="주일 예배 시간">
            {SUNDAY.map((s) => (
              <button
                key={s.order}
                type="button"
                role="radio"
                aria-checked={pick === s.order}
                className={`wrp-a-time${pick === s.order ? ' is-on' : ''}`}
                onClick={() => setPick(s.order)}
              >
                <span className="wrp-a-time-order">{s.order}부 · {s.name}</span>
                <span className="wrp-a-time-clock"><em>{ampm(s.start)}</em>{hm(s.start)}</span>
                <span className="wrp-a-time-place">{s.place}</span>
              </button>
            ))}
          </div>

          <div className="wrp-a-morning">
            <p className="wrp-h3">{svc.order}부로 오시면, 그날 아침은 이렇게 흘러가요</p>
            <MorningFlow key={svc.order} svc={svc} />
            <div className="wrp-a-actions">
              <a className="wrp-btn wrp-btn--brand"><Icon name="directions" /> 길찾기</a>
              <a className="wrp-btn"><Icon name="event" /> 내 달력에 담기</a>
            </div>
          </div>
        </div>
      </section>

      <section className="wrp-sec">
        <h2 className="wrp-h2">평일에도 모여요</h2>
        <WeekdayRows />
      </section>
      <section className="wrp-sec">
        <h2 className="wrp-h2">솔직히, 걱정되는 것들</h2>
        <Faq />
      </section>
      <section className="wrp-sec">
        <h2 className="wrp-h2">오시기 어려우면</h2>
        <MoreLinks />
      </section>
      <p className="wrp-note">예배 시간은 사정에 따라 바뀔 수 있어요. 궁금하시면 032-323-1004로 전화 주세요.</p>
    </div>
  )
}

// ───────────────────────── B ─────────────────────────
const VariantB = () => {
  const scene = useScene()
  const [door, setDoor] = useState<'new' | 'regular'>('new')
  return (
    <div className="wrp-b">
      <section className="wrp-b-hero">
        <div className="wrp-b-head">
          <div>
            <p className="wrp-b-date">11월 29일 주일 <span className="wrp-pill wrp-pill--brand">3일 뒤</span></p>
            <h1>주일 예배 시간</h1>
          </div>
          <img src={scene} alt="" aria-hidden="true" className="wrp-b-thumb" />
        </div>
        <div className="wrp-b-times">
          {SUNDAY.map((s) => (
            <div key={s.order} className="wrp-b-time">
              <span className="wrp-b-order">{s.order}부</span>
              <span className="wrp-b-clock"><em>{ampm(s.start)}</em>{hm(s.start)}</span>
              <span className="wrp-b-name">{s.name} · {s.place}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="wrp-b-doors" role="tablist" aria-label="안내 고르기">
        <button type="button" role="tab" aria-selected={door === 'new'} className={`wrp-b-door${door === 'new' ? ' is-on' : ''}`} onClick={() => setDoor('new')}>
          <Icon name="waving_hand" className="wrp-b-door-icon" />
          <span><b>처음 와 봐요</b><small>오는 길부터 예배 후까지</small></span>
        </button>
        <button type="button" role="tab" aria-selected={door === 'regular'} className={`wrp-b-door${door === 'regular' ? ' is-on' : ''}`} onClick={() => setDoor('regular')}>
          <Icon name="church" className="wrp-b-door-icon" />
          <span><b>다니고 있어요</b><small>평일 모임 · 생중계 · 설교</small></span>
        </button>
      </div>

      {door === 'new' ? (
        <div className="wrp-b-panel" key="new">
          <ol className="wrp-b-steps">
            {[
              { n: 1, title: '예배 15분 전쯤 오세요', body: '7호선 상동역에서 걸어서 5분. 차로 오시면 「참빛교회」를 내비게이션에 넣으세요.', cta: '길찾기' },
              { n: 2, title: '입구에서 "처음 왔어요"', body: '안내하는 분이 자리까지 같이 가 드려요. 혼자 앉고 싶으시면 그것도 괜찮아요.' },
              { n: 3, title: '앉아서 듣기만 하셔도 돼요', body: '찬양 가사와 성경 본문은 화면에 다 나와요. 예배는 1시간쯤이에요.' },
              { n: 4, title: '원하시면 새가족실에서 커피 한 잔', body: '바로 가셔도 됩니다. 아무도 붙잡지 않아요.' },
            ].map((s) => (
              <li key={s.n}>
                <span className="wrp-b-num">{s.n}</span>
                <div>
                  <p className="wrp-b-step-title">{s.title}</p>
                  <p className="wrp-b-step-body">{s.body}</p>
                  {s.cta && <a className="wrp-btn wrp-btn--brand mt-3"><Icon name="directions" /> {s.cta}</a>}
                </div>
              </li>
            ))}
          </ol>
          <h2 className="wrp-h2 mt-8">솔직히, 걱정되는 것들</h2>
          <Faq />
        </div>
      ) : (
        <div className="wrp-b-panel" key="regular">
          <div className="wrp-b-live">
            <span className="wrp-live-dot" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <b>다음 예배 · 내일 오전 5:30 새벽기도회</b>
              <span>주일 예배는 유튜브 생중계로도 함께해요</span>
            </div>
            <a className="wrp-btn">생중계 보기</a>
          </div>
          <h2 className="wrp-h2 mt-7">평일에도 모여요</h2>
          <WeekdayRows />
          <h2 className="wrp-h2 mt-8">바로가기</h2>
          <div className="wrp-b-quick">
            {[
              ['play_circle', '지난 주일 설교', '마가복음 5장'],
              ['article', '이번 주 주보', '11월 29일'],
              ['volunteer_activism', '온라인 헌금', '계좌 안내'],
              ['event', '좌석 현황', '주일 실시간'],
            ].map(([ic, t, d]) => (
              <a key={t} className="wrp-b-q"><Icon name={ic} /><b>{t}</b><span>{d}</span></a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── C ─────────────────────────
const Candle = ({ lit, i }: { lit: boolean; i: number }) => (
  <div className={`wrp-candle${lit ? ' is-lit' : ''}`}>
    {lit && <span className="wrp-candle-glow" aria-hidden="true" />}
    <svg viewBox="0 0 24 34" className="wrp-candle-flame" aria-hidden="true">
      <path d="M12 2 C 17 11, 20 17, 12 32 C 4 17, 7 11, 12 2 Z" />
    </svg>
    <span className="wrp-candle-wick" />
    <span className="wrp-candle-body" />
    <span className="wrp-candle-label">{['첫째', '둘째', '셋째', '넷째'][i]}</span>
  </div>
)

const VariantC = () => {
  const scene = useScene(true)
  useEffect(() => { void ensureFontFamily('gowunBatang') }, [])
  return (
    <div className="wrp-c">
      <section className="wrp-c-hero">
        <img src={scene} alt="눈 내린 밤의 참빛교회" />
        <span className="wrp-c-shade" aria-hidden="true" />
        <div className="wrp-c-copy">
          <p className="wrp-c-kicker">대림절 첫째 주일 · 11월 29일</p>
          <h1>빛으로 오실 그분을<br />함께 기다려요</h1>
          <p className="wrp-c-verse">“흑암에 행하던 백성이 큰 빛을 보고” <span>이사야 9:2</span></p>
          <div className="wrp-c-candles" aria-label="대림절 초 네 개 중 첫째 초가 켜졌어요">
            {[0, 1, 2, 3].map((i) => <Candle key={i} i={i} lit={i === 0} />)}
          </div>
        </div>
      </section>

      <section className="wrp-c-invite">
        <p className="wrp-c-invite-head">초 대 합 니 다</p>
        <p className="wrp-c-invite-sub">이번 주일, 편한 시간에 오세요</p>
        <div className="wrp-c-table">
          {SUNDAY.map((s) => (
            <div key={s.order} className="wrp-c-row">
              <span className="wrp-c-order">{s.order}부</span>
              <span className="wrp-c-name">{s.name}</span>
              <span className="wrp-c-dots" aria-hidden="true" />
              <span className="wrp-c-clock">{fmt(s.start)}</span>
              <span className="wrp-c-place">{s.place}</span>
            </div>
          ))}
        </div>
        <p className="wrp-c-sign">부천 상동 · 참빛교회 드림</p>
      </section>

      <section className="wrp-sec">
        <h2 className="wrp-h2">처음 오신 분께 드리는 세 가지 약속</h2>
        <div className="wrp-c-promises">
          {[
            ['아무도 불러내지 않아요', '자기소개 없어요. 앉아서 듣기만 하셔도 됩니다.'],
            ['지금 옷 그대로 오세요', '찬양 가사와 성경은 화면에 다 나와요. 준비물 없어요.'],
            ['커피 한 잔 드릴게요', '예배 뒤 새가족실에서. 바로 가셔도 괜찮아요.'],
          ].map(([t, d], i) => (
            <div key={t} className="wrp-c-promise">
              <span className="wrp-c-promise-n">{i + 1}</span>
              <b>{t}</b>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <div className="wrp-a-actions mt-5">
          <a className="wrp-btn wrp-btn--brand"><Icon name="directions" /> 오시는 길 · 상동역 5분</a>
          <a className="wrp-btn"><Icon name="call" /> 032-323-1004</a>
        </div>
      </section>

      <section className="wrp-sec">
        <h2 className="wrp-h2">평일에도 모여요</h2>
        <WeekdayRows />
      </section>
      <section className="wrp-sec">
        <h2 className="wrp-h2">오시기 어려우면</h2>
        <MoreLinks />
      </section>
    </div>
  )
}

const WorshipRedesignPreview = () => {
  const [params, setParams] = useSearchParams()
  const v = (params.get('v') as VKey) || 'a2'
  const cur = VARIANTS.find((x) => x.key === v) ?? VARIANTS[0]
  const season = (SEASONS as string[]).includes(params.get('s') ?? '') ? (params.get('s') as Season) : 'autumn'
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="wrp-page page-stage">
      <div className="wrp-bar">
        <div className="flex flex-wrap gap-2">
          {VARIANTS.map((x) => (
            <button key={x.key} type="button" className={`wrp-bar-btn${x.key === cur.key ? ' is-on' : ''}`} onClick={() => setParams({ v: x.key })}>
              {x.label}
            </button>
          ))}
        </div>
        <p className="wrp-bar-note">{cur.note}</p>
        {cur.key === 'a2' && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SEASONS.map((x) => (
              <button key={x} type="button" className={`wrp-bar-btn${x === season ? ' is-on' : ''}`} onClick={() => setParams({ v: 'a2', s: x })}>
                {SEASON_KO[x]}
              </button>
            ))}
            <button type="button" className="wrp-bar-btn" onClick={toggleTheme}>{theme === 'dark' ? '낮으로' : '밤으로'}</button>
          </div>
        )}
      </div>
      <div className="wrp-wrap">
        {cur.key === 'a2' && <VariantA2 season={season} />}
        {cur.key === 'a' && <VariantA />}
        {cur.key === 'b' && <VariantB />}
        {cur.key === 'c' && <VariantC />}
      </div>
    </div>
  )
}

export default WorshipRedesignPreview
