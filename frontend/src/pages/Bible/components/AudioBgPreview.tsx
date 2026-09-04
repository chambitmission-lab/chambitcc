import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'

/**
 * DEV 전용 — 오디오북 재생 배경/애니메이션 아이디어 비교용 미리보기.
 * /#/dev/audio-bg 로 접속. 배경 일러스트(webp)는 아직 없으므로 CSS·SVG로 근사해
 * "움직임"만 판단할 수 있게 했다. 컨셉이 정해지면 그 장면을 Gemini 프롬프트로 뽑고
 * 여기 mock 레이어를 실제 이미지 + 같은 애니메이션으로 교체한다.
 */

const DURATION = 235 // 3:55 — 실제 한 장 낭독 길이 감각

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 절 시작 지점(%) — 실제로는 백엔드 VerseTiming에서 온다
const VERSE_MARKS = [4, 11, 18, 24, 31, 38, 45, 52, 58, 65, 71, 78, 84, 91, 96]

/* ─────────────── 순례길: 지형 ───────────────
   진행바를 직선이 아니라 "고갯길"로 만든다. 평지 → 자갈 오르막 → 된비알 →
   고갯마루 → 예배당까지 짧은 내리막. 절반을 넘어서면 길이 가팔라지고,
   양은 몸을 앞으로 기울여 버틴다. 뷰박스 높이는 30. */
const ROAD_KEYS: [number, number][] = [
  [0, 25.5], [0.16, 24.6], [0.3, 23.6], [0.42, 19.5], [0.52, 18.6],
  [0.62, 16.8], [0.72, 11], [0.82, 6.6], [0.9, 5.6], [1, 8],
]
const smoothstep = (x: number) => x * x * (3 - 2 * x)
const roadY = (t: number) => {
  const c = Math.min(1, Math.max(0, t))
  for (let i = 1; i < ROAD_KEYS.length; i++) {
    const [t0, y0] = ROAD_KEYS[i - 1]
    const [t1, y1] = ROAD_KEYS[i]
    if (c <= t1) return y0 + (y1 - y0) * smoothstep((c - t0) / (t1 - t0))
  }
  return ROAD_KEYS[ROAD_KEYS.length - 1][1]
}
const ROAD_D = Array.from({ length: 81 }, (_, i) => {
  const t = i / 80
  return `${i ? 'L' : 'M'}${(t * 1000).toFixed(1)},${roadY(t).toFixed(2)}`
}).join(' ')
const topOf = (t: number) => `${(roadY(t) / 30) * 100}%`

// 길가의 고난 — 자갈·바위·가시덤불·고갯마루 돌무더기
const ROAD_PROPS: { t: number; kind: 'rock' | 'rock-s' | 'thorn' | 'cairn' }[] = [
  { t: 0.22, kind: 'rock-s' },
  { t: 0.38, kind: 'rock' },
  { t: 0.5, kind: 'thorn' },
  { t: 0.58, kind: 'rock-s' },
  { t: 0.68, kind: 'rock' },
  { t: 0.76, kind: 'thorn' },
  { t: 0.87, kind: 'cairn' },
]

/* 순례자 새끼양 — 봇짐을 지고 지팡이를 짚고 등불을 든 옆모습.
   다리·지팡이·등불·숨결이 따로 움직인다. */
const PilgrimLamb = ({ climbing }: { climbing: boolean }) => (
  <span className={`abp-lamb2 ${climbing ? 'is-climbing' : ''}`}>
    <span className="abp-lamb2-glow" />
    <svg viewBox="0 0 38 30" className="abp-lamb2-svg">
      {/* 지팡이 + 등불 — 디딜 때마다 살짝 세워진다 */}
      <g className="abp-l2-staff">
        <path d="M19 25 L31 6.5" className="abp-l2-stick" />
        <path d="M31 6.5 L31 8" className="abp-l2-stick" />
        <path d="M28.8 10 L33.2 10 L32.4 13.4 L29.6 13.4 Z" className="abp-l2-lantern" />
        <circle cx="31" cy="9" r="1" className="abp-l2-lantern-cap" />
      </g>

      {/* 뒷다리 */}
      <g className="abp-l2-leg abp-l2-leg--back">
        <rect x="8.4" y="18.5" width="2.6" height="6" rx="1.3" />
        <circle cx="9.7" cy="24.6" r="1.25" className="abp-l2-hoof" />
      </g>

      {/* 봇짐 — 등에 진 보따리 */}
      <g className="abp-l2-pack">
        <rect x="6" y="6.6" width="8.4" height="7.4" rx="2.8" />
        <path d="M7.6 7 L10.2 4.4 L13.4 7.4" className="abp-l2-tie" />
        <path d="M6.8 10.6 L13.6 10.6" className="abp-l2-tie" />
      </g>

      {/* 몸통 — 뭉게뭉게 양털 */}
      <g className="abp-l2-wool">
        <ellipse cx="17" cy="15.6" rx="9" ry="6.2" />
        <circle cx="10.8" cy="12" r="3.5" />
        <circle cx="16" cy="10.2" r="3.8" />
        <circle cx="21.4" cy="11.4" r="3.5" />
        <circle cx="8.6" cy="16.2" r="3.1" />
        <circle cx="24" cy="15" r="3" />
      </g>

      {/* 고개를 숙인 얼굴 */}
      <ellipse cx="27.4" cy="16.4" rx="4.4" ry="3.8" className="abp-l2-face" />
      <ellipse cx="25.2" cy="12.4" rx="2.2" ry="1.4" className="abp-l2-ear" transform="rotate(-28 25.2 12.4)" />
      <ellipse cx="30.4" cy="18.4" rx="2" ry="1.5" className="abp-l2-muzzle" />
      <circle cx="28.6" cy="15.4" r="0.95" className="abp-l2-eye" />
      <path d="M29.4 17.8 Q30.4 18.6 31.4 17.8" className="abp-l2-smile" />

      {/* 앞다리 — 교차해서 내딛는다 */}
      <g className="abp-l2-leg abp-l2-leg--mid">
        <rect x="14" y="19.5" width="2.6" height="6" rx="1.3" />
        <circle cx="15.3" cy="25.6" r="1.25" className="abp-l2-hoof" />
      </g>
      <g className="abp-l2-leg abp-l2-leg--front">
        <rect x="20" y="19.5" width="2.6" height="6" rx="1.3" />
        <circle cx="21.3" cy="25.6" r="1.25" className="abp-l2-hoof" />
      </g>

      {/* 가쁜 숨 · 땀 한 방울 */}
      <circle cx="34" cy="19.4" r="1.6" className="abp-l2-breath" />
      <ellipse cx="24.4" cy="9.4" rx="1.05" ry="1.5" className="abp-l2-sweat" />
    </svg>
  </span>
)

/* 순례길 전용 진행바 — 길·절 마커·양·예배당이 모두 같은 곡선 위에 있다 */
const PilgrimTrack = ({ pct }: { pct: number }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(300)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const t = Math.min(1, pct / 100)
  // 화면 기준 기울기 → 오르막에서 몸이 앞으로 기운다
  const a = Math.max(0, t - 0.03)
  const b = Math.min(1, t + 0.03)
  const lean = Math.max(-26, Math.min(12, (Math.atan2(roadY(b) - roadY(a), (b - a) * w) * 180) / Math.PI))
  const climbing = lean < -7

  return (
    <div ref={wrapRef} className="abp-road">
      <svg className="abp-road-svg" viewBox="0 0 1000 30" preserveAspectRatio="none">
        <defs>
          <clipPath id="abp-road-clip" clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={t} height="1" />
          </clipPath>
        </defs>
        <path d={ROAD_D} className="abp-road-base" vectorEffect="non-scaling-stroke" />
        <path d={ROAD_D} className="abp-road-done" vectorEffect="non-scaling-stroke" clipPath="url(#abp-road-clip)" />
      </svg>

      {/* 길가의 고난 소품 */}
      {ROAD_PROPS.map((p) => (
        <span key={p.t} className={`abp-prop abp-prop--${p.kind}`} style={{ left: `${p.t * 100}%`, top: topOf(p.t) }} />
      ))}

      {/* 절 마커 — 길 위에 놓인 디딤돌, 지나면 켜진다 */}
      {VERSE_MARKS.map((m) => (
        <span
          key={m}
          className={`abp-mark abp-mark--road ${pct >= m ? 'is-passed' : ''}`}
          style={{ left: `${m}%`, top: topOf(m / 100) }}
        />
      ))}

      {/* 맞바람 — 된비알에서만 분다 */}
      <span className={`abp-wind ${climbing ? 'is-on' : ''}`} style={{ top: topOf(t) }}>
        <i /><i /><i />
      </span>

      {/* 도착 — 고개 너머 예배당 */}
      <span className="abp-goal2" style={{ top: topOf(1), opacity: 0.32 + t * 0.68 }}>
        <svg viewBox="0 0 20 22" className="abp-goal-chapel">
          <path d="M10 1 L10 5 M8.2 2.7 L11.8 2.7" />
          <path d="M3 22 L3 10 L10 4.5 L17 10 L17 22 Z" />
          <rect x="8" y="15" width="4" height="7" rx="1.6" className="abp-goal-door" style={{ opacity: t ** 2 }} />
        </svg>
      </span>

      {/* 순례자 */}
      <div
        className="abp-walker"
        style={{ left: `${pct}%`, top: topOf(t), transform: `translate(-46%,-90%) rotate(${lean}deg)` }}
      >
        <PilgrimLamb climbing={climbing} />
      </div>
    </div>
  )
}

/* ─────────────── 컨셉 1: 순례길 ─────────────── */
const PathScene = () => (
  <div className="abp-scene abp-path">
    <div className="abp-path-sky" />
    <svg className="abp-hill abp-hill--far" viewBox="0 0 400 40" preserveAspectRatio="none">
      <path d="M0,40 L0,22 Q25,8 50,20 T100,18 Q125,6 150,19 T200,17 L200,40 Z M200,40 L200,22 Q225,8 250,20 T300,18 Q325,6 350,19 T400,17 L400,40 Z" />
    </svg>
    <svg className="abp-hill abp-hill--near" viewBox="0 0 400 40" preserveAspectRatio="none">
      <path d="M0,40 L0,30 Q30,20 60,29 T120,27 Q150,17 180,28 T200,30 L200,40 Z M200,40 L200,30 Q230,20 260,29 T320,27 Q350,17 380,28 T400,30 L400,40 Z" />
    </svg>
    {/* 거친 바위 능선 — 고난의 길이라는 신호 */}
    <svg className="abp-hill abp-hill--crag" viewBox="0 0 400 40" preserveAspectRatio="none">
      <path d="M0,40 L0,34 L14,26 L22,32 L36,22 L46,31 L62,24 L74,33 L88,27 L100,34 L118,25 L130,33 L148,28 L164,34 L180,27 L196,33 L200,31 L200,40 Z M200,40 L200,34 L214,26 L222,32 L236,22 L246,31 L262,24 L274,33 L288,27 L300,34 L318,25 L330,33 L348,28 L364,34 L380,27 L396,33 L400,31 L400,40 Z" />
    </svg>
  </div>
)

/* ─────────────── 컨셉 2: 별자리 ─────────────── */
const StarScene = () => (
  <div className="abp-scene abp-stars">
    <span className="abp-nebula abp-nebula--a" />
    <span className="abp-nebula abp-nebula--b" />
    {Array.from({ length: 22 }).map((_, i) => (
      <span
        key={i}
        className="abp-dust"
        style={{
          left: `${(i * 37) % 100}%`,
          top: `${12 + ((i * 53) % 70)}%`,
          animationDelay: `${(i % 7) * 0.5}s`,
          opacity: 0.25 + ((i % 4) * 0.18),
        }}
      />
    ))}
  </div>
)

/* ─────────────── 컨셉 3: 빛의 강 ─────────────── */
const RiverScene = () => (
  <div className="abp-scene abp-river">
    <div className="abp-river-sky" />
    <svg className="abp-wave abp-wave--back" viewBox="0 0 400 30" preserveAspectRatio="none">
      <path d="M0,30 L0,16 Q25,8 50,16 T100,16 T150,16 T200,16 L200,30 Z M200,30 L200,16 Q225,8 250,16 T300,16 T350,16 T400,16 L400,30 Z" />
    </svg>
    <svg className="abp-wave abp-wave--front" viewBox="0 0 400 30" preserveAspectRatio="none">
      <path d="M0,30 L0,20 Q25,13 50,20 T100,20 T150,20 T200,20 L200,30 Z M200,30 L200,20 Q225,13 250,20 T300,20 T350,20 T400,20 L400,30 Z" />
    </svg>
    <span className="abp-reed abp-reed--l" />
    <span className="abp-reed abp-reed--r" />
  </div>
)

/* ─────────────── 재생 헤드 3종 ─────────────── */
const StarHead = () => (
  <span className="abp-head abp-star">
    <span className="abp-star-halo" />
    <span className="abp-star-tail" />
    <svg viewBox="0 0 24 24" className="abp-star-svg">
      <path d="M12 1.5 L14 9.5 L22 12 L14 14.5 L12 22.5 L10 14.5 L2 12 L10 9.5 Z" />
    </svg>
  </span>
)

const BoatHead = () => (
  <span className="abp-head abp-boat">
    <span className="abp-ripple" />
    <span className="abp-ripple abp-ripple--2" />
    <svg viewBox="0 0 22 18" className="abp-boat-svg">
      <path d="M11 1 L11 12" strokeWidth="1.2" />
      <path d="M11 2.5 L17 10 L11 10 Z" className="abp-boat-sail" />
      <path d="M2 11 L20 11 L16.5 16 L5.5 16 Z" />
    </svg>
  </span>
)

/* ─────────────── 플레이어 목업 ─────────────── */
interface DemoProps {
  concept: 'path' | 'stars' | 'river'
  playing: boolean
  time: number
  onToggle: () => void
}

const PlayerDemo = ({ concept, playing, time, onToggle }: DemoProps) => {
  const pct = Math.min(100, (time / DURATION) * 100)
  return (
    <div className={`abp-card abp-card--${concept} ${playing ? 'is-playing' : ''}`}>
      {concept === 'path' && <PathScene />}
      {concept === 'stars' && <StarScene />}
      {concept === 'river' && <RiverScene />}

      <div className="relative px-3 py-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? '일시정지' : '재생'}
            className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_6px_16px_-5px_var(--brand-glow)] transition active:scale-95"
          >
            {playing && <span className="absolute inset-0 rounded-full bg-[var(--brand-glow)] animate-ping [animation-duration:1.6s]" />}
            <span className="material-icons-round relative text-[24px] leading-none">
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="material-icons-round flex-shrink-0 text-[15px] text-brand">headphones</span>
                <span className="flex-shrink-0 whitespace-nowrap text-[13px] font-extrabold tracking-tight text-brand">오디오북</span>
                <span className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                  · {playing ? '재생 중 · 12절' : '듣기'}
                </span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap">
                <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-bold text-brand">1.25×</span>
              </span>
            </div>

            {/* 진행바 */}
            {concept === 'path' ? <PilgrimTrack pct={pct} /> : (
            <div className="abp-track">
              <div className="abp-track-base" />
              <div className="abp-track-fill" style={{ width: `${pct}%` }} />
              {/* 절 마커 — 지나간 절은 켜진다 */}
              {VERSE_MARKS.map((m) => (
                <span
                  key={m}
                  className={`abp-mark ${pct >= m ? 'is-passed' : ''}`}
                  style={{ left: `${m}%` }}
                />
              ))}
              {/* 목적지 — 가까워질수록 밝아진다 */}
              <span className="abp-goal" style={{ opacity: 0.3 + (pct / 100) * 0.7 }}>
                {concept === 'stars' && <span className="material-icons-round abp-goal-spark">auto_awesome</span>}
                {concept === 'river' && (
                  <svg viewBox="0 0 14 22" className="abp-goal-lamp">
                    <path d="M7 22 L7 8" />
                    <circle cx="7" cy="5" r="3.4" className="abp-goal-lamp-bulb"
                      style={{ opacity: 0.25 + (pct / 100) * 0.75 }} />
                  </svg>
                )}
              </span>
              <div className="abp-playhead" style={{ left: `${pct}%` }}>
                {concept === 'stars' && <StarHead />}
                {concept === 'river' && <BoatHead />}
              </div>
            </div>
            )}

            <div className="mt-1 flex items-center justify-between text-[10.5px] font-medium tabular-nums text-gray-400 dark:text-white/45">
              <span>{fmt(time)}</span>
              <span>{fmt(DURATION)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CONCEPTS: { key: 'path' | 'stars' | 'river'; title: string; desc: string; anim: string }[] = [
  {
    key: 'path',
    title: '① 순례길 — 진행바가 곧 길이다',
    desc: '진행바가 직선이 아니라 고갯길이다. 평지 → 자갈 오르막 → 된비알 → 고갯마루 → 예배당. 봇짐 지고 지팡이 짚은 새끼양이 오르막에선 몸을 기울이고 숨을 몰아쉰다.',
    anim: '능선 3겹 패럴랙스 · 경사에 따라 양의 몸이 기울고 걸음이 느려짐 · 지팡이 짚기 · 된비알에서만 맞바람·가쁜 숨·땀 · 등불 호흡 · 길가 바위·가시덤불·고갯마루 돌무더기 · 절 디딤돌 점등 · 예배당 창에 불',
  },
  {
    key: 'stars',
    title: '② 별자리 — 들을수록 별이 이어진다',
    desc: '지금 쓰는 네 갈래 별 헤드를 그대로 살린 밤하늘. 지나온 절마다 별이 하나씩 켜지며 한 장을 다 들으면 별자리가 완성된다.',
    anim: '성운 2겹 느린 표류 · 별먼지 반짝임(각자 다른 딜레이) · 혜성 꼬리 · 지나간 절 별 점등 + 잔광 · 진행률에 따라 달이 밝아짐',
  },
  {
    key: 'river',
    title: '③ 빛의 강 — 말씀이 흐른다',
    desc: '진행바가 수면. 작은 돛단배가 강을 거슬러 오르고 양옆으로 갈대가 흔들린다. 소리와 물결의 은유.',
    anim: '물결 2겹이 서로 다른 속도로 흐름 · 배의 흔들림(roll) · 뱃머리에서 파문이 규칙적으로 퍼짐 · 갈대 산들바람',
  },
]

const AudioBgPreview = () => {
  const { theme, toggleTheme } = useTheme()
  const [zoom, setZoom] = useState(false)
  const [playing, setPlaying] = useState<Record<string, boolean>>({ path: true, stars: true, river: true })
  const [time, setTime] = useState<Record<string, number>>({ path: 12, stars: 12, river: 12 })

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime((prev) => {
        const next = { ...prev }
        for (const k of Object.keys(next)) {
          if (playing[k]) next[k] = next[k] + 0.5 >= DURATION ? 0 : next[k] + 0.5
        }
        return next
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [playing])

  return (
    <div className="abp-page min-h-screen pb-24">
      <style>{CSS}</style>

      <div className="abp-topbar">
        <div>
          <h1 className="abp-h1">오디오북 배경·애니메이션 시안</h1>
          <p className="abp-sub">재생 중일 때만 움직입니다 · 일시정지하면 전부 멈춤</p>
        </div>
        <span className="flex flex-shrink-0 gap-1.5">
          <button type="button" onClick={() => setZoom((v) => !v)} className="abp-themebtn">
            {zoom ? '원래 크기' : '확대'}
          </button>
          <button type="button" onClick={toggleTheme} className="abp-themebtn">
            {theme === 'dark' ? '라이트로' : '다크로'}
          </button>
        </span>
      </div>

      <div className={`mx-auto max-w-md ${zoom ? 'abp-zoom' : ''}`}>
        {CONCEPTS.map((c) => (
          <section key={c.key} className="mt-6">
            <h2 className="abp-h2">{c.title}</h2>
            <p className="abp-desc">{c.desc}</p>
            <PlayerDemo
              concept={c.key}
              playing={!!playing[c.key]}
              time={time[c.key] ?? 0}
              onToggle={() => setPlaying((p) => ({ ...p, [c.key]: !p[c.key] }))}
            />
            <p className="abp-anim">
              <b>애니메이션</b> · {c.anim}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}

const CSS = `
.abp-page{background:var(--surface);}
.abp-zoom{margin-left:0 !important;max-width:100% !important;}
.abp-zoom .abp-card{width:330px;transform:scale(3);transform-origin:left top;margin-bottom:170px;}
.abp-topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding:12px 16px;background:var(--surface-container);border-bottom:1px solid rgba(0,0,0,.06);}
.dark .abp-topbar{border-bottom-color:rgba(255,255,255,.1);}
.abp-h1{font-size:15px;font-weight:800;color:var(--text-body);}
.abp-h2{padding:0 16px;font-size:14px;font-weight:800;color:var(--text-body);}
.abp-sub{font-size:11px;color:var(--text-muted);}
.abp-desc{margin-top:4px;padding:0 16px;font-size:12px;line-height:1.7;color:var(--text-muted);}
.abp-anim{padding:0 16px;font-size:11px;line-height:1.7;color:var(--text-muted);}
.abp-anim b{color:var(--brand);}
.abp-themebtn{flex-shrink:0;border-radius:9999px;border:1px solid rgba(0,0,0,.1);padding:4px 12px;
  font-size:12px;font-weight:700;color:var(--text-body);background:transparent;}
.dark .abp-themebtn{border-color:rgba(255,255,255,.2);}

.abp-card{position:relative;margin:10px 12px;border-radius:16px;overflow:hidden;
  border:1px solid var(--card-border);background:var(--surface-container);
  box-shadow:0 8px 24px -14px var(--brand-glow);}

.abp-scene{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.abp-scene *{animation-play-state:paused;}
.abp-card.is-playing .abp-scene *{animation-play-state:running;}
.abp-card .abp-head *,.abp-card .abp-road *{animation-play-state:paused;}
.abp-card.is-playing .abp-head *,.abp-card.is-playing .abp-head,
.abp-card.is-playing .abp-road *{animation-play-state:running;}

/* ── 진행바 공통 ── */
.abp-track{position:relative;height:14px;}
.abp-track-base{position:absolute;left:0;right:0;top:50%;height:4px;transform:translateY(-50%);
  border-radius:9999px;background:rgba(0,0,0,.10);}
.dark .abp-track-base{background:rgba(255,255,255,.14);}
.abp-track-fill{position:absolute;left:0;top:50%;height:4px;transform:translateY(-50%);
  border-radius:9999px;background:var(--brand);transition:width .12s linear;}
.abp-mark{position:absolute;top:50%;width:2px;height:2px;margin-left:-1px;border-radius:9999px;
  transform:translateY(-50%);background:rgba(0,0,0,.16);transition:all .35s ease;}
.dark .abp-mark{background:rgba(255,255,255,.2);}
.abp-mark.is-passed{width:3px;height:3px;margin-left:-1.5px;background:#fff;
  box-shadow:0 0 5px var(--brand-glow);}
.abp-goal{position:absolute;left:100%;top:50%;transform:translate(-45%,-62%);pointer-events:none;
  transition:opacity .4s ease;}
.abp-goal-chapel,.abp-goal-lamp{display:block;width:15px;height:17px;
  fill:none;stroke:var(--brand);stroke-width:1.4;stroke-linejoin:round;stroke-linecap:round;}
.dark .abp-goal-chapel,.dark .abp-goal-lamp{stroke:rgba(190,215,255,.85);}
.abp-goal-door{fill:#fbbf24;stroke:none;filter:drop-shadow(0 0 4px rgba(251,191,36,.9));}
.abp-goal-lamp-bulb{fill:#fde68a;stroke:none;filter:drop-shadow(0 0 5px rgba(251,191,36,.85));}
.abp-goal-spark{display:block;font-size:13px;line-height:1;color:var(--brand);}
.dark .abp-goal-spark{color:#fff;}
.abp-playhead{position:absolute;top:50%;transform:translate(-50%,-50%);transition:left .12s linear;}
.abp-head{position:relative;display:block;}

/* ── ① 순례길 ── */
.abp-path-sky{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(49,130,246,.10) 0%,rgba(49,130,246,.03) 45%,rgba(255,255,255,0) 75%);}
.dark .abp-path-sky{background:linear-gradient(180deg,rgba(69,147,252,.16) 0%,rgba(69,147,252,.04) 50%,rgba(0,0,0,0) 80%);}
.abp-hill{position:absolute;bottom:0;left:0;width:200%;height:44px;}
.abp-hill path{fill:rgba(49,130,246,.14);}
.dark .abp-hill path{fill:rgba(69,147,252,.13);}
.abp-hill--far{animation:abp-drift 46s linear infinite;height:52px;opacity:.75;}
.abp-hill--near{animation:abp-drift 24s linear infinite;}
.abp-hill--crag{animation:abp-drift 15s linear infinite;height:30px;}
.abp-hill--crag path{fill:rgba(49,130,246,.24);}
.dark .abp-hill--crag path{fill:rgba(80,110,170,.3);}
.abp-hill--near path{fill:rgba(49,130,246,.2);}
.dark .abp-hill--near path{fill:rgba(69,147,252,.2);}
@keyframes abp-drift{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── ① 순례길: 고갯길 진행바 ── */
.abp-road{position:relative;height:30px;}
.abp-road-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
.abp-road-base{fill:none;stroke:rgba(0,0,0,.16);stroke-width:3.5;stroke-linecap:round;stroke-dasharray:5 7;}
.dark .abp-road-base{stroke:rgba(255,255,255,.2);}
.abp-road-done{fill:none;stroke:var(--brand);stroke-width:4;stroke-linecap:round;
  filter:drop-shadow(0 0 5px var(--brand-glow));}
.abp-mark--road{margin-top:-1px;}

/* 길가의 고난 소품 — 자갈·바위·가시덤불·돌무더기 */
.abp-prop{position:absolute;transform:translate(-50%,-100%);pointer-events:none;opacity:.55;}
.dark .abp-prop{opacity:.5;}
.abp-prop--rock,.abp-prop--rock-s{width:7px;height:5px;border-radius:60% 60% 30% 30%/80% 80% 20% 20%;
  background:rgba(0,0,0,.22);}
.abp-prop--rock-s{width:4px;height:3px;}
.dark .abp-prop--rock,.dark .abp-prop--rock-s{background:rgba(255,255,255,.24);}
/* 가시덤불 — 톱니 실루엣 */
.abp-prop--thorn{width:10px;height:7px;background:rgba(0,0,0,.26);
  clip-path:polygon(0% 100%,10% 62%,20% 78%,30% 30%,40% 66%,50% 12%,60% 58%,70% 34%,80% 70%,90% 48%,100% 100%);}
.dark .abp-prop--thorn{background:rgba(255,255,255,.28);}
.abp-prop--cairn{width:6px;height:11px;
  background:
    radial-gradient(circle at 50% 12%,rgba(0,0,0,.28) 42%,transparent 44%),
    radial-gradient(circle at 50% 46%,rgba(0,0,0,.24) 46%,transparent 48%),
    radial-gradient(circle at 50% 84%,rgba(0,0,0,.3) 50%,transparent 52%);}
.dark .abp-prop--cairn{background:
    radial-gradient(circle at 50% 12%,rgba(255,255,255,.3) 42%,transparent 44%),
    radial-gradient(circle at 50% 46%,rgba(255,255,255,.26) 46%,transparent 48%),
    radial-gradient(circle at 50% 84%,rgba(255,255,255,.32) 50%,transparent 52%);}

/* 맞바람 — 된비알 구간에서만 */
.abp-wind{position:absolute;left:0;width:100%;height:0;opacity:0;transition:opacity .5s ease;}
.abp-wind.is-on{opacity:1;}
.abp-wind i{position:absolute;height:1.5px;border-radius:9999px;
  background:linear-gradient(to left,rgba(49,130,246,.55),transparent);
  animation:abp-gust 1.8s linear infinite;}
.dark .abp-wind i{background:linear-gradient(to left,rgba(190,215,255,.6),transparent);}
.abp-wind i:nth-child(1){width:16px;top:-14px;animation-delay:0s;}
.abp-wind i:nth-child(2){width:11px;top:-7px;animation-delay:-.7s;}
.abp-wind i:nth-child(3){width:20px;top:-20px;animation-delay:-1.2s;}
@keyframes abp-gust{0%{transform:translateX(60px);opacity:0}
  20%{opacity:.9}80%{opacity:.5}100%{transform:translateX(-30px);opacity:0}}

/* 도착 예배당 */
.abp-goal2{position:absolute;right:0;transform:translate(40%,-100%);pointer-events:none;
  transition:opacity .4s ease;}

/* 순례자 */
.abp-walker{position:absolute;transform-origin:46% 100%;pointer-events:none;
  transition:left .12s linear,top .12s linear,transform .3s ease-out;}
.abp-lamb2{position:relative;display:block;animation:abp-trudge .72s ease-in-out infinite;}
.abp-lamb2.is-climbing{animation-duration:1.05s;}
.abp-lamb2-svg{display:block;width:38px;height:30px;overflow:visible;
  filter:drop-shadow(0 1.5px 2px rgba(0,0,0,.22));}
/* 색은 마스코트(title-bg 양)와 맞춘다 — 따뜻한 흰 양털, 크림색 얼굴, 검은 발굽 */
.abp-l2-wool ellipse,.abp-l2-wool circle{fill:#fdfbf7;stroke:rgba(90,74,52,.18);stroke-width:.5;}
.dark .abp-l2-wool ellipse,.dark .abp-l2-wool circle{fill:#f2eee6;stroke:rgba(0,0,0,.3);}
.abp-l2-face{fill:#f1e2c6;stroke:rgba(90,74,52,.28);stroke-width:.5;}
.abp-l2-ear{fill:#e0cba6;}
.abp-l2-muzzle{fill:#e6d3b0;}
.abp-l2-eye{fill:#33302b;}
.abp-l2-smile{fill:none;stroke:#7a6a52;stroke-width:.7;stroke-linecap:round;}
.abp-l2-leg{transform-origin:50% 19px;animation:abp-step2 .72s ease-in-out infinite;}
.abp-l2-leg rect{fill:#ece0c8;stroke:rgba(90,74,52,.22);stroke-width:.5;}
.abp-l2-hoof{fill:#33302b;}
.abp-lamb2.is-climbing .abp-l2-leg{animation-duration:1.05s;}
.abp-l2-leg--mid{animation-delay:-.36s;}
.abp-l2-leg--back{animation-delay:-.18s;transform-origin:50% 18.5px;}
.abp-l2-pack rect{fill:#c98b4b;stroke:rgba(80,50,20,.3);stroke-width:.5;}
.dark .abp-l2-pack rect{fill:#b57f42;}
.abp-l2-tie{fill:none;stroke:#8a5a2b;stroke-width:1;stroke-linecap:round;}
.abp-l2-stick{fill:none;stroke:#8a5a2b;stroke-width:1.6;stroke-linecap:round;}
.dark .abp-l2-stick{stroke:#c1935f;}
.abp-l2-staff{transform-origin:19px 25px;animation:abp-plant .72s ease-in-out infinite;}
.abp-lamb2.is-climbing .abp-l2-staff{animation-duration:1.05s;}
.abp-l2-lantern{fill:#fde68a;stroke:#f59e0b;stroke-width:.7;
  filter:drop-shadow(0 0 4px rgba(251,191,36,.95));}
.abp-l2-lantern-cap{fill:#8a5a2b;}
.abp-lamb2-glow{position:absolute;left:23px;top:2px;width:22px;height:22px;border-radius:9999px;
  background:radial-gradient(circle,rgba(253,230,138,.6),transparent 68%);
  animation:abp-lampbreathe 2.4s ease-in-out infinite;}
.abp-l2-breath{fill:rgba(255,255,255,.85);opacity:0;}
.dark .abp-l2-breath{fill:rgba(255,255,255,.6);}
.abp-lamb2.is-climbing .abp-l2-breath{animation:abp-breath 1.6s ease-out infinite;}
.abp-l2-sweat{fill:#93c5fd;opacity:0;}
.abp-lamb2.is-climbing .abp-l2-sweat{animation:abp-sweat 2.2s ease-in infinite;}
@keyframes abp-trudge{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes abp-step2{0%,100%{transform:rotate(15deg)}50%{transform:rotate(-15deg)}}
@keyframes abp-plant{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(5deg)}}
@keyframes abp-lampbreathe{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.12)}}
@keyframes abp-breath{0%{opacity:.7;transform:translate(0,0) scale(.5)}
  100%{opacity:0;transform:translate(5px,-3px) scale(1.5)}}
@keyframes abp-sweat{0%,72%{opacity:0;transform:translate(0,0)}
  80%{opacity:.9}100%{opacity:0;transform:translate(3px,-7px)}}

/* ── ② 별자리 ── */
.abp-stars{background:linear-gradient(180deg,rgba(49,130,246,.14),rgba(129,140,248,.06) 55%,rgba(255,255,255,0) 80%);}
.dark .abp-stars{background:linear-gradient(180deg,#1b2340,#151824 60%,#201f1f);}
.abp-nebula{position:absolute;width:120px;height:70px;border-radius:9999px;filter:blur(18px);opacity:.5;}
.abp-nebula--a{left:-20px;top:-16px;background:rgba(49,130,246,.35);animation:abp-float-a 26s ease-in-out infinite;}
.abp-nebula--b{right:-24px;bottom:-24px;background:rgba(129,140,248,.3);animation:abp-float-b 34s ease-in-out infinite;}
.dark .abp-nebula--a{background:rgba(69,147,252,.4);}
@keyframes abp-float-a{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,8px)}}
@keyframes abp-float-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,-10px)}}
.abp-dust{position:absolute;width:2px;height:2px;border-radius:9999px;background:var(--brand);
  animation:abp-twinkle 2.6s ease-in-out infinite;}
.dark .abp-dust{background:#fff;}
@keyframes abp-twinkle{0%,100%{opacity:.15;transform:scale(.7)}50%{opacity:1;transform:scale(1.3)}}
.abp-star-svg{display:block;width:15px;height:15px;fill:var(--brand);
  stroke:#fafafa;stroke-width:4;paint-order:stroke;stroke-linejoin:round;
  filter:drop-shadow(0 0 6px var(--brand-glow));}
.dark .abp-star-svg{fill:#fff;stroke:#201f1f;}
.abp-star-halo{position:absolute;left:50%;top:50%;width:22px;height:22px;transform:translate(-50%,-50%);
  border-radius:9999px;background:var(--brand-glow);filter:blur(4px);
  animation:abp-pulse 1.6s ease-in-out infinite;}
@keyframes abp-pulse{0%,100%{opacity:.45;transform:translate(-50%,-50%) scale(.85)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}}
.abp-star-tail{position:absolute;right:50%;top:50%;width:34px;height:2px;transform:translateY(-50%);
  border-radius:9999px;background:linear-gradient(to left,var(--brand),transparent);opacity:.85;}
.dark .abp-star-tail{background:linear-gradient(to left,#fff,transparent);}

/* ── ③ 빛의 강 ── */
.abp-river-sky{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(56,189,248,.10),rgba(49,130,246,.05) 60%,rgba(255,255,255,0));}
.dark .abp-river-sky{background:linear-gradient(180deg,rgba(56,189,248,.12),rgba(32,31,31,0) 70%);}
.abp-wave{position:absolute;bottom:0;left:0;width:200%;height:34px;}
.abp-wave path{fill:rgba(49,130,246,.13);}
.dark .abp-wave path{fill:rgba(56,189,248,.16);}
.abp-wave--back{animation:abp-drift 18s linear infinite;opacity:.7;height:40px;}
.abp-wave--front{animation:abp-drift 9s linear infinite reverse;}
.abp-wave--front path{fill:rgba(49,130,246,.18);}
.abp-reed{position:absolute;bottom:2px;width:2px;height:16px;border-radius:9999px;
  background:linear-gradient(to top,rgba(49,130,246,.35),transparent);transform-origin:bottom center;
  animation:abp-sway 3.4s ease-in-out infinite;}
.abp-reed--l{left:14px;}
.abp-reed--r{right:38px;height:12px;animation-delay:-1.2s;}
@keyframes abp-sway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
.abp-boat-svg{display:block;width:20px;height:16px;fill:#fff;stroke:var(--brand);stroke-width:1;
  filter:drop-shadow(0 1px 3px rgba(0,0,0,.25));}
.dark .abp-boat-svg{fill:#f4f4f5;stroke:#93c5fd;}
.abp-boat-sail{fill:var(--brand);}
.abp-boat{display:block;animation:abp-roll 2.2s ease-in-out infinite;}
@keyframes abp-roll{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(5deg) translateY(-1.5px)}}
.abp-ripple{position:absolute;left:50%;top:70%;width:10px;height:10px;margin:-5px 0 0 -5px;
  border-radius:9999px;border:1.5px solid var(--brand);opacity:0;animation:abp-ripple 2.4s ease-out infinite;}
.abp-ripple--2{animation-delay:-1.2s;}
@keyframes abp-ripple{0%{opacity:.7;transform:scale(.3)}100%{opacity:0;transform:scale(2.6)}}

@media (prefers-reduced-motion:reduce){
  .abp-scene *,.abp-head,.abp-head *,.abp-road *{animation:none !important;}
}
`

export default AudioBgPreview
