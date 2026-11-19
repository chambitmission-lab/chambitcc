// /about 맨 아래 '초대' — 이번 주일 초대장(2026-11-18 A안).
// 오시는 길 계절 풍경 위에 다음 주일 날짜 + 예배 시간 타일(처음이라면 3부) + 오시는 길.
// 낮엔 오시는 길과 같은 꽃잎·낙엽·눈이 내린다.
import type { KeyboardEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import HeroFalling from '../../../components/scenery/HeroFalling'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useTheme } from '../../../contexts/ThemeContext'
import type { AboutFieldKey } from '../../../types/aboutContent'
import { visitSceneFor } from '../../../utils/themeAssets'
import { ChevronRightIcon, MapPinIcon, PhoneIcon } from '../icons'

// 다음 주일(오늘이 주일이면 오늘)
const nextSunday = (ko: boolean) => {
  const d = new Date()
  const isToday = d.getDay() === 0
  if (!isToday) d.setDate(d.getDate() + (7 - d.getDay()))
  const label = ko
    ? `${d.getMonth() + 1}월 ${d.getDate()}일`
    : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return { label, isToday }
}

// "주일 오전 7:30 · 9:20 · 11:20 · 오후 1:30" → [{오전,7:30}, …] — 오전/오후는 앞 값을 이어받는다
const parseServices = (text: string): { ampm: string; time: string }[] => {
  let ampm = ''
  const out: { ampm: string; time: string }[] = []
  for (const part of text.split(/[·,]/)) {
    const mer = part.match(/오전|오후|AM|PM/i)
    if (mer) ampm = mer[0]
    const t = part.match(/\d{1,2}:\d{2}/)
    if (t) out.push({ ampm, time: t[0] })
  }
  return out
}

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// EditableText 가 <button> 을 렌더하므로 클릭 행은 button 이 아닌 span(role=button) —
// 중첩 인터랙티브 요소를 피한다 (편집 버튼은 stopPropagation 으로 행 클릭과 분리됨)
const rowKeyDown = (action: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    action()
  }
}

interface InviteSectionProps {
  /** 장 머리 라벨(.ab-tag) — 다른 장과 같은 모양이라 About 이 만들어 넘긴다 */
  tag: ReactNode
  /** 관리자 문구(about_content) — DB 우선, 없으면 기본 번역 */
  tx: (key: AboutFieldKey) => string
  isAdminUser: boolean
  isLoggedIn: boolean
}

const InviteSection = ({ tag, tx, isAdminUser, isLoggedIn }: InviteSectionProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { theme } = useTheme()

  // 오시는 길과 같은 계절 풍경, 예배 시간 타일(처음 오신 분께는 11:20 3부, 없으면 가운데)
  const scene = visitSceneFor(theme)
  const sunday = nextSunday(ko)
  const services = parseServices(tx('aboutInfoWorship'))
  const firstTimer = services.findIndex((sv) => sv.time === '11:20')
  const pickIndex = firstTimer >= 0 ? firstTimer : Math.floor((services.length - 1) / 2)

  const phone = tx('aboutPhone').trim()
  const callPhone = () => {
    if (phone) window.location.assign(`tel:${phone.replace(/[^0-9+]/g, '')}`)
  }

  return (
    <section id="about-cta" className={`ab-invite ink-${scene?.ink ?? 'white'}`}>
      {scene && (
        <div className="ab-invite-scene" aria-hidden="true">
          <img src={scene.src} alt="" loading="lazy" decoding="async" />
          {theme === 'light' && <HeroFalling season={scene.season} />}
        </div>
      )}
      <span className="ab-invite-shade" aria-hidden="true" />
      <div className="ab-invite-body">
        {tag}
        <p className="ab-invite-date">
          <span>{sunday.isToday ? (ko ? '오늘' : 'Today') : ko ? '이번 주일' : 'This Sunday'} ·</span>
          <strong>{sunday.label}</strong>
        </p>
        <h2 className="ab-invite-title">{ko ? '자리 하나\n비워둘게요.' : "We'll save\na seat for you."}</h2>

        {services.length > 0 && (
          <ul className="ab-times" aria-label={ko ? '주일 예배 시간' : 'Sunday services'}>
            {services.map((sv, i) => (
              <li key={`${sv.ampm}-${sv.time}`} className={i === pickIndex ? 'is-pick' : undefined}>
                <button type="button" onClick={() => navigate('/worship')}>
                  <small>{ko ? `${i + 1}부` : `${ordinal(i + 1)}`}</small>
                  <b>
                    <em>{sv.ampm}</em> {sv.time}
                  </b>
                </button>
                {i === pickIndex && <span>{ko ? '처음이라면' : 'First time?'}</span>}
              </li>
            ))}
          </ul>
        )}
        {/* 관리자는 예배 시간 문구를 그대로 고친다(타일은 이 문구를 읽어 만든다) */}
        {isAdminUser && (
          <p className="ab-invite-admin">
            <EditableText fieldKey="aboutInfoWorship" isAdmin={isAdminUser}>
              {tx('aboutInfoWorship')}
            </EditableText>
          </p>
        )}

        {/* 교회에서 "등록"은 새가족 등록으로 읽힌다 — 방문자에겐 길 안내가 먼저, 앱 가입은 비로그인일 때만 보조 링크로 */}
        <div className="ab-invite-actions">
          <button type="button" className="ab-invite-cta" onClick={() => navigate('/visit')}>
            {ko ? '오시는 길 보기' : 'Get directions'}
          </button>
          <span className="ab-invite-where">
            <MapPinIcon size={16} />
            <EditableText fieldKey="aboutAddress" isAdmin={isAdminUser}>
              {tx('aboutAddress')}
            </EditableText>
          </span>
          {(phone.length > 0 || isAdminUser) && (
            <span
              className="ab-invite-where is-phone"
              role="button"
              tabIndex={0}
              onClick={callPhone}
              onKeyDown={rowKeyDown(callPhone)}
            >
              <PhoneIcon size={16} />
              <EditableText fieldKey="aboutPhone" isAdmin={isAdminUser}>
                {phone || (ko ? '전화번호를 등록해주세요' : 'Add a phone number')}
              </EditableText>
            </span>
          )}
          {!isLoggedIn && (
            <button type="button" className="ab-link-btn" onClick={() => navigate('/register')}>
              <span>{ko ? '참빛 앱 가입하기' : 'Sign up for the app'}</span>
              <ChevronRightIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default InviteSection
