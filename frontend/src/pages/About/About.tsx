import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { smoothScrollToElement } from '../../utils/scrollTo'
import { useAboutContent } from '../../hooks/useAboutContent'
import { EditableText, EditableImage, HeroEditButton } from '../../components/AboutEditor'
import {
  BookOpenIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  HeartIcon,
  MapPinIcon,
  OrgChartIcon,
  PhoneIcon,
  SproutIcon,
  XIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  MedalIcon,
} from './icons'
import { EmojiText } from '../../components/common/EmojiText'
import './styles/index.css'

// 다섯 가지 만남 — 행 순서 = 화면 순서. key 는 이미지 파일명(./img/{key}.webp)이자 프롬프트 문서의 슬러그
const MEETINGS = [
  { key: 'fishy', field: 'aboutMeetingBad1', good: false },
  { key: 'wilted', field: 'aboutMeetingBad2', good: false },
  { key: 'worn_out', field: 'aboutMeetingBad3', good: false },
  { key: 'deleted', field: 'aboutMeetingBad4', good: false },
  { key: 'handkerchief', field: 'aboutMeetingGood', good: true },
] as const
type MeetingKey = (typeof MEETINGS)[number]['key']

// 약력 3열 — 모바일 아코디언과 lg+ 벤토 타일이 같은 데이터를 쓴다
const CREDENTIALS = [
  ['aboutEducationLabel', 'aboutEducationValue', GraduationCapIcon],
  ['aboutCareerLabel', 'aboutCareerValue', BriefcaseIcon],
  ['aboutAwardLabel', 'aboutAwardValue', MedalIcon],
] as const

// 만남 장면 이미지 — 파일만 넣으면 자동 연결, 없는 장면은 그라데이션 카드 유지
// (생성 프롬프트: frontend/docs/meeting-image-prompts.md)
const MEETING_IMAGES = import.meta.glob('./img/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const meetingImage = (key: MeetingKey): string | undefined => MEETING_IMAGES[`./img/${key}.webp`]

// 멀티라인 크리덴셜 값을 스캔하기 쉬운 줄 단위 리스트로 분해
const toLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const About = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const isAdminUser = isAdmin()
  const ko = language === 'ko'

  // 배경은 CSS background-image 가 아니라 <img> 로 그린다.
  // background-image 는 로드 상태를 알 수 없어 그라데이션에서 사진으로 툭 튀지만,
  // <img> 는 onLoad 로 페이드인할 수 있고 fetchPriority 힌트도 줄 수 있다.
  const [heroLoaded, setHeroLoaded] = useState(false)

  // 브라우저 캐시에 이미 있으면 React 가 리스너를 붙이기 전에 로드가 끝나 onLoad 가
  // 영영 안 올 수 있다. ref 콜백 시점에 complete 를 직접 확인해 그 경우를 메운다.
  const heroImageRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setHeroLoaded(true)
  }, [])

  // 선택된 만남 — 기본은 손수건(반전이 먼저 보이게)
  const [meetingKey, setMeetingKey] = useState<MeetingKey>('handkerchief')
  const activeMeeting = MEETINGS.find((m) => m.key === meetingKey) ?? MEETINGS[MEETINGS.length - 1]
  const activeImage = meetingImage(activeMeeting.key)

  const phone = tx('aboutPhone').trim()
  const pastorPhotoUrl = tx('aboutPastorPhoto').trim()

  // 예전엔 카카오맵을 새 탭으로 던졌지만, 지금은 앱 안에 오시는 길 페이지가 있다.
  // 길찾기 앱으로 넘기는 건 /visit 이 각 지도 앱 버튼으로 담당한다.
  const openMap = () => navigate('/visit')

  // 히어로 "교회 소개" — 페이지 내 첫 섹션으로 부드럽게.
  // window.scrollTo 는 #root overflow 탓에 무력이고, scrollIntoView(smooth) 는
  // 이 앱의 스크롤러가 body 인 모바일에서 조용히 실패했다 → 공용 유틸로 직접 민다.
  // 56px 은 고정 헤더 높이(.main-content padding-top).
  const scrollToIntro = () => {
    smoothScrollToElement(document.getElementById('about-intro'), { offset: 56 })
  }

  // CTA 타일의 한 줄 설명 — 라벨만 있던 버튼을 "무엇을 얻는지"가 보이는 타일로
  const ctaTiles = [
    { to: '/register', Icon: SproutIcon, title: ko ? '처음 오셨나요?' : 'New Here?', desc: ko ? '환영합니다!' : 'Welcome!', primary: true },
    { to: '/sermon', Icon: BookOpenIcon, title: ko ? '최근 설교 보기' : 'Recent Sermons', desc: ko ? '말씀 다시 듣기' : 'Listen again' },
    { to: '/history', Icon: FlagIcon, title: ko ? '참빛의 발자취' : 'Our Story', desc: ko ? '우리의 이야기' : 'Where we came from' },
    { to: '/organization', Icon: OrgChartIcon, title: ko ? '교회 조직도' : 'Org Chart', desc: ko ? '함께 섬겨요' : 'Serving together' },
  ] as const

  // EditableText 가 <button> 을 렌더하므로 행 자체는 button 이 아닌 div 로 만들어
  // 중첩 인터랙티브 요소를 피한다 (편집 버튼은 stopPropagation 으로 행 클릭과 분리됨)
  const rowKeyDown = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  // 한눈에 정보 스트립 — 본문(모바일)과 우측 레일(lg+)이 같은 마크업을 공유한다.
  // 두 곳에 렌더되지만 CSS로 한 번에 하나만 보이므로 편집 UI가 겹치지 않는다.
  // 초대(CTA)를 받은 다음 "언제, 어디로 가면 되지?"에 답하는 카드
  const callPhone = () => {
    if (phone) window.location.assign(`tel:${phone.replace(/[^0-9+]/g, '')}`)
  }

  // 한눈에 정보 — 벤토 그리드. 본문(모바일)과 히어로 우측(lg+)이 같은 마크업을 공유한다.
  // 두 곳에 렌더되지만 CSS로 한 번에 하나만 보이므로 편집 UI가 겹치지 않는다.
  // 타일 크기 = 우선순위: 주일예배(2칸, 브랜드 반전) > 오시는 길 · 전화(1칸씩)
  const renderQuickInfo = (modifier = '') => (
    <section className={`about-quickinfo${modifier}`} aria-label={ko ? '한눈에 정보' : 'Quick info'}>
      <div
        className="quickinfo-tile quickinfo-tile--worship"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/worship')}
        onKeyDown={rowKeyDown(() => navigate('/worship'))}
      >
        <span className="quickinfo-icon">
          <ClockIcon size={20} />
        </span>
        <span className="quickinfo-chevron">
          <ChevronRightIcon size={18} />
        </span>
        <span className="quickinfo-main">
          <span className="quickinfo-label">{ko ? '주일예배' : 'Sunday Worship'}</span>
          <span className="quickinfo-value">
            <EditableText fieldKey="aboutInfoWorship" isAdmin={isAdminUser}>
              {tx('aboutInfoWorship')}
            </EditableText>
          </span>
        </span>
      </div>

      <div
        className="quickinfo-tile quickinfo-tile--map"
        role="button"
        tabIndex={0}
        onClick={openMap}
        onKeyDown={rowKeyDown(openMap)}
      >
        <span className="quickinfo-icon">
          <MapPinIcon size={20} />
        </span>
        <span className="quickinfo-chevron">
          <ChevronRightIcon size={18} />
        </span>
        <span className="quickinfo-main">
          <span className="quickinfo-label">{ko ? '오시는 길' : 'Directions'}</span>
          <span className="quickinfo-value">
            <EditableText fieldKey="aboutAddress" isAdmin={isAdminUser}>
              {tx('aboutAddress')}
            </EditableText>
          </span>
        </span>
      </div>

      {(phone.length > 0 || isAdminUser) && (
        <div
          className="quickinfo-tile quickinfo-tile--phone"
          role="button"
          tabIndex={0}
          onClick={callPhone}
          onKeyDown={rowKeyDown(callPhone)}
        >
          <span className="quickinfo-icon">
            <PhoneIcon size={20} />
          </span>
          {phone.length > 0 && (
            <span className="quickinfo-chevron">
              <ChevronRightIcon size={18} />
            </span>
          )}
          <span className="quickinfo-main">
            <span className="quickinfo-label">{ko ? '전화' : 'Phone'}</span>
            <span className={`quickinfo-value${phone ? '' : ' is-empty'}`}>
              <EditableText fieldKey="aboutPhone" isAdmin={isAdminUser}>
                {phone || (ko ? '전화번호를 등록해주세요' : 'Add a phone number')}
              </EditableText>
            </span>
          </span>
        </div>
      )}

      {isAdminUser && (
        <div className="quickinfo-admin-map">
          {ko
            ? '지도 검색어·주차·사진 안내는 오시는 길 페이지에서 수정합니다.'
            : 'Map query, parking and photos are edited on the Directions page.'}
        </div>
      )}
    </section>
  )

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 좁은 셸을 풀고 랜딩형 1단 — 히어로 카드(우측에 한눈에 정보) 아래로
          섹션 카드들이 같은 폭으로 쌓인다. 우측 레일은 히어로 안으로 들어갔다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:min-w-0 lg:bg-transparent lg:dark:bg-transparent lg:border-0 lg:min-h-0">
        {/* Hero — 사진을 온전히 보여주고 텍스트는 하단 스크림 위에 좌측 정렬 */}
        <div className="about-hero">
          {/* crossOrigin: CORS 응답이어야 서비스워커가 상태 코드를 보고 캐싱할 수 있다
              (no-cors 는 opaque 라 404 도 그대로 캐싱된다).
              index.html 의 preload 링크도 같은 crossorigin 이어야 재사용된다. */}
          {heroBackgroundUrl && (
            <img
              ref={heroImageRef}
              className={`hero-image${heroLoaded ? ' is-loaded' : ''}`}
              src={heroBackgroundUrl}
              alt=""
              aria-hidden="true"
              decoding="async"
              fetchPriority="high"
              crossOrigin="anonymous"
              onLoad={() => setHeroLoaded(true)}
            />
          )}
          <div className="hero-scrim"></div>
          <div className="hero-content">
            <h1 className="hero-title">
              <EditableText fieldKey="aboutChurchName" isAdmin={isAdminUser}>
                {tx('aboutChurchName')}
              </EditableText>
            </h1>
            <p className="hero-subtitle">
              <EditableText fieldKey="aboutTagline" isAdmin={isAdminUser}>
                {tx('aboutTagline')}
              </EditableText>
            </p>
            {/* 첫 화면에서 바로 갈 수 있는 두 갈래 — 예배 안내(실행) / 교회 소개(읽기) */}
            <div className="hero-actions">
              <button
                type="button"
                className="hero-action hero-action--primary"
                onClick={() => navigate('/worship')}
              >
                <span>{ko ? '예배 안내 보기' : 'Worship Times'}</span>
                <ChevronRightIcon size={16} />
              </button>
              <button type="button" className="hero-action" onClick={scrollToIntro}>
                <span>{ko ? '교회 소개' : 'About Us'}</span>
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
          {/* lg+: 한눈에 정보 카드가 히어로 우측에 떠 있다 (모바일은 CTA 아래 본문 버전) */}
          {renderQuickInfo(' about-quickinfo--hero')}
          <HeroEditButton isAdmin={isAdminUser} />
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Intro Section */}
          <section id="about-intro" className="intro-section">
            <div className="section-badge">
              <EditableText fieldKey="aboutOurStory" isAdmin={isAdminUser}>
                {tx('aboutOurStory')}
              </EditableText>
            </div>
            <h2 className="section-title" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutMainTitle" multiline isAdmin={isAdminUser}>
                {tx('aboutMainTitle')}
              </EditableText>
            </h2>
            <p className="intro-text" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutMainText" multiline isAdmin={isAdminUser}>
                {tx('aboutMainText')}
              </EditableText>
            </p>

            <div className="quote-card">
              <div className="quote-icon">"</div>
              <p className="quote-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPromiseQuote" multiline isAdmin={isAdminUser}>
                  {tx('aboutPromiseQuote')}
                </EditableText>
              </p>
              <div className="quote-author">
                <EditableText fieldKey="aboutPromiseAuthor" isAdmin={isAdminUser}>
                  {tx('aboutPromiseAuthor')}
                </EditableText>
              </div>
            </div>
          </section>

          {/* Meeting Types — "비교표"가 아니라 반전이 있는 스토리로:
              스쳐가는 만남 4줄(낮은 대비) 뒤에 브랜드 카드가 크게 받는다 */}
          <section id="about-meeting" className="meeting-section">
            <h3 className="meeting-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h3>
            {/* 행을 누르면 오른쪽 카드가 그 만남의 장면(이미지+문구)으로 바뀐다.
                기본 선택은 손수건 — 아무것도 안 눌러도 반전이 먼저 보인다 */}
            <div className="meeting-pass" role="tablist" aria-label={tx('aboutMeetingTitle')}>
              {MEETINGS.map(({ key, field, good }) => {
                const selected = key === meetingKey
                return (
                  <div
                    className={`meeting-pass-row${good ? ' meeting-pass-row--good' : ''}${selected ? ' is-selected' : ''}`}
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    tabIndex={0}
                    onClick={() => setMeetingKey(key)}
                    onKeyDown={rowKeyDown(() => setMeetingKey(key))}
                  >
                    {good ? (
                      <HeartIcon size={15} className="meeting-pass-x" />
                    ) : (
                      <XIcon size={15} className="meeting-pass-x" />
                    )}
                    <p style={{ whiteSpace: 'pre-line' }}>
                      <EditableText fieldKey={field} multiline={good} isAdmin={isAdminUser}>
                        {tx(field)}
                      </EditableText>
                    </p>
                    <span className="meeting-pass-chevron">
                      <ChevronRightIcon size={16} />
                    </span>
                  </div>
                )
              })}
            </div>
            <div
              className={`meeting-good-card${activeMeeting.good ? '' : ' meeting-good-card--pass'}`}
              key={activeMeeting.key}
            >
              {/* 장면 이미지 — docs/meeting-image-prompts.md 로 생성해 ./img/{key}.webp 에 넣으면 자동 연결 */}
              {activeImage && <img className="meeting-scene" src={activeImage} alt="" aria-hidden="true" />}
              <span className="meeting-good-emblem">
                {activeMeeting.good ? <HeartIcon size={30} /> : <XIcon size={26} />}
              </span>
              <p className="good-text" style={{ whiteSpace: 'pre-line' }}>
                {activeMeeting.good ? (
                  <EditableText fieldKey="aboutMeetingGood" multiline isAdmin={isAdminUser}>
                    {tx('aboutMeetingGood')}
                  </EditableText>
                ) : (
                  tx(activeMeeting.field)
                )}
              </p>
            </div>
          </section>

          {/* Pastor Section — 이력서가 아니라 편지: 사진 + 서체 + 서명, 약력은 접기 */}
          <section id="about-pastor" className="pastor-section">
            <div className="section-badge">
              <EditableText fieldKey="aboutPastorBadge" isAdmin={isAdminUser}>
                {tx('aboutPastorBadge')}
              </EditableText>
            </div>

            <div className="pastor-head">
              <div className="pastor-photo-slot">
              <EditableImage
                fieldKey="aboutPastorPhoto"
                currentUrl={pastorPhotoUrl}
                isAdmin={isAdminUser}
                title={ko ? '담임목사 사진' : 'Pastor Photo'}
              >
                {pastorPhotoUrl ? (
                  <img className="pastor-photo" src={pastorPhotoUrl} alt={tx('aboutPastorName')} />
                ) : isAdminUser ? (
                  <span className="pastor-photo pastor-photo--empty" aria-hidden="true">
                    <CameraIcon size={22} />
                  </span>
                ) : null}
              </EditableImage>
              </div>
              <div className="pastor-head-text">
                <h2 className="pastor-name">
                  <EditableText fieldKey="aboutPastorName" isAdmin={isAdminUser}>
                    {tx('aboutPastorName')}
                  </EditableText>
                </h2>
                <div className="pastor-nickname">
                  <EditableText fieldKey="aboutPastorNickname" isAdmin={isAdminUser}>
                    {tx('aboutPastorNickname')}
                  </EditableText>
                </div>
              </div>
            </div>

            <div className="pastor-letter">
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro1" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro1')}
                </EditableText>
              </p>
              <p className="pastor-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro2" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro2')}
                </EditableText>
              </p>
              <p className="pastor-text highlight" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutPastorIntro3" multiline isAdmin={isAdminUser}>
                  {tx('aboutPastorIntro3')}
                </EditableText>
              </p>
              <div className="pastor-signature">
                <EditableText fieldKey="aboutPastorSignature" isAdmin={isAdminUser}>
                  {tx('aboutPastorSignature')}
                </EditableText>
              </div>
            </div>

            {/* Credentials — 모바일은 접힌 약력, lg+ 는 벤토 타일 3개(아래)로 펼친다 */}
            <details className="pastor-credentials">
              <summary>
                <span>{ko ? '약력 보기' : 'View Credentials'}</span>
                <ChevronDownIcon size={18} className="pastor-credentials-chevron" />
              </summary>
              {/* 학력·경력·수상을 3열로 나란히 — 세로 한 줄로 늘어뜨리면 오른쪽이 비어 어색하다 */}
              <div className="credentials">
                {CREDENTIALS.map(([labelKey, valueKey, Icon]) => (
                  <div className="credential-item" key={labelKey}>
                    <div className="credential-label">
                      <Icon size={18} className="credential-label-icon" />
                      <EditableText fieldKey={labelKey} isAdmin={isAdminUser}>
                        {tx(labelKey)}
                      </EditableText>
                    </div>
                    <div className="credential-value">
                      <EditableText fieldKey={valueKey} multiline isAdmin={isAdminUser}>
                        <ul className="credential-list">
                          {toLines(tx(valueKey)).map((line, i) => (
                            <li key={i} className="credential-line">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </EditableText>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* lg+ 벤토: 학력·경력·수상을 접지 않고 작은 타일 3개로 — 그리드 안에서
                사진·편지 타일과 크기 위계를 이룬다 (모바일은 위 details 가 보이고 이건 숨김) */}
            {CREDENTIALS.map(([labelKey, valueKey, Icon]) => (
              <div className={`pastor-tile pastor-tile--cred pastor-tile--${labelKey}`} key={`tile-${labelKey}`}>
                <div className="credential-label">
                  <Icon size={18} className="credential-label-icon" />
                  <EditableText fieldKey={labelKey} isAdmin={isAdminUser}>
                    {tx(labelKey)}
                  </EditableText>
                </div>
                <EditableText fieldKey={valueKey} multiline isAdmin={isAdminUser}>
                  <ul className="credential-list">
                    {toLines(tx(valueKey)).map((line, i) => (
                      <li key={i} className="credential-line">
                        {line}
                      </li>
                    ))}
                  </ul>
                </EditableText>
              </div>
            ))}

            {/* 인사말 전문은 /greeting 이 담당한다 — 여기 요약을 읽은 사람에게
                "더 읽고 싶다"는 다음 걸음을 준다 (역대 담임목사도 그 페이지에 있다) */}
            <button
              type="button"
              className="pastor-greeting-link"
              onClick={() => navigate('/greeting')}
            >
              <span>{ko ? '담임목사 인사말 전문 보기' : 'Read the full greeting'}</span>
              <ChevronRightIcon size={16} />
            </button>
          </section>

          {/* CTA Section — 처음 방문자 여정이 주인공 */}
          <section id="about-cta" className="cta-section">
            <div className="cta-card">
              <h3 className="cta-title">
                <EditableText fieldKey="aboutCtaTitle" isAdmin={isAdminUser}>
                  {tx('aboutCtaTitle')}
                </EditableText>
                <HeartIcon size={22} className="cta-title-heart" />
              </h3>
              <p className="cta-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutCtaText" multiline isAdmin={isAdminUser}>
                  {tx('aboutCtaText')}
                </EditableText>
              </p>

              <div className="cta-actions">
                {ctaTiles.map(({ to, Icon, title, desc, ...rest }) => (
                  <button
                    key={to}
                    type="button"
                    className={`cta-action${'primary' in rest && rest.primary ? ' cta-action--primary' : ''}`}
                    onClick={() => navigate(to)}
                  >
                    <span className="cta-action-icon">
                      <Icon size={20} />
                    </span>
                    <span className="cta-action-text">
                      <span className="cta-action-title">{title}</span>
                      <span className="cta-action-desc">{desc}</span>
                    </span>
                    <span className="cta-action-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                ))}
              </div>

              <div className="cta-foot">
                <div className="cta-badge">
                  <EditableText fieldKey="aboutCtaBadge" isAdmin={isAdminUser}>
                    <EmojiText text={tx('aboutCtaBadge')} />
                  </EditableText>
                </div>
                {/* 감사 인사 — 초대 카드의 맺음말로 안에 들인다 */}
                <p className="footer-text" style={{ whiteSpace: 'pre-line' }}>
                  <EditableText fieldKey="aboutFooterMessage" multiline isAdmin={isAdminUser}>
                    <EmojiText text={tx('aboutFooterMessage')} />
                  </EditableText>
                </p>
              </div>
            </div>
          </section>

          {renderQuickInfo(' about-quickinfo--body')}

          {isAdminUser && (
            <div className="about-admin-hint">
              {ko
                ? '연필 아이콘을 눌러 텍스트와 사진을 바로 수정할 수 있습니다.'
                : 'Click the pencil icon to edit text and photos inline.'}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  )
}

export default About
