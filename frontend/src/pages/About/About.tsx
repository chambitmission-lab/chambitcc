import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import { useAboutContent } from '../../hooks/useAboutContent'
import { EditableText, EditableImage, HeroEditButton } from '../../components/AboutEditor'
import { captureAboutHeroLqip, readAboutHeroLqip } from '../../utils/aboutHeroLqip'
import {
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  MapPinIcon,
  PeopleIcon,
  PhoneIcon,
} from './icons'
import { EmojiText } from '../../components/common/EmojiText'
import { SignatureLine } from '../../components/common/SignatureLine'
import { ensureFontFamily } from '../../utils/deferredFonts'
import pastorPhoto from '../../assets/about-pastor/pastor.webp'
import './styles/index.css'
import { can } from '../../utils/access'
import { useThemeArt } from '../../hooks/useThemeArt'
import { ABOUT_DAWN_MOBILE, ABOUT_DAWN_PC } from '../../utils/themeAssets'

/* /about — "참 빛" 잡지형 소개.
   첫 화면은 하늘 카드(교회 이름이 주인공 · 요 1:9 는 곁에) + 바로가기 알약.
   그 아래는 그림·글을 좌우로 번갈아 놓은 장들 — 만남 → 다섯 만남(사진 카드 5장 + 약속) → 담임목사 → 초대.
   예전 스티키 고정 그림은 세로로 길고 장면이 겹쳐 보여 걷어냈다. */

// 서체는 셋만 — 교회 이름 G마켓 · 말씀·인용 고운돋움(--ab-verse) · 손글씨는 목사님 별칭에만
ensureFontFamily('nanumPen')
ensureFontFamily('gowunDodum')

// 다섯 가지 만남 — key 는 이미지 파일명(./img/{key}.webp)이자 프롬프트 문서의 슬러그
const PASSING_MEETINGS = [
  { key: 'fishy', field: 'aboutMeetingBad1' },
  { key: 'wilted', field: 'aboutMeetingBad2' },
  { key: 'worn_out', field: 'aboutMeetingBad3' },
  { key: 'deleted', field: 'aboutMeetingBad4' },
] as const
type MeetingKey = (typeof PASSING_MEETINGS)[number]['key'] | 'handkerchief'

const CREDENTIALS = [
  ['aboutEducationLabel', 'aboutEducationValue'],
  ['aboutCareerLabel', 'aboutCareerValue'],
  ['aboutAwardLabel', 'aboutAwardValue'],
] as const

// 만남 장면 이미지 — 파일만 넣으면 자동 연결 (생성 프롬프트: frontend/docs/meeting-image-prompts.md)
const MEETING_IMAGES = import.meta.glob('./img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const meetingImage = (key: MeetingKey): string | undefined => MEETING_IMAGES[`./img/${key}.webp`]

// 01 만남 — 관리자 히어로 사진이 없을 때 빈 상자 대신 깔 새벽 그림
const MEET_FALLBACK = '/images/history/verse-dawn.webp'

// 첫 화면 바로가기 — HashRouter 라 #앵커 링크 대신 scrollIntoView
const SECTIONS = ['about-intro', 'about-meetings', 'about-pastor', 'about-cta'] as const
type SectionId = (typeof SECTIONS)[number]

const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

// 줄마다 span — 마지막 줄만 강조(.is-last). 장면 문구·약속의 결론 줄
const Lines = ({ text }: { text: string }) => (
  <>
    {toLines(text).map((line, i, all) => (
      <span className={`ab-line${i === all.length - 1 ? ' is-last' : ''}`} key={`${i}-${line}`}>
        {line}
      </span>
    ))}
  </>
)

// 첫 화면 말씀 — 시처럼 짧게 끊은 줄이 '빛'에서부터 한 글자씩 켜진다.
// 켜지는 순서 = 줄을 이어 붙인 글자열에서 가장 가까운 '빛'까지의 거리 → 첫 줄·끝 줄의 '빛'이 먼저,
// 빛이 양쪽에서 번져 가운데 줄에서 만난다. '빛'이 없으면(영어 등 'light' 도 없으면) 앞에서부터.
const LIGHT_RE = /빛|light/gi
const CHAR_STEP = 0.075 // 거리 한 칸당 지연(s)
const CHAR_START = 0.35

const DawnVerse = ({ text }: { text: string }) => {
  const lines = toLines(text)
  // 줄마다 '빛' 글자 자리(줄 안 인덱스)와 이어 붙인 글자열에서의 시작 위치 — 줄바꿈도 한 칸
  const lightAt = lines.map((line) => {
    const at = new Set<number>()
    for (const m of line.matchAll(LIGHT_RE)) {
      for (let k = 0; k < m[0].length; k++) at.add((m.index ?? 0) + k)
    }
    return at
  })
  const starts = lines.map((_, i) => lines.slice(0, i).reduce((sum, l) => sum + l.length + 1, 0))
  const seeds = lightAt.flatMap((at, i) => [...at].map((j) => starts[i] + j))
  if (seeds.length === 0) seeds.push(0)

  return (
    <>
      {/* 화면 낭독기는 글자 조각 대신 줄 단위 문장을 읽는다 */}
      <span className="sr-only">{lines.join(' ')}</span>
      {lines.map((line, i) => {
        const start = starts[i]
        const isLight = lightAt[i]
        // 여러 줄일 때 첫 줄은 한 호흡 크게(.is-lead)
        const lead = i === 0 && lines.length > 1 ? ' is-lead' : ''
        return (
          <span className={`ab-line${lead}`} aria-hidden="true" key={`${i}-${line}`}>
            {Array.from(line).map((ch, j) => {
              const d = Math.min(...seeds.map((s) => Math.abs(s - (start + j))))
              return (
                <span
                  key={j}
                  className={`ab-ch${isLight.has(j) ? ' ab-hl' : ''}`}
                  style={{ animationDelay: `${(CHAR_START + d * CHAR_STEP).toFixed(2)}s` }}
                >
                  {ch}
                </span>
              )
            })}
          </span>
        )
      })}
    </>
  )
}

// 사인 잉크는 이름(성+이름)으로 찾는다 — 표시용 이름은 "안동철 담임목사" 처럼 직함이 붙는다
const bareName = (displayName: string): string => displayName.trim().split(/\s+/)[0] ?? ''

const About = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { isLoggedIn } = useAuth()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const isAdminUser = can('content:manage')
  const ko = language === 'ko'
  // 하늘 카드 그림 — 지금 폭의 한 쌍만 받는다(CSS 가 같은 폭 기준으로 고른다)
  const [dawnPair] = useState(() => (ABOUT_DAWN_PC.when?.() ? ABOUT_DAWN_PC : ABOUT_DAWN_MOBILE))
  const dawnArtReady = useThemeArt(dawnPair)

  // ── 사진: CSS 배경이 아니라 <img> + onLoad 페이드, 첫 프레임엔 지난 방문의 LQIP ──
  const [heroLoaded, setHeroLoaded] = useState(false)
  const heroLqip = useMemo(() => readAboutHeroLqip(heroBackgroundUrl), [heroBackgroundUrl])
  const handleHeroLoaded = useCallback(
    (node: HTMLImageElement) => {
      setHeroLoaded(true)
      if (heroBackgroundUrl) captureAboutHeroLqip(node, heroBackgroundUrl)
    },
    [heroBackgroundUrl],
  )
  // 캐시 적중이면 리스너가 붙기 전에 로드가 끝나 onLoad 가 안 올 수 있다 → complete 직접 확인
  const heroImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete) handleHeroLoaded(node)
    },
    [handleHeroLoaded],
  )

  const phone = tx('aboutPhone').trim()
  const pastorPhotoUrl = tx('aboutPastorPhoto').trim()

  const callPhone = () => {
    if (phone) window.location.assign(`tel:${phone.replace(/[^0-9+]/g, '')}`)
  }

  // EditableText 가 <button> 을 렌더하므로 클릭 행은 button 이 아닌 div(role=button) —
  // 중첩 인터랙티브 요소를 피한다 (편집 버튼은 stopPropagation 으로 행 클릭과 분리됨)
  const rowKeyDown = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  const jumpTo = (id: SectionId) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const sectionLabels: Record<SectionId, string> = ko
    ? { 'about-intro': '만남', 'about-meetings': '다섯 만남', 'about-pastor': '담임목사', 'about-cta': '함께 예배' }
    : { 'about-intro': 'Our story', 'about-meetings': 'Five meetings', 'about-pastor': 'Pastor', 'about-cta': 'Visit us' }

  // 장 머리 — 파란 작은 라벨. 만남·담임목사는 관리자가 고치던 라벨(aboutOurStory·aboutPastorBadge)을 그대로 쓴다
  const tag = (label: React.ReactNode) => (
    <span className="ab-tag">
      <i aria-hidden="true" />
      {label}
    </span>
  )

  const moreLinks = [
    { to: '/sermon', Icon: BookOpenIcon, title: ko ? '최근 설교' : 'Recent Sermons' },
    { to: '/history', Icon: FlagIcon, title: ko ? '참빛의 발자취' : 'Our Story' },
    { to: '/people', Icon: PeopleIcon, title: ko ? '섬기는 사람들' : 'Our People' },
  ] as const

  return (
    <div className="about-page page-stage">
      {/* ── 첫 화면: 하늘 카드 — 왼쪽 교회 이름(주인공) · 오른쪽 요 1:9 (모바일은 위아래) ── */}
      <section className="ab-dawn ab-sky" aria-label={tx('aboutChurchName')}>
        {/* 그림 — 위 가운데에서 내려온 빛이 아래 마을 창마다 하나씩 닿는다("각 사람에게 비추는 빛") */}
        <span className={`ab-dawn-art${dawnArtReady ? ' is-loaded' : ''}`} aria-hidden="true" />
        <span className="ab-dawn-beam" aria-hidden="true" />
        <span className="ab-dawn-glow" aria-hidden="true" />
        <div className="ab-dawn-name">
          <span className="ab-dawn-kicker">
            <EditableText fieldKey="aboutDawnKicker" isAdmin={isAdminUser}>
              {tx('aboutDawnKicker')}
            </EditableText>
          </span>
          <h1>
            <EditableText fieldKey="aboutChurchName" isAdmin={isAdminUser}>
              {tx('aboutChurchName')}
            </EditableText>
          </h1>
          <p className="ab-dawn-tagline">
            <EditableText fieldKey="aboutTagline" isAdmin={isAdminUser}>
              {tx('aboutTagline')}
            </EditableText>
          </p>
        </div>
        <div className="ab-dawn-word">
          <p className="ab-dawn-verse">
            <EditableText fieldKey="aboutDawnVerse" multiline isAdmin={isAdminUser}>
              <DawnVerse text={tx('aboutDawnVerse')} />
            </EditableText>
          </p>
          <p className="ab-dawn-ref">
            <EditableText fieldKey="aboutDawnRef" isAdmin={isAdminUser}>
              {tx('aboutDawnRef')}
            </EditableText>
          </p>
        </div>
      </section>

      {/* 바로가기 — 카드 아래 가장자리에 걸친 알약 */}
      <nav className="ab-jump" aria-label={ko ? '소개 바로가기' : 'Jump to section'}>
        {SECTIONS.map((id) => (
          <button key={id} type="button" onClick={() => jumpTo(id)}>
            {sectionLabels[id]}
          </button>
        ))}
      </nav>

      <div className="ab-body">
        {/* ── 만남 — 그림 왼쪽 · 글 오른쪽 ── */}
        <section id="about-intro" className="ab-row">
          <figure
            className="ab-pic"
            style={heroLqip ? { backgroundImage: `url("${heroLqip}")` } : undefined}
          >
            {/* crossOrigin: CORS 응답이어야 서비스워커가 상태 코드를 보고 캐싱할 수 있다.
                index.html 의 preload 링크도 같은 crossorigin 이어야 재사용된다. */}
            {heroBackgroundUrl ? (
              <img
                ref={heroImageRef}
                className={`ab-pic-img ab-hero-img${heroLoaded ? ' is-loaded' : ''}`}
                src={heroBackgroundUrl}
                alt=""
                aria-hidden="true"
                decoding="async"
                fetchPriority="high"
                crossOrigin="anonymous"
                onLoad={(e) => handleHeroLoaded(e.currentTarget)}
              />
            ) : (
              <img className="ab-pic-img" src={MEET_FALLBACK} alt="" aria-hidden="true" decoding="async" />
            )}
            <HeroEditButton isAdmin={isAdminUser} />
          </figure>
          <div className="ab-txt">
            {tag(
              <EditableText fieldKey="aboutOurStory" isAdmin={isAdminUser}>
                {tx('aboutOurStory')}
              </EditableText>,
            )}
            <h2 className="ab-title">
              <EditableText fieldKey="aboutMainTitle" multiline isAdmin={isAdminUser}>
                {tx('aboutMainTitle')}
              </EditableText>
            </h2>
            <p className="ab-lead">
              <EditableText fieldKey="aboutMainText" multiline isAdmin={isAdminUser}>
                {tx('aboutMainText')}
              </EditableText>
            </p>
          </div>
        </section>

        {/* ── 다섯 만남 — 흑백 넷 + 단 하나 컬러(손수건), 이어서 약속 ── */}
        <section id="about-meetings" className="ab-meet">
          <header className="ab-meet-head">
            {tag(ko ? '다섯 만남' : 'Five meetings')}
            <h2 className="ab-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h2>
            <p className="ab-lead">
              {ko ? '세상엔 쓰고 버리는 만남이 많습니다.' : 'Many meetings are used and thrown away.'}
            </p>
          </header>
          <ul className="ab-meet-cards">
            {PASSING_MEETINGS.map(({ key, field }) => (
              <li key={key} className="ab-meet-card">
                <img src={meetingImage(key)} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <span className="ab-meet-label">
                  <EditableText fieldKey={field} isAdmin={isAdminUser}>
                    {tx(field)}
                  </EditableText>
                </span>
              </li>
            ))}
            <li className="ab-meet-card is-good">
              <img src={meetingImage('handkerchief')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <span className="ab-meet-label">
                <small>{ko ? '단 하나의 만남' : 'The one meeting'}</small>
                <EditableText fieldKey="aboutMeetingGood" multiline isAdmin={isAdminUser}>
                  {toLines(tx('aboutMeetingGood')).join(' ')}
                </EditableText>
              </span>
            </li>
          </ul>
          <blockquote className="ab-promise">
            <p className="ab-promise-text">
              <EditableText fieldKey="aboutPromiseQuote" multiline isAdmin={isAdminUser}>
                <Lines text={tx('aboutPromiseQuote')} />
              </EditableText>
            </p>
            <span className="ab-promise-author">
              <EditableText fieldKey="aboutPromiseAuthor" isAdmin={isAdminUser}>
                {tx('aboutPromiseAuthor').replace(/^[-–—]\s*/, '')}
              </EditableText>
            </span>
          </blockquote>
        </section>

        {/* ── 담임목사 — 글 왼쪽 · 사진 오른쪽 ── */}
        <section id="about-pastor" className="ab-row is-flip">
          <figure className="ab-pic is-portrait">
            <EditableImage
              fieldKey="aboutPastorPhoto"
              currentUrl={pastorPhotoUrl}
              isAdmin={isAdminUser}
              title={ko ? '담임목사 사진' : 'Pastor Photo'}
            >
              <img className="ab-pic-img ab-pastor-img" src={pastorPhotoUrl || pastorPhoto} alt={tx('aboutPastorName')} loading="lazy" />
            </EditableImage>
            <span className="ab-pastor-nickname">
              <EditableText fieldKey="aboutPastorNickname" isAdmin={isAdminUser}>
                {tx('aboutPastorNickname')}
              </EditableText>
            </span>
          </figure>
          <div className="ab-txt">
            {tag(
              <EditableText fieldKey="aboutPastorBadge" isAdmin={isAdminUser}>
                {tx('aboutPastorBadge')}
              </EditableText>,
            )}
            <h2 className="ab-title">
              <EditableText fieldKey="aboutPastorName" isAdmin={isAdminUser}>
                {tx('aboutPastorName')}
              </EditableText>
            </h2>
            <p className="ab-pastor-text is-lead">
              <EditableText fieldKey="aboutPastorIntro1" multiline isAdmin={isAdminUser}>
                {tx('aboutPastorIntro1')}
              </EditableText>
            </p>
            <p className="ab-pastor-text">
              <EditableText fieldKey="aboutPastorIntro2" multiline isAdmin={isAdminUser}>
                {tx('aboutPastorIntro2')}
              </EditableText>
            </p>
            <p className="ab-pastor-text">
              <EditableText fieldKey="aboutPastorIntro3" multiline isAdmin={isAdminUser}>
                {tx('aboutPastorIntro3')}
              </EditableText>
            </p>

            <dl className="ab-facts">
              {CREDENTIALS.map(([labelKey, valueKey]) => (
                <div className="ab-fact" key={labelKey}>
                  <dt>
                    <EditableText fieldKey={labelKey} isAdmin={isAdminUser}>
                      {tx(labelKey)}
                    </EditableText>
                  </dt>
                  <dd>
                    <EditableText fieldKey={valueKey} multiline isAdmin={isAdminUser}>
                      {toLines(tx(valueKey)).join(' · ')}
                    </EditableText>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="ab-pastor-foot">
              {/* 인사말 전문은 /greeting 이 담당 (역대 담임목사도 그 페이지에 있다) */}
              <button type="button" className="ab-link-btn" onClick={() => navigate('/greeting')}>
                <span>{ko ? '인사말 전문 보기' : 'Read the full greeting'}</span>
                <ChevronRightIcon size={16} />
              </button>
              {/* 서명 — 인사말(/greeting)과 같은 사인 잉크 */}
              <div className="ab-pastor-sign">
                <EditableText fieldKey="aboutPastorSignature" isAdmin={isAdminUser}>
                  <SignatureLine
                    text={tx('aboutPastorSignature')}
                    name={bareName(tx('aboutPastorName'))}
                    className="ab-pastor-sign-ink"
                  />
                </EditableText>
              </div>
            </div>
          </div>
        </section>

        {/* ── 초대 — 들판 길 사진 띠 위에 초대 글 + 한눈에 정보 ── */}
        <section id="about-cta" className="ab-invite">
          {/* /visit 의 예배당 이미지는 배경 위에 겹치려고 건물만 오려낸 합성이라 단독 배경으론 테두리가 드러났다 */}
          <img className="ab-invite-bg" src="/images/history/verse-path.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" />
          <div className="ab-invite-copy">
            {tag(ko ? '초대' : 'Invitation')}
            <h2 className="ab-title">
              <EditableText fieldKey="aboutCtaTitle" isAdmin={isAdminUser}>
                {tx('aboutCtaTitle')}
              </EditableText>
            </h2>
            <p className="ab-lead">
              <EditableText fieldKey="aboutCtaText" multiline isAdmin={isAdminUser}>
                {tx('aboutCtaText')}
              </EditableText>
            </p>
            {/* 교회에서 "등록"은 새가족 등록으로 읽힌다 — 방문자에겐 주일 예배 길 안내가 먼저,
                앱 가입은 비로그인일 때만 보조 링크로 */}
            <div className="ab-invite-actions">
              <button type="button" className="ab-invite-cta" onClick={() => navigate('/visit')}>
                {ko ? '이번 주일, 함께 예배드려요' : 'Join us this Sunday'}
              </button>
              {!isLoggedIn && (
                <button type="button" className="ab-link-btn" onClick={() => navigate('/register')}>
                  <span>{ko ? '참빛 앱 가입하기' : 'Sign up for the app'}</span>
                  <ChevronRightIcon size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="ab-info" aria-label={ko ? '한눈에 정보' : 'Quick info'}>
            <div
              className="ab-info-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/worship')}
              onKeyDown={rowKeyDown(() => navigate('/worship'))}
            >
              <ClockIcon size={20} className="ab-info-icon" />
              <span className="ab-info-main">
                <small>{ko ? '주일예배' : 'Sunday Worship'}</small>
                <b>
                  <EditableText fieldKey="aboutInfoWorship" isAdmin={isAdminUser}>
                    {tx('aboutInfoWorship')}
                  </EditableText>
                </b>
              </span>
              <ChevronRightIcon size={16} className="ab-info-chevron" />
            </div>

            {/* 길찾기 앱 연결은 /visit 이 각 지도 앱 버튼으로 담당한다 */}
            <div
              className="ab-info-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/visit')}
              onKeyDown={rowKeyDown(() => navigate('/visit'))}
            >
              <MapPinIcon size={20} className="ab-info-icon" />
              <span className="ab-info-main">
                <small>{ko ? '오시는 길' : 'Directions'}</small>
                <b>
                  <EditableText fieldKey="aboutAddress" isAdmin={isAdminUser}>
                    {tx('aboutAddress')}
                  </EditableText>
                </b>
              </span>
              <ChevronRightIcon size={16} className="ab-info-chevron" />
            </div>

            {(phone.length > 0 || isAdminUser) && (
              <div
                className="ab-info-row"
                role="button"
                tabIndex={0}
                onClick={callPhone}
                onKeyDown={rowKeyDown(callPhone)}
              >
                <PhoneIcon size={20} className="ab-info-icon" />
                <span className="ab-info-main">
                  <small>{ko ? '전화' : 'Phone'}</small>
                  <b className={phone ? undefined : 'is-empty'}>
                    <EditableText fieldKey="aboutPhone" isAdmin={isAdminUser}>
                      {phone || (ko ? '전화번호를 등록해주세요' : 'Add a phone number')}
                    </EditableText>
                  </b>
                </span>
                {phone.length > 0 && <ChevronRightIcon size={16} className="ab-info-chevron" />}
              </div>
            )}

            {isAdminUser && (
              <p className="ab-info-admin">
                {ko
                  ? '지도 검색어·주차·사진 안내는 오시는 길 페이지에서 수정합니다.'
                  : 'Map query, parking and photos are edited on the Directions page.'}
              </p>
            )}
          </div>
        </section>

        {/* 더 알아보기 — 마무리를 한 번 더 세우지 않게 작은 알약 한 줄 */}
        <nav className="ab-more" aria-label={ko ? '더 알아보기' : 'Learn more'}>
          {moreLinks.map(({ to, Icon, title }) => (
            <button key={to} type="button" className="ab-more-link" onClick={() => navigate(to)}>
              <Icon size={16} className="ab-more-icon" />
              {title}
            </button>
          ))}
        </nav>

        <p className="ab-thanks">
          <EditableText fieldKey="aboutFooterMessage" multiline isAdmin={isAdminUser}>
            <EmojiText text={tx('aboutFooterMessage')} />
          </EditableText>
        </p>

        {isAdminUser && (
          <div className="ab-admin-hint">
            {ko
              ? '연필 아이콘을 눌러 텍스트와 사진을 바로 수정할 수 있습니다.'
              : 'Click the pencil icon to edit text and photos inline.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default About
