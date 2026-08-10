import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
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
} from './icons'
import './styles/index.css'

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

  const phone = tx('aboutPhone').trim()
  const pastorPhotoUrl = tx('aboutPastorPhoto').trim()

  const openMap = () => {
    const query = tx('aboutMapQuery').trim() || tx('aboutChurchName')
    window.open(
      `https://map.kakao.com/link/search/${encodeURIComponent(query)}`,
      '_blank',
      'noopener'
    )
  }

  // EditableText 가 <button> 을 렌더하므로 행 자체는 button 이 아닌 div 로 만들어
  // 중첩 인터랙티브 요소를 피한다 (편집 버튼은 stopPropagation 으로 행 클릭과 분리됨)
  const rowKeyDown = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
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
          </div>
          <HeroEditButton isAdmin={isAdminUser} />
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Intro Section */}
          <section className="intro-section">
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
          <section className="meeting-section">
            <h3 className="meeting-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h3>
            <div className="meeting-pass">
              {(['aboutMeetingBad1', 'aboutMeetingBad2', 'aboutMeetingBad3', 'aboutMeetingBad4'] as const).map(
                (key) => (
                  <div className="meeting-pass-row" key={key}>
                    <XIcon size={15} className="meeting-pass-x" />
                    <p>
                      <EditableText fieldKey={key} isAdmin={isAdminUser}>
                        {tx(key)}
                      </EditableText>
                    </p>
                  </div>
                )
              )}
            </div>
            <div className="meeting-good-card">
              <HeartIcon size={24} />
              <p className="good-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutMeetingGood" multiline isAdmin={isAdminUser}>
                  {tx('aboutMeetingGood')}
                </EditableText>
              </p>
            </div>
          </section>

          {/* Pastor Section — 이력서가 아니라 편지: 사진 + 서체 + 서명, 약력은 접기 */}
          <section className="pastor-section">
            <div className="section-badge">
              <EditableText fieldKey="aboutPastorBadge" isAdmin={isAdminUser}>
                {tx('aboutPastorBadge')}
              </EditableText>
            </div>

            <div className="pastor-head">
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

            {/* Credentials — 접힌 약력 */}
            <details className="pastor-credentials">
              <summary>
                <span>{ko ? '약력 보기' : 'View Credentials'}</span>
                <ChevronDownIcon size={18} className="pastor-credentials-chevron" />
              </summary>
              <div className="credentials">
                {(
                  [
                    ['aboutEducationLabel', 'aboutEducationValue'],
                    ['aboutCareerLabel', 'aboutCareerValue'],
                    ['aboutAwardLabel', 'aboutAwardValue'],
                  ] as const
                ).map(([labelKey, valueKey]) => (
                  <div className="credential-item" key={labelKey}>
                    <div className="credential-label">
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
          </section>

          {/* CTA Section — 처음 방문자 여정이 주인공 */}
          <section className="cta-section">
            <div className="cta-card">
              <h3 className="cta-title">
                <EditableText fieldKey="aboutCtaTitle" isAdmin={isAdminUser}>
                  {tx('aboutCtaTitle')}
                </EditableText>
              </h3>
              <p className="cta-text" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="aboutCtaText" multiline isAdmin={isAdminUser}>
                  {tx('aboutCtaText')}
                </EditableText>
              </p>

              <div className="cta-actions">
                <button
                  type="button"
                  className="cta-action cta-action--primary"
                  onClick={() => navigate('/register')}
                >
                  <SproutIcon size={18} />
                  <span>{ko ? '처음 오셨나요?' : 'New Here?'}</span>
                </button>
                <button
                  type="button"
                  className="cta-action"
                  onClick={() => navigate('/sermon')}
                >
                  <BookOpenIcon size={18} />
                  <span>{ko ? '최근 설교 보기' : 'Recent Sermons'}</span>
                </button>
                <button
                  type="button"
                  className="cta-action"
                  onClick={() => navigate('/history')}
                >
                  <FlagIcon size={18} />
                  <span>{ko ? '참빛의 발자취' : 'Our Story'}</span>
                </button>
                <button
                  type="button"
                  className="cta-action"
                  onClick={() => navigate('/organization')}
                >
                  <OrgChartIcon size={18} />
                  <span>{ko ? '교회 조직도' : 'Org Chart'}</span>
                </button>
              </div>

              <div className="cta-badge">
                <EditableText fieldKey="aboutCtaBadge" isAdmin={isAdminUser}>
                  {tx('aboutCtaBadge')}
                </EditableText>
              </div>
            </div>
          </section>

          {/* 한눈에 — 초대(CTA)를 받은 다음 "언제, 어디로 가면 되지?"에 답하는 카드 */}
          <section className="about-quickinfo">
            <div
              className="quickinfo-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/worship')}
              onKeyDown={rowKeyDown(() => navigate('/worship'))}
            >
              <span className="quickinfo-icon">
                <ClockIcon size={20} />
              </span>
              <span className="quickinfo-main">
                <span className="quickinfo-label">{ko ? '주일예배' : 'Sunday Worship'}</span>
                <span className="quickinfo-value">
                  <EditableText fieldKey="aboutInfoWorship" isAdmin={isAdminUser}>
                    {tx('aboutInfoWorship')}
                  </EditableText>
                </span>
              </span>
              <span className="quickinfo-chevron">
                <ChevronRightIcon size={18} />
              </span>
            </div>

            <div
              className="quickinfo-row"
              role="button"
              tabIndex={0}
              onClick={openMap}
              onKeyDown={rowKeyDown(openMap)}
            >
              <span className="quickinfo-icon">
                <MapPinIcon size={20} />
              </span>
              <span className="quickinfo-main">
                <span className="quickinfo-label">{ko ? '오시는 길' : 'Directions'}</span>
                <span className="quickinfo-value">
                  <EditableText fieldKey="aboutAddress" isAdmin={isAdminUser}>
                    {tx('aboutAddress')}
                  </EditableText>
                </span>
              </span>
              <span className="quickinfo-chevron">
                <ChevronRightIcon size={18} />
              </span>
            </div>

            {(phone.length > 0 || isAdminUser) && (
              <div
                className="quickinfo-row"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (phone) window.location.assign(`tel:${phone.replace(/[^0-9+]/g, '')}`)
                }}
                onKeyDown={rowKeyDown(() => {
                  if (phone) window.location.assign(`tel:${phone.replace(/[^0-9+]/g, '')}`)
                })}
              >
                <span className="quickinfo-icon">
                  <PhoneIcon size={20} />
                </span>
                <span className="quickinfo-main">
                  <span className="quickinfo-label">{ko ? '전화' : 'Phone'}</span>
                  <span className={`quickinfo-value${phone ? '' : ' is-empty'}`}>
                    <EditableText fieldKey="aboutPhone" isAdmin={isAdminUser}>
                      {phone || (ko ? '전화번호를 등록해주세요' : 'Add a phone number')}
                    </EditableText>
                  </span>
                </span>
                {phone.length > 0 && (
                  <span className="quickinfo-chevron">
                    <ChevronRightIcon size={18} />
                  </span>
                )}
              </div>
            )}

            {isAdminUser && (
              <div className="quickinfo-admin-map">
                {ko ? '지도 검색어: ' : 'Map search query: '}
                <EditableText fieldKey="aboutMapQuery" isAdmin={isAdminUser}>
                  {tx('aboutMapQuery')}
                </EditableText>
              </div>
            )}
          </section>

          {/* Footer Message */}
          <section className="footer-message">
            <p className="footer-text" style={{ whiteSpace: 'pre-line' }}>
              <EditableText fieldKey="aboutFooterMessage" multiline isAdmin={isAdminUser}>
                {tx('aboutFooterMessage')}
              </EditableText>
            </p>
          </section>

          {isAdminUser && (
            <div className="about-admin-hint">
              {ko
                ? '✏️ 아이콘을 눌러 텍스트와 사진을 바로 수정할 수 있습니다.'
                : 'Click the ✏️ icon to edit text and photos inline.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default About
