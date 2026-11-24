import { useState } from 'react'
import {
  BookOpenText,
  House,
  ImageSquare,
  Path,
  Timer,
  UserCircle,
  UsersThree,
} from '../../components/icons/phosphor'
import './railMenuPreview.css'

/**
 * /#/dev/rail-menu — PC 좌측 레일 메뉴 "지금 있는 자리" 표시 개편 시안 (2026-11-24).
 * 파란 유광 인장 타일이 참빛교회 느낌이 아니라는 피드백. 1차 '언덕길+등불빛'은 반려.
 * 한 화면에서 라이트·다크를 함께 본다. 메뉴를 눌러 활성 자리를 옮겨 볼 수 있다.
 *   now 지금 / a 주보 차례 / b 아치 창 / c 수채 붓자국 / d 소인
 */
type V = 'now' | 'a' | 'b' | 'c' | 'd'

const VARIANTS: { v: V; title: string; note: string }[] = [
  { v: 'now', title: '지금', note: '파란 유광 인장 타일 + 점선 + 후광' },
  { v: 'a', title: 'A · 주보 차례', note: '명조 라벨, 얇은 괘선 묶음 제목, 지금 자리엔 가름끈. 아이콘은 물러선다' },
  { v: 'b', title: 'B · 아치 창', note: '예배당 창 모양의 플랫 블루. 광택·점선·후광 없이 모양만으로' },
  { v: 'c', title: 'C · 수채 붓자국', note: '아래 언덕과 같은 물감으로 줄 전체를 한 번 쓸어 칠한다' },
  { v: 'd', title: 'D · 소인', note: '우체국 도장 — 잉크 링과 물결 소인이 라벨 뒤로 지나간다' },
]

const SECTIONS = [
  {
    label: '매일',
    items: [
      { key: 'home', label: '홈', Icon: House },
      { key: 'bible', label: '성경', Icon: BookOpenText, status: '마태복음 19장 이어 읽기', tone: 'muted' },
      { key: 'focus', label: '집중 기도', Icon: Timer },
    ],
  },
  {
    label: '함께',
    items: [
      { key: 'card', label: '말씀 카드', Icon: ImageSquare },
      { key: 'groups', label: '모임', Icon: UsersThree },
    ],
  },
  {
    label: '나',
    items: [
      { key: 'growth', label: '신앙 여정', Icon: Path, status: '연속 121일째', tone: 'amber' },
      { key: 'profile', label: '프로필', Icon: UserCircle },
    ],
  },
] as const

function Mock({ v, theme, active, onPick }: { v: V; theme: 'light' | 'dark'; active: string; onPick: (k: string) => void }) {
  return (
    <div
      data-theme={theme}
      data-v={v}
      // 지금 안의 다크 인장 보정은 .desktop-rail 아래에서만 걸린다
      className={`rmv-rail chrome-type${v === 'now' && theme === 'dark' ? ' desktop-rail' : ''}`}
    >
      {SECTIONS.map((sec) => (
        <div key={sec.label} className="rmv-sec">
          <span className="rmv-sec-label">{sec.label}</span>
          {sec.items.map((it) => {
            const on = it.key === active
            const tiled = on && (v === 'now' || v === 'b')
            return (
              <button key={it.key} type="button" className="rmv-item" data-on={on || undefined} onClick={() => onPick(it.key)}>
                {on && v === 'c' && <span className="rmv-brush" aria-hidden />}
                {on && v === 'd' && (
                  <svg className="rmv-waves" viewBox="0 0 150 30" aria-hidden>
                    {[5, 12, 19, 26].map((y) => (
                      <path key={y} d={`M0 ${y}q9 -4 18 0t18 0t18 0t18 0t18 0t18 0t18 0t18 0`} />
                    ))}
                  </svg>
                )}
                <span className={`rmv-glyph${on && v === 'now' ? ' rail-seal seal-marker' : ''}`}>
                  <it.Icon size={tiled || v === 'a' || v === 'd' ? 22 : 26} weight={on ? 'duotone' : 'bold'} />
                </span>
                <span className="rmv-text">
                  <span className="rmv-label">{it.label}</span>
                  {'status' in it && <span className={`rmv-status chrome-type-off is-${it.tone}`}>{it.status}</span>}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function RailMenuPreview() {
  const [active, setActive] = useState('home')
  return (
    <div className="rmv-page">
      {/* 물감·잉크의 거친 가장자리 */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="rmv-rough" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
        <filter id="rmv-ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
      </svg>
      <header className="rmv-head">
        <h1>레일 메뉴 — 지금 있는 자리 표시 시안</h1>
        <p>위는 라이트, 아래는 다크. 메뉴를 누르면 다섯 칸의 활성 자리가 함께 옮겨 갑니다.</p>
      </header>
      <div className="rmv-grid">
        {VARIANTS.map(({ v, title, note }) => (
          <figure key={v} className="rmv-col">
            <figcaption>
              <b>{title}</b>
              <span>{note}</span>
            </figcaption>
            <Mock v={v} theme="light" active={active} onPick={setActive} />
            <Mock v={v} theme="dark" active={active} onPick={setActive} />
          </figure>
        ))}
      </div>
    </div>
  )
}
