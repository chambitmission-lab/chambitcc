import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
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

/* /about — "참 빛" 스크롤 서사.
   교회 이름의 뜻(요 1:9)으로 어둠에서 시작해, 스크롤할수록 빛이 커지며 밝은 화면으로
   넘어간다. 빛줄기가 사진으로 흘러내리고, 사진은 어둠과 빛의 경계에 걸쳐 그 빛을 받는다.
   만남은 꺼진 전구 넷 + 켜진 손수건 장면, 끝은 다시 밤하늘의 초대 카드. */

// 펜 서체 — 목사님 별칭(.ab-pastor-nickname, 인사말 페이지와 같은 문법)·첫 화면 손글씨 쪽지
// 고운돋움 — 첫 화면 말씀(요 1:9)
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

const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

// 줄마다 span — 마지막 줄만 강조(.is-last). 말씀의 둘째 줄, 장면 문구의 결론 줄
// glow: '빛' 글자마다 형광펜 칠(.ab-hl) — 첫 화면 말씀에서만
const Lines = ({ text, glow = false }: { text: string; glow?: boolean }) => (
  <>
    {toLines(text).map((line, i, all) => (
      <span className={`ab-line${i === all.length - 1 ? ' is-last' : ''}`} key={`${i}-${line}`}>
        {glow
          ? line.split(/(빛)/).map((part, j) =>
              part === '빛' ? (
                <mark className="ab-hl" key={j}>
                  {part}
                </mark>
              ) : (
                part
              ),
            )
          : line}
      </span>
    ))}
  </>
)

// 사인 잉크는 이름(성+이름)으로 찾는다 — 표시용 이름은 "안동철 담임목사" 처럼 직함이 붙는다
const bareName = (displayName: string): string => displayName.trim().split(/\s+/)[0] ?? ''

const About = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const isAdminUser = can('content:manage')
  const ko = language === 'ko'

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

  // ── 스크롤할수록 빛이 커진다 ──
  // 이 앱의 스크롤러는 화면마다(body·#root·내부 상자) 달라 window scroll 만 들으면 놓친다.
  // scroll 은 버블링하지 않지만 capture 단계에서는 어느 스크롤러든 document 를 지난다.
  // 진행도는 scrollTop 이 아니라 어둠 구역의 화면상 위치로 잰다 — PC zoom 아래서도 같은 값.
  const dawnRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const dawn = dawnRef.current
    if (!dawn) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const rect = dawn.getBoundingClientRect()
      const t = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.8)))
      dawn.style.setProperty('--ab-glow', (0.35 + t * 1.8).toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    update()
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // ── 다섯 만남 — 기본은 손수건(켜진 장면). 꺼진 전구를 누르면 무대가 그 장면으로 어두워진다 ──
  const [meetingKey, setMeetingKey] = useState<MeetingKey>('handkerchief')
  const lit = meetingKey === 'handkerchief'
  const activePassing = PASSING_MEETINGS.find((m) => m.key === meetingKey)
  const stageImage = meetingImage(meetingKey)

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

  const moreLinks = [
    { to: '/sermon', Icon: BookOpenIcon, title: ko ? '최근 설교' : 'Recent Sermons', desc: ko ? '말씀 다시 듣기' : 'Listen again' },
    { to: '/history', Icon: FlagIcon, title: ko ? '참빛의 발자취' : 'Our Story', desc: ko ? '우리의 이야기' : 'Where we came from' },
    { to: '/people', Icon: PeopleIcon, title: ko ? '섬기는 사람들' : 'Our People', desc: ko ? '교역자 · 선교사 · 장로' : 'Pastors · missionaries · elders' },
  ] as const

  return (
    <div className="about-page page-stage">
      {/* ── 1막: 한 줄기 빛 — 본문 폭 하늘 카드(라이트 새벽·다크 무채색 밤) ── */}
      <section className="ab-dawn ab-sky" ref={dawnRef} aria-label={tx('aboutChurchName')}>
        <span className="ab-dawn-beam" aria-hidden="true" />
        <span className="ab-dawn-glow" aria-hidden="true" />
        <p className="ab-dawn-verse">
          <EditableText fieldKey="aboutDawnVerse" multiline isAdmin={isAdminUser}>
            <Lines text={tx('aboutDawnVerse')} glow />
          </EditableText>
        </p>
        <p className="ab-dawn-ref">
          <EditableText fieldKey="aboutDawnRef" isAdmin={isAdminUser}>
            {tx('aboutDawnRef')}
          </EditableText>
        </p>
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
        </div>
        {/* "아래로" 글자 대신 — 빛줄기가 사진으로 흘러내린다 */}
        <span className="ab-dawn-stream" aria-hidden="true" />
      </section>

      <div className="ab-body">
        {/* ── 사진 — 어둠과 빛의 경계에 걸쳐 위에서 내려온 빛을 받는다 ── */}
        <figure
          className="ab-photo"
          style={heroLqip ? { backgroundImage: `url("${heroLqip}")` } : undefined}
        >
          {/* crossOrigin: CORS 응답이어야 서비스워커가 상태 코드를 보고 캐싱할 수 있다.
              index.html 의 preload 링크도 같은 crossorigin 이어야 재사용된다. */}
          {heroBackgroundUrl && (
            <img
              ref={heroImageRef}
              className={`ab-photo-img${heroLoaded ? ' is-loaded' : ''}`}
              src={heroBackgroundUrl}
              alt=""
              aria-hidden="true"
              decoding="async"
              fetchPriority="high"
              crossOrigin="anonymous"
              onLoad={(e) => handleHeroLoaded(e.currentTarget)}
            />
          )}
          <figcaption className="ab-photo-cap">
            <EditableText fieldKey="aboutTagline" isAdmin={isAdminUser}>
              {tx('aboutTagline')}
            </EditableText>
          </figcaption>
          <HeroEditButton isAdmin={isAdminUser} />
        </figure>

        {/* ── 이야기 + 다섯 만남 ── */}
        <section id="about-intro" className="ab-story">
          <div className="ab-story-text">
            <div className="ab-eyebrow">
              <EditableText fieldKey="aboutOurStory" isAdmin={isAdminUser}>
                {tx('aboutOurStory')}
              </EditableText>
            </div>
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

          <div className="ab-meetings">
            <h3 className="ab-meetings-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h3>
            <div className="ab-bulbs" role="tablist" aria-label={tx('aboutMeetingTitle')}>
              {PASSING_MEETINGS.map(({ key, field }) => {
                const selected = key === meetingKey
                // 다시 누르면 손수건으로 — 꺼진 장면에 갇히지 않게
                const toggle = () => setMeetingKey(selected ? 'handkerchief' : key)
                return (
                  <div
                    key={key}
                    className={`ab-bulb${selected ? ' is-selected' : ''}`}
                    role="tab"
                    aria-selected={selected}
                    tabIndex={0}
                    onClick={toggle}
                    onKeyDown={rowKeyDown(toggle)}
                  >
                    <i className="ab-bulb-dot" aria-hidden="true" />
                    <span>
                      <EditableText fieldKey={field} isAdmin={isAdminUser}>
                        {tx(field)}
                      </EditableText>
                    </span>
                  </div>
                )
              })}
            </div>

            <div className={`ab-stage${lit ? ' is-lit' : ''}`} key={meetingKey}>
              {stageImage && <img className="ab-stage-img" src={stageImage} alt="" aria-hidden="true" />}
              <div className="ab-stage-cap">
                {lit ? (
                  <>
                    <small>{ko ? '우리가 바라는 단 하나의 만남' : 'The one meeting we long for'}</small>
                    <p className="ab-stage-text">
                      <EditableText fieldKey="aboutMeetingGood" multiline isAdmin={isAdminUser}>
                        <Lines text={tx('aboutMeetingGood')} />
                      </EditableText>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="ab-stage-text">{activePassing ? tx(activePassing.field) : ''}</p>
                    <button type="button" className="ab-stage-back" onClick={() => setMeetingKey('handkerchief')}>
                      <span>{ko ? '우리가 바라는 만남 보기' : 'See the meeting we long for'}</span>
                      <ChevronRightIcon size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 약속 — 빛 번짐 ── */}
        <section className="ab-promise">
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
        </section>

        {/* ── 담임목사 — 큰 인물 + 편지 ── */}
        <section id="about-pastor" className="ab-pastor">
          <div className="ab-pastor-pic">
            <EditableImage
              fieldKey="aboutPastorPhoto"
              currentUrl={pastorPhotoUrl}
              isAdmin={isAdminUser}
              title={ko ? '담임목사 사진' : 'Pastor Photo'}
            >
              <img src={pastorPhotoUrl || pastorPhoto} alt={tx('aboutPastorName')} />
            </EditableImage>
            <span className="ab-pastor-nickname">
              <EditableText fieldKey="aboutPastorNickname" isAdmin={isAdminUser}>
                {tx('aboutPastorNickname')}
              </EditableText>
            </span>
          </div>

          <div className="ab-pastor-body">
            <div className="ab-eyebrow">
              <EditableText fieldKey="aboutPastorBadge" isAdmin={isAdminUser}>
                {tx('aboutPastorBadge')}
              </EditableText>
            </div>
            <h2 className="ab-pastor-name">
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

            {/* 인사말 전문은 /greeting 이 담당 (역대 담임목사도 그 페이지에 있다) */}
            <button type="button" className="ab-pastor-more" onClick={() => navigate('/greeting')}>
              <span>{ko ? '담임목사 인사말 전문 보기' : 'Read the full greeting'}</span>
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </section>

        {/* ── 다시 1막의 하늘 — 초대 + 한눈에 정보 ── */}
        <section id="about-cta" className="ab-invite ab-sky">
          <div className="ab-invite-head">
            <h2 className="ab-invite-title">
              <EditableText fieldKey="aboutCtaTitle" isAdmin={isAdminUser}>
                {tx('aboutCtaTitle')}
              </EditableText>
            </h2>
            <p className="ab-invite-text">
              <EditableText fieldKey="aboutCtaText" multiline isAdmin={isAdminUser}>
                {tx('aboutCtaText')}
              </EditableText>
            </p>
            <button type="button" className="ab-invite-cta" onClick={() => navigate('/register')}>
              {ko ? '처음 오셨나요? 등록하기' : 'New here? Join us'}
            </button>
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

        <nav className="ab-more" aria-label={ko ? '더 알아보기' : 'Learn more'}>
          {moreLinks.map(({ to, Icon, title, desc }) => (
            <button key={to} type="button" className="ab-more-link" onClick={() => navigate(to)}>
              <Icon size={20} className="ab-more-icon" />
              <span className="ab-more-title">{title}</span>
              <span className="ab-more-desc">{desc}</span>
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
