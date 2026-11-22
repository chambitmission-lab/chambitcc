import { useEffect, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { pairSrc, RAIL_BOTTOM } from '../../utils/themeAssets'
import RailTree from '../../components/layout/DesktopNavRail/railWeather/RailTree'
import RailWeatherFx from '../../components/layout/DesktopNavRail/railWeather/RailWeatherFx'
import type { RailSceneMode } from '../../components/layout/DesktopNavRail/railWeather/railWeatherScene'
import type { TreePlacement } from '../../components/layout/DesktopNavRail/railWeather/railTreeScene'
import { armTreeStrike } from '../../components/layout/DesktopNavRail/railWeather/railStrike'
import '../../components/layout/DesktopNavRail/DesktopNavRail.css'
import './railSeasonsPreview.css'

/**
 * /#/dev/rail-seasons — PC 좌측 레일 하단 삽화에 사계절 나무 한 그루 (2026-11-22 시연).
 * 예배당 왼쪽 앞 언덕. 수채 번짐으로 칠한 나무가 날짜에 따라 하루하루 바뀐다.
 *   봄 4/12  — 가지 끝 눈 → 꽃이 피어나고 언덕에 새싹이 돋는다, 꽃잎 날림
 *   여름 7/15 — 짙은 초록 수관, 바람에 살짝 흔들림
 *   가을 11/5 — 물든 잎이 성글어지며 한 장씩 떨어져 밑동에 쌓인다(가끔 바람에 몇 장 한꺼번에)
 *   겨울 1/12 — 빈 가지, 눈이 오면 가지 윗면·오금에 눈이 소복이 쌓인다
 * 마지막 칸은 날짜를 끌어 한 해를 흘려 볼 수 있다.
 */

const year = new Date().getFullYear()
const d = (m: number, day: number) => new Date(year, m - 1, day, 12)

const PANELS: { key: string; title: string; note: string; date: Date; mode: RailSceneMode | null }[] = [
  { key: 'spring', title: '봄 · 4월 12일', note: '꽃이 피어나고 언덕에 새싹이 돋는다. 꽃잎이 가끔 날린다', date: d(4, 12), mode: null },
  { key: 'summer', title: '여름 · 7월 15일', note: '짙은 초록 수관이 바람에 아주 살짝 흔들린다', date: d(7, 15), mode: null },
  { key: 'autumn', title: '가을 · 11월 5일', note: '물든 잎이 한 장씩 떨어져 밑동에 쌓인다. 가끔 바람에 몇 장 한꺼번에', date: d(11, 5), mode: null },
  { key: 'rain', title: '비 오는 날 · 가을', note: '빗속의 등불 — 나무가 조금 더 흔들리고 잎이 더 잦게 진다', date: d(11, 5), mode: 'rain' },
  { key: 'storm', title: '천둥번개 · 가을', note: '돌풍에 나무가 흔들리고 번개가 친다. 다크에서는 아주 드물게(3%) 나무가 번개를 맞아 불이 붙었다가 빗속에 꺼진다', date: d(11, 5), mode: 'storm' },
  { key: 'winter', title: '겨울 · 눈 오는 날', note: '빈 가지 윗면·갈라진 오금에 눈이 소복이 쌓인다(약 25초)', date: d(1, 12), mode: 'snow' },
]

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function Art({ date, mode, round, placement }: { date: Date; mode: RailSceneMode | null; round: number; placement: TreePlacement }) {
  const { theme } = useTheme()
  const src = pairSrc(RAIL_BOTTOM, theme)
  return (
    <div className="rsn-rail">
      <div className="rail-bottom-art is-loaded rsn-art" style={{ backgroundImage: `url(${src})` }}>
        {mode && <RailWeatherFx key={`w${round}`} src={src} theme={theme} forceMode={mode} />}
        <RailTree key={`t${round}-${placement}`} theme={theme} date={date} weatherMode={mode} placement={placement} demo />
      </div>
    </div>
  )
}

function YearScrubber({ placement }: { placement: TreePlacement }) {
  const [doy, setDoy] = useState(310)
  const [playing, setPlaying] = useState(false)
  const date = new Date(year, 0, 1 + doy, 12)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setDoy((v) => (v + 1) % 365), 90)
    return () => clearInterval(id)
  }, [playing])
  return (
    <figure className="rsn-col">
      <figcaption>
        <b>한 해 흘려 보기 · {MONTH_NAMES[date.getMonth()]} {date.getDate()}일</b>
        <span>계절은 칸막이가 아니라 하루하루 이어진다 — 끌거나 ▶ 로 흘려 보세요</span>
      </figcaption>
      <Art date={date} mode={null} round={0} placement={placement} />
      <div className="rsn-scrub">
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? '멈춤' : '재생'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <input type="range" min={0} max={364} value={doy} onChange={(e) => setDoy(Number(e.target.value))} />
      </div>
    </figure>
  )
}

export default function RailSeasonsPreview() {
  const { theme, toggleTheme } = useTheme()
  const [round, setRound] = useState(0)
  const [placement, setPlacement] = useState<TreePlacement>('front')
  return (
    <div className="rsn-page">
      <header className="rsn-head">
        <div>
          <h1>레일 삽화 · 사계절 나무 시연</h1>
          <p>나무 자리는 1차 앞 언덕으로 확정. 비·천둥번개 칸은 가을 나무로 보여 줍니다.</p>
        </div>
        <div className="rsn-actions">
          <button type="button" aria-pressed={placement === 'back'} className={placement === 'back' ? 'is-on' : ''} onClick={() => setPlacement('back')}>
            왼쪽 뒷언덕
          </button>
          <button type="button" aria-pressed={placement === 'front'} className={placement === 'front' ? 'is-on' : ''} onClick={() => setPlacement('front')}>
            앞 언덕(확정)
          </button>
          <button type="button" onClick={() => setRound((r) => r + 1)}>처음부터 다시</button>
          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') toggleTheme()
              armTreeStrike()
            }}
          >
            ⚡ 다음 번개를 나무에
          </button>
          <button type="button" onClick={toggleTheme}>{theme === 'dark' ? '라이트로 보기' : '다크로 보기'}</button>
        </div>
      </header>
      <div className="rsn-grid">
        {PANELS.map((p) => (
          <figure key={p.key} className="rsn-col">
            <figcaption>
              <b>{p.title}</b>
              <span>{p.note}</span>
            </figcaption>
            <Art date={p.date} mode={p.mode} round={round} placement={placement} />
          </figure>
        ))}
        <YearScrubber placement={placement} />
      </div>
    </div>
  )
}
