import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import { useAboutContent } from '../../hooks/useAboutContent'
import { EditableText, EditableImage, HeroEditButton } from '../../components/AboutEditor'
import { captureAboutHeroLqip, readAboutHeroLqip } from '../../utils/aboutHeroLqip'
import {
  BookOpenIcon,
  ChevronRightIcon,
  FlagIcon,
  PeopleIcon,
} from './icons'
import { EmojiText } from '../../components/common/EmojiText'
import { SignatureLine } from '../../components/common/SignatureLine'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { smoothScrollToElement } from '../../utils/scrollTo'
import pastorPhoto from '../../assets/about-pastor/pastor.webp'
import './styles/index.css'
import { can } from '../../utils/access'
import { useThemeArt } from '../../hooks/useThemeArt'
import { ABOUT_DAWN_MOBILE, ABOUT_DAWN_PC, PRAYER_WEEK_WINDOW, pairSrc } from '../../utils/themeAssets'
import { useTheme } from '../../contexts/ThemeContext'
import InviteSection from './components/InviteSection'

/* /about — "참 빛" 잡지형 소개.
   첫 화면은 하늘에 걸린 말씀 족자(세로쓰기 '참빛' + 요 1:9) + 아래 한 줄 바로가기·예배 버튼.
   그 아래는 그림·글을 좌우로 번갈아 놓은 장들 — 만남 → 다섯 만남(지워지는 네 줄 + 약속 | 본당 안 빛) → 담임목사 → 초대(이번 주일 초대장).
   예전 스티키 고정 그림은 세로로 길고 장면이 겹쳐 보여 걷어냈다. */

// 서체 — 교회 이름 G마켓 · 첫 화면 세로 말씀 고운바탕 · 인용 고운돋움(--ab-verse) · 손글씨는 목사님 별칭에만
ensureFontFamily('nanumPen')
ensureFontFamily('gowunDodum')
ensureFontFamily('gowunBatang') // 첫 화면 세로 말씀

// 다섯 만남 중 스쳐 가는 네 만남 — 관리자 문구 키
const PASSING_MEETINGS = ['aboutMeetingBad1', 'aboutMeetingBad2', 'aboutMeetingBad3', 'aboutMeetingBad4'] as const

const CREDENTIALS = [
  ['aboutEducationLabel', 'aboutEducationValue'],
  ['aboutCareerLabel', 'aboutCareerValue'],
  ['aboutAwardLabel', 'aboutAwardValue'],
] as const

// 01 만남 — 관리자 히어로 사진이 없을 때 빈 상자 대신 깔 새벽 그림
const MEET_FALLBACK = '/images/history/verse-dawn.webp'

// 첫 화면 바로가기 — HashRouter 라 #앵커 링크 대신 scrollIntoView
const SECTIONS = ['about-intro', 'about-meetings', 'about-pastor', 'about-cta'] as const
type SectionId = (typeof SECTIONS)[number]
// 첫 화면 아래 줄 바로가기 — '함께 예배'는 오른쪽 예배 버튼이 맡는다
const JUMP_SECTIONS = SECTIONS.filter((id) => id !== 'about-cta')
/** 바로가기 착지 여백 — .ab-row 등의 scroll-margin-top(5rem)과 동일 */
const JUMP_OFFSET = 80

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

// 출처 — 세로쓰기 안의 '1:9' 같은 숫자 묶음은 가로로 한 칸에 세운다(text-combine-upright)
const REF_NUM_RE = /(\d+(?::\d+)?)/
const VerseRef = ({ text, upright }: { text: string; upright: boolean }) =>
  upright ? (
    <>
      {text.split(REF_NUM_RE).map((part, i) =>
        REF_NUM_RE.test(part) ? (
          <span key={i} className="ab-tcy">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  ) : (
    <>{text}</>
  )

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
  const { theme } = useTheme()
  const meetPhoto = pairSrc(PRAYER_WEEK_WINDOW, theme)

  // 다섯 만남 — 화면에 들어올 때 한 번 줄을 긋는다
  const meetRef = useRef<HTMLElement | null>(null)
  // IntersectionObserver 가 없는 옛 브라우저는 처음부터 다 그어진 모습
  const [meetShown, setMeetShown] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = meetRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMeetShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

  // 족자의 큰 두 글자 — 교회 이름에서 '교회'를 뗀다(참빛교회 → 참빛)
  const churchMark = tx('aboutChurchName').trim().replace(/\s*교회$/, '') || '참빛'
  const pastorPhotoUrl = tx('aboutPastorPhoto').trim()
  // scrollIntoView(smooth) 는 이 앱의 body 스크롤러 구조에서 모바일이 조용히 무시한다 —
  // 공용 smoothScrollToElement 로 스크롤러를 직접 민다(감속 설정은 헬퍼가 처리).
  // offset 은 장의 scroll-margin-top(5rem, magazine.css)과 같은 값.
  const jumpTo = (id: SectionId) => {
    smoothScrollToElement(document.getElementById(id), { offset: JUMP_OFFSET })
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
      {/* ── 첫 화면: 하늘에 걸린 말씀 족자 — 오른쪽 위 세로쓰기 '참빛' + 요 1:9,
             아래 한 줄은 바로가기 · 교회 이름 묶음 + 예배 버튼 (dawn.css) ── */}
      <section className={`ab-dawn ab-sky${ko ? ' is-vertical' : ''}`} aria-label={tx('aboutChurchName')}>
        <span className={`ab-dawn-art${dawnArtReady ? ' is-loaded' : ''}`} aria-hidden="true" />
        <span className="ab-dawn-shade" aria-hidden="true" />

        <div className="ab-dawn-scroll">
          {/* '참빛' — 교회 이름이 곧 요 1:9 의 첫 말씀. 세로쓰기는 한국어만 */}
          {ko && (
            <p className="ab-dawn-mark" aria-hidden="true">
              {Array.from(churchMark).map((ch, i) => (
                <span key={i} className={ch === '빛' ? 'is-light' : undefined}>
                  {ch}
                </span>
              ))}
            </p>
          )}
          <p className="ab-dawn-verse">
            <EditableText fieldKey="aboutDawnVerse" multiline isAdmin={isAdminUser}>
              {/* 세로쓰기에선 쉼표가 글자 아래 점처럼 떠 어색하다 — 줄바꿈이 쉼표를 대신한다 */}
              <DawnVerse text={ko ? tx('aboutDawnVerse').replace(/[,，、]/g, '') : tx('aboutDawnVerse')} />
            </EditableText>
          </p>
          <p className="ab-dawn-ref">
            <EditableText fieldKey="aboutDawnRef" isAdmin={isAdminUser}>
              <VerseRef text={tx('aboutDawnRef')} upright={ko} />
            </EditableText>
          </p>
        </div>

        <div className="ab-dawn-base">
          <nav className="ab-dawn-jump" aria-label={ko ? '소개 바로가기' : 'Jump to section'}>
            {JUMP_SECTIONS.map((id) => (
              <button key={id} type="button" onClick={() => jumpTo(id)}>
                {sectionLabels[id]}
              </button>
            ))}
          </nav>
          <div className="ab-dawn-foot">
            <div className="ab-dawn-id">
              <h1>
                <EditableText fieldKey="aboutChurchName" isAdmin={isAdminUser}>
                  {tx('aboutChurchName')}
                </EditableText>
              </h1>
              <p>
                <EditableText fieldKey="aboutTagline" isAdmin={isAdminUser}>
                  {tx('aboutTagline')}
                </EditableText>
              </p>
            </div>
            <button type="button" className="ab-dawn-cta" onClick={() => jumpTo('about-cta')}>
              {ko ? '주일 오전 11시 함께 예배' : 'Worship with us · Sun 11 AM'}
            </button>
          </div>
        </div>
      </section>

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

        {/* ── 다섯 만남 — 지워지는 네 줄 + 약속 | 계절 교회 사진 (2026-11-18 A1) ──
             화면에 들어오면 네 줄에 차례로 취소선이 그어지고 약속이 제자리에서 떠오른다(선·투명도만, 자리 이동 없음) */}
        <section
          id="about-meetings"
          ref={meetRef}
          className={`ab-meet${meetShown ? ' is-on' : ''}`}
        >
          <div className="ab-meet-txt">
            {tag(ko ? '다섯 만남' : 'Five meetings')}
            <h2 className="ab-title">
              <EditableText fieldKey="aboutMeetingTitle" isAdmin={isAdminUser}>
                {tx('aboutMeetingTitle')}
              </EditableText>
            </h2>
            <ol className="ab-meet-list">
              {PASSING_MEETINGS.map((field, i) => (
                <li key={field} style={{ '--i': i } as React.CSSProperties}>
                  <s>
                    <EditableText fieldKey={field} isAdmin={isAdminUser}>
                      {tx(field)}
                    </EditableText>
                  </s>
                </li>
              ))}
            </ol>
            <blockquote className="ab-promise">
              <small>{ko ? '그리고, 단 하나의 만남' : 'And the one meeting'}</small>
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
          </div>
          {/* 본당 안 — 십자가 벽에 비스듬히 떨어지는 빛(라이트 = 낮 햇살, 다크 = 푸른 밤빛·켜진 십자가).
               아래 초대장이 교회 밖 풍경이라 여기는 안. 실내라 계절 입자는 없다 */}
          <figure className="ab-meet-pic">
            <img src={meetPhoto} alt={ko ? '참빛교회 본당' : 'Chambit Church sanctuary'} loading="lazy" decoding="async" />
            <figcaption>{ko ? '참빛교회 본당' : 'Our sanctuary'}</figcaption>
          </figure>
        </section>

        {/* ── 담임목사 — 사진과 글을 한 판에 담는다(사진 왼쪽 · 글 오른쪽, 위 다섯 만남 판과 좌우 엇갈림) ── */}
        <section id="about-pastor" className="ab-row ab-pastor">
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
                  {/* 관리자 문구의 줄바꿈 한 줄 = 항목 하나 */}
                  <dd>
                    <EditableText fieldKey={valueKey} multiline isAdmin={isAdminUser}>
                      <span className="ab-fact-lines">
                        {toLines(tx(valueKey)).map((line, i) => (
                          <span key={`${i}-${line}`}>{line}</span>
                        ))}
                      </span>
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

        {/* ── 초대 — 이번 주일 초대장 (components/InviteSection) ── */}
        <InviteSection
          tag={tag(ko ? '초대' : 'Invitation')}
          tx={tx}
          isAdminUser={isAdminUser}
          isLoggedIn={isLoggedIn()}
        />

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
