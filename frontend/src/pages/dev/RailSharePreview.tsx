import { useState, type ReactNode } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { pairSrc, RAIL_BOTTOM, type ThemePair } from '../../utils/themeAssets'
import SharePostcardButton from '../../components/share/SharePostcardButton'
import RailSun from '../../components/layout/DesktopNavRail/railWeather/RailSun'
import RailClouds from '../../components/layout/DesktopNavRail/railWeather/RailClouds'
import '../../components/layout/DesktopNavRail/DesktopNavRail.css'
import './railSharePreview.css'

/**
 * /#/dev/rail-share — PC 좌측 레일 '나누기' × 하단 수채 삽화 (3차: 그림 속 우체통).
 * 1·2차(CSS 로 그린 엽서·언덕·알약)는 전부 "덧붙인 느낌"으로 반려 → 삽화 자체에 같은 붓터치의
 * 우체통을 그려 넣고(bottom-mailbox-*.webp, Gemini 편집), 그 우체통이 곧 버튼이 된다.
 *   M1 손글씨 꼬리표 — 우체통 오른쪽 언덕 위에 그림 잉크색 손글씨 "나누기"
 *   M2 그림만       — 글자 없이 우체통만. 호버하면 말풍선(툴팁)
 *   M3 꼬리표+소인  — M1 + 오늘 날짜 작은 소인(보내면 잉크가 찬다 — 지금 버튼의 is-sent 문법)
 * ★ 우체통 버전은 그림을 48px 만 내린다(지금 76px) — 기둥까지 보여야 땅에 선 우체통으로 읽힌다.
 * ★ 누를 영역 좌표는 그림 픽셀(496×698) 기준 — 컨테이너 폭 단위(cqw)로 환산하므로 레일 폭이 달라도 맞는다.
 */

const MAILBOX: ThemePair = {
  light: '/images/rail/bottom-mailbox-light.webp',
  dark: '/images/rail/bottom-mailbox-dark.webp',
}

const today = new Date()

type Variant = 'm1' | 'm2' | 'm3'

const Frame = ({ title, note, children }: { title: string; note: string; children: ReactNode }) => (
  <figure className="rsp-col">
    <figcaption>
      <b>{title}</b>
      <span>{note}</span>
    </figcaption>
    {children}
  </figure>
)

const Foot = () => {
  const { theme } = useTheme()
  return (
    <div className="rsp-foot">
      <span className="material-icons-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      {theme === 'dark' ? '주간 모드' : '야간 모드'}
      <span className="material-icons-outlined rsp-more">more_vert</span>
    </div>
  )
}

const MailboxRail = ({ variant }: { variant: Variant }) => {
  const { theme } = useTheme()
  const [sent, setSent] = useState(false)
  return (
    <div className="rsp-rail">
      <div
        className={`rail-bottom-art is-loaded rsp-art rsp-art--mailbox rsp-mb--${theme}`}
        style={{ backgroundImage: `url(${pairSrc(MAILBOX, theme)})` }}
      >
        <RailSun />
        <RailClouds />
        <button
          type="button"
          className={`rsp-mb rsp-mb--${variant}${sent ? ' is-sent' : ''}`}
          aria-label="나누기"
          onClick={() => setSent((s) => !s)}
        >
          <span className="rsp-mb__halo" aria-hidden />
          {variant !== 'm2' && <span className="rsp-mb__word">나누기</span>}
          {variant === 'm3' && (
            <span className="rsp-mb__stamp" aria-hidden>
              {today.getDate()}
            </span>
          )}
          {variant === 'm2' && <span className="rsp-mb__tip">나누기 · N</span>}
        </button>
      </div>
      <Foot />
    </div>
  )
}

export default function RailSharePreview() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="rsp-page">
      <header className="rsp-head">
        <div>
          <h1>좌측 레일 「나누기」 · 3차 — 그림 속 우체통</h1>
          <p>우체통에 마우스를 올려 보세요. M3 는 눌러 보면 '오늘 보냄' 소인이 찹니다.</p>
        </div>
        <button type="button" onClick={toggleTheme} className="rsp-theme">
          {theme === 'dark' ? '라이트로 보기' : '다크로 보기'}
        </button>
      </header>

      <div className="rsp-grid">
        <Frame title="지금" note="그림 아래 엽서 버튼">
          <div className="rsp-rail">
            <div className="rail-bottom-art is-loaded rsp-art" style={{ backgroundImage: `url(${pairSrc(RAIL_BOTTOM, theme)})` }}>
              <RailSun />
              <RailClouds />
            </div>
            <div className="rsp-share">
              <SharePostcardButton variant="rail" open={false} label="나누기" />
            </div>
            <Foot />
          </div>
        </Frame>
        <Frame title="M1 · 손글씨 꼬리표" note="우체통 옆 언덕에 그림 잉크색 손글씨">
          <MailboxRail variant="m1" />
        </Frame>
        <Frame title="M2 · 그림만" note="글자 없이 우체통만, 호버하면 말풍선">
          <MailboxRail variant="m2" />
        </Frame>
        <Frame title="M3 · 꼬리표 + 소인" note="M1 + 오늘 날짜 소인 (누르면 잉크가 참)">
          <MailboxRail variant="m3" />
        </Frame>
      </div>
    </div>
  )
}
