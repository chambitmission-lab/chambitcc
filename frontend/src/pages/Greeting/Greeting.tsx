// 교회소개 > 인사말 (/greeting)
//
// 담임목사 개인 정보는 church_pastors 테이블(다건)에서 온다 — 목사가 바뀌면
// 이 화면을 고치는 게 아니라 /admin/pastors 에서 새 레코드를 현직으로 지정한다.
// 페이지가 하는 말(히어로 문구·섹션 제목)만 about_content.fields 를 공유해
// 기존 ✏️ 인라인 편집(EditableText)으로 고칠 수 있다.
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { useAboutContent } from '../../hooks/useAboutContent'
import { usePastors } from '../../hooks/usePastors'
import { EditableText } from '../../components/AboutEditor'
import { pastorText, pastorTermLabel } from '../../types/pastor'
import type { Pastor } from '../../types/pastor'
import EditablePastorText from './components/EditablePastorText'
import EditablePastorPhoto from './components/EditablePastorPhoto'
import PastorSheet from './components/PastorSheet'
import LetterBody from './components/LetterBody'
import GreetingRail from './components/GreetingRail'
import { SIGNATURE_INK } from './components/signatureInk'
import CredentialTimeline, { CREDENTIAL_ICONS } from './components/CredentialTimeline'
import {
  CameraIcon,
  ChevronRightIcon,
  QuoteIcon,
  ShareIcon,
  SproutIcon,
  UsersIcon,
} from './icons'
import { getNaturalSeason, type NaturalSeason } from '../../utils/naturalSeason'
import heroSpringDay from '../../assets/hero/spring-afternoon.jpg'
import heroSummerDay from '../../assets/hero/afternoon.jpg'
import heroAutumnDay from '../../assets/hero/autumn-afternoon.jpg'
import heroWinterDay from '../../assets/hero/winter-afternoon.jpg'
import './styles/index.css'

/* 서명 문장 안의 이름만 손글씨 잉크로 바꿔 "참빛교회 담임목사 [사인] 올림" 으로 읽히게 한다.
   등록된 이름이 아니면 텍스트 그대로. */
function SignatureLine({ text, name }: { text: string; name: string }) {
  const ink = name ? SIGNATURE_INK[name] : undefined
  const at = ink && name ? text.indexOf(name) : -1
  if (!ink || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <span
        className="gr-signature-ink"
        role="img"
        aria-label={name}
        style={{ '--gr-ink': `url(${ink})` } as CSSProperties}
      />
      {text.slice(at + name.length)}
    </>
  )
}

/* 히어로 배경 — 라이트 테마용 계절 낮 사진(홈 히어로와 같은 자산).
 * 다크 테마는 계절 무관 겨울 밤 은하수 고정이라 theme.css 가 직접 url 을 갖는다.
 * CSS 변수로만 참조되므로 라이트에서 실제 다운로드는 현재 계절 1장뿐이다. */
const HERO_DAY_BY_SEASON: Record<NaturalSeason, string> = {
  spring: heroSpringDay,
  summer: heroSummerDay,
  autumn: heroAutumnDay,
  winter: heroWinterDay,
}

const Greeting = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx } = useAboutContent()
  const { current, past, isLoading } = usePastors()
  const isAdminUser = isAdmin()

  // 역대 목사 카드를 누르면 그분의 인사말·약력을 하단 시트로 연다
  const [sheetPastor, setSheetPastor] = useState<Pastor | null>(null)
  // 공유하기 — Web Share 미지원 브라우저에서 링크 복사 피드백
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const title = ko ? '참빛교회 담임목사 인사말' : "Chambit Church — Pastor's Greeting"
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        /* 사용자가 공유 시트를 닫음 */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 클립보드 미지원 */
    }
  }

  const name = pastorText(current, 'name', language)
  const role = pastorText(current, 'role', language)
  const nickname = pastorText(current, 'nickname', language)
  const greetingTitle = pastorText(current, 'greeting_title', language)
  const greetingBody = pastorText(current, 'greeting_body', language)
  const signature = pastorText(current, 'signature', language)
  const profileHeadline = pastorText(current, 'profile_headline', language)
  const profileIntro = pastorText(current, 'profile_intro', language)
  const photoUrl = current?.photo_url?.trim() ?? ''
  const heroDayImage = HERO_DAY_BY_SEASON[getNaturalSeason(new Date())]

  const credentials = current
    ? ([
        ['greetingEducationLabel', 'education'],
        ['greetingCareerLabel', 'career'],
        ['greetingAwardLabel', 'awards'],
      ] as const
    ).filter(([, field]) => pastorText(current, field, language).trim().length > 0 || isAdminUser)
    : []

  const hasProfile =
    profileHeadline.trim().length > 0 ||
    profileIntro.trim().length > 0 ||
    credentials.length > 0

  const tocItems = [
    { id: 'greeting-letter', label: ko ? '인사말' : 'The Letter' },
    ...(hasProfile
      ? [{ id: 'greeting-profile', label: ko ? '담임목사 소개' : 'About the Pastor' }]
      : []),
    ...(past.length > 0
      ? [{ id: 'greeting-history', label: ko ? '역대 담임목사' : 'Pastors Who Served' }]
      : []),
  ]

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen page-stage">
      {/* lg+: 본문(읽기 폭 유지) + 우측 위젯 레일 2단 — /about 과 같은 규격 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:overflow-clip lg:min-h-0">
          {/* Hero — 실사 하늘 카드 한 장 (라이트=계절의 낮, 다크=겨울 밤 은하수 고정).
              장식은 사진뿐, 주인공은 문장이다 (인물 사진은 아래 편지의 몫). */}
          <header className="gr-hero">
            <div
              className="gr-hero-card"
              style={{ '--gr-hero-image-day': `url(${heroDayImage})` } as CSSProperties}
            >
              <span className="gr-hero-badge">
                <EditableText fieldKey="greetingBadge" isAdmin={isAdminUser}>
                  {tx('greetingBadge')}
                </EditableText>
              </span>
              <h1 className="gr-hero-title" style={{ whiteSpace: 'pre-line' }}>
                <EditableText fieldKey="greetingHeroTitle" multiline isAdmin={isAdminUser}>
                  {tx('greetingHeroTitle')}
                </EditableText>
              </h1>
              <p className="gr-hero-subtitle">
                <EditableText fieldKey="greetingHeroSubtitle" isAdmin={isAdminUser}>
                  {tx('greetingHeroSubtitle')}
                </EditableText>
              </p>
              <span className="gr-hero-rule" aria-hidden="true" />
            </div>
          </header>

          <div className="gr-content">
            {isLoading && !current ? (
              <GreetingSkeleton />
            ) : !current ? (
              <EmptyState isAdmin={isAdminUser} ko={ko} onGoAdmin={() => navigate('/admin/pastors')} />
            ) : (
              <>
                {/* 인사말 — 이력서가 아니라 편지 */}
                <section id="greeting-letter" className="gr-letter">
                  <div className="gr-letter-head">
                    <EditablePastorPhoto pastor={current} isAdmin={isAdminUser}>
                      {photoUrl ? (
                        <img className="gr-photo" src={photoUrl} alt={name} />
                      ) : isAdminUser ? (
                        <span className="gr-photo gr-photo--empty" aria-hidden="true">
                          <CameraIcon size={24} />
                        </span>
                      ) : null}
                    </EditablePastorPhoto>

                    <div className="gr-letter-head-text">
                      {role && <span className="gr-role-chip">{role}</span>}
                      {greetingTitle && (
                        <h2 className="gr-letter-title">
                          <EditablePastorText
                            pastor={current}
                            field="greeting_title"
                            isAdmin={isAdminUser}
                          >
                            {greetingTitle}
                          </EditablePastorText>
                        </h2>
                      )}
                      <p className="gr-letter-byline">
                        <EditablePastorText pastor={current} field="role" isAdmin={isAdminUser}>
                          {role}
                        </EditablePastorText>
                        <span className="gr-dot">·</span>
                        <EditablePastorText pastor={current} field="name" isAdmin={isAdminUser}>
                          {name}
                        </EditablePastorText>
                      </p>
                      {(nickname || isAdminUser) && (
                        <p className="gr-letter-nickname">
                          <EditablePastorText
                            pastor={current}
                            field="nickname"
                            isAdmin={isAdminUser}
                          >
                            {nickname ? `"${nickname}"` : ko ? '별칭을 등록해주세요' : 'Add a nickname'}
                          </EditablePastorText>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="gr-letter-card">
                    <QuoteIcon size={28} className="gr-quote-mark" />

                    <div className="gr-letter-body">
                    <EditablePastorText
                      pastor={current}
                      field="greeting_body"
                      multiline
                      rows={14}
                      isAdmin={isAdminUser}
                    >
                      {greetingBody ? (
                        <LetterBody text={greetingBody} />
                      ) : (
                        <p className="gr-letter-text">
                          {isAdminUser ? (ko ? '인사말 본문을 등록해주세요.' : 'Add the greeting letter.') : ''}
                        </p>
                      )}
                    </EditablePastorText>
                    </div>

                    {(signature || isAdminUser) && (
                      <div className="gr-signature">
                        <EditablePastorText
                          pastor={current}
                          field="signature"
                          isAdmin={isAdminUser}
                        >
                          {signature ? (
                            <SignatureLine text={signature} name={name} />
                          ) : ko ? (
                            '맺음말을 등록해주세요'
                          ) : (
                            'Add a closing line'
                          )}
                        </EditablePastorText>
                      </div>
                    )}

                    <div className="gr-letter-actions">
                      <button type="button" className="gr-letter-action" onClick={handleShare}>
                        <ShareIcon size={16} />
                        <span>
                          {copied
                            ? ko
                              ? '링크가 복사되었습니다'
                              : 'Link copied'
                            : ko
                              ? '공유하기'
                              : 'Share'}
                        </span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* 담임목사 소개 — 인사말을 다 읽은 사람이 "이분은 누구지?"에 답한다 */}
                {hasProfile && (
                  <section id="greeting-profile" className="gr-profile">
                    <h2 className="gr-section-title">
                      <EditableText fieldKey="greetingProfileTitle" isAdmin={isAdminUser}>
                        {tx('greetingProfileTitle')}
                      </EditableText>
                    </h2>
                    <span className="gr-rule" aria-hidden="true" />

                    {(profileHeadline || isAdminUser) && (
                      <p className="gr-profile-headline">
                        <EditablePastorText
                          pastor={current}
                          field="profile_headline"
                          isAdmin={isAdminUser}
                        >
                          {profileHeadline ||
                            (ko ? '한 줄 소개를 등록해주세요' : 'Add a one-line headline')}
                        </EditablePastorText>
                      </p>
                    )}

                    {(profileIntro || isAdminUser) && (
                      <EditablePastorText
                        pastor={current}
                        field="profile_intro"
                        multiline
                        rows={8}
                        isAdmin={isAdminUser}
                      >
                        <p className="gr-profile-intro" style={{ whiteSpace: 'pre-line' }}>
                          {profileIntro ||
                            (ko ? '소개 글을 등록해주세요.' : 'Add an introduction.')}
                        </p>
                      </EditablePastorText>
                    )}

                    {credentials.length > 0 && (
                      <div className="gr-credentials">
                        {credentials.map(([labelKey, field]) => {
                          const value = pastorText(current, field, language)
                          return (
                            <div className="gr-credential" key={field}>
                              <div className="gr-credential-label">
                                <span className="gr-cred-icon" aria-hidden="true">
                                  {CREDENTIAL_ICONS[field]}
                                </span>
                                <EditableText fieldKey={labelKey} isAdmin={isAdminUser}>
                                  {tx(labelKey)}
                                </EditableText>
                              </div>
                              <EditablePastorText
                                pastor={current}
                                field={field}
                                multiline
                                rows={7}
                                isAdmin={isAdminUser}
                              >
                                {value ? (
                                  <CredentialTimeline value={value} ko={ko} />
                                ) : (
                                  <p className="gr-credential-empty">
                                    {ko ? '아직 등록되지 않았습니다' : 'Not added yet'}
                                  </p>
                                )}
                              </EditablePastorText>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* 역대 담임목사 — 교체해도 기록이 남는다는 것이 이 페이지의 뼈대다 */}
                {past.length > 0 && (
                  <section id="greeting-history" className="gr-history">
                    <h2 className="gr-section-title">
                      <EditableText fieldKey="greetingHistoryTitle" isAdmin={isAdminUser}>
                        {tx('greetingHistoryTitle')}
                      </EditableText>
                    </h2>
                    <p className="gr-history-hint">
                      <EditableText fieldKey="greetingHistoryHint" isAdmin={isAdminUser}>
                        {tx('greetingHistoryHint')}
                      </EditableText>
                    </p>

                    <ul className="gr-history-strip">
                      {past.map((pastor) => (
                        <li key={pastor.id}>
                          <button
                            type="button"
                            className="gr-history-card"
                            onClick={() => setSheetPastor(pastor)}
                          >
                            <span className="gr-history-photo">
                              {pastor.photo_url ? (
                                <img src={pastor.photo_url} alt={pastorText(pastor, 'name', language)} />
                              ) : (
                                <UsersIcon size={20} />
                              )}
                            </span>
                            <span className="gr-history-name">
                              {pastorText(pastor, 'name', language)}
                            </span>
                            <span className="gr-history-role">
                              {pastorText(pastor, 'role', language)}
                            </span>
                            {pastorTermLabel(pastor, language) && (
                              <span className="gr-history-term">
                                {pastorTermLabel(pastor, language)}
                              </span>
                            )}
                            {pastor.status === 'emeritus' && (
                              <span className="gr-history-badge">{ko ? '원로' : 'Emeritus'}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="gr-history-more"
                      onClick={() => navigate('/history')}
                    >
                      <span>{ko ? '참빛의 발자취 전체 보기' : 'See our full story'}</span>
                      <ChevronRightIcon size={16} />
                    </button>
                  </section>
                )}

                {/* 맺음 — 환영 배너. 인사말을 다 읽은 처음 오신 분을 오시는 길로 안내한다 */}
                <section className="gr-closing">
                  <div
                    className="gr-welcome-banner"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate('/visit')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate('/visit')
                      }
                    }}
                  >
                    <span className="gr-welcome-icon" aria-hidden="true">
                      <SproutIcon size={20} />
                    </span>
                    <span className="gr-welcome-text">
                      <span className="gr-welcome-title">
                        <EditableText fieldKey="greetingClosing" isAdmin={isAdminUser}>
                          {tx('greetingClosing')}
                        </EditableText>
                      </span>
                      <span className="gr-welcome-sub">
                        <EditableText fieldKey="greetingClosingSub" isAdmin={isAdminUser}>
                          {tx('greetingClosingSub')}
                        </EditableText>
                      </span>
                    </span>
                    <ChevronRightIcon size={18} className="gr-welcome-chevron" />
                  </div>
                  <div className="gr-closing-actions">
                    <button type="button" className="gr-cta" onClick={() => navigate('/about')}>
                      <UsersIcon size={17} />
                      <span>{ko ? '교회 소개 보기' : 'About Us'}</span>
                    </button>
                  </div>
                </section>
              </>
            )}

            {isAdminUser && (
              <div className="gr-admin-hint">
                <p>
                  {ko
                    ? '✏️ 아이콘으로 인사말·사진을 바로 고칠 수 있습니다. 담임목사가 바뀌면 아래에서 새로 등록하세요.'
                    : 'Use the ✏️ icons to edit inline. When the pastor changes, register the new one below.'}
                </p>
                <button type="button" onClick={() => navigate('/admin/pastors')}>
                  <span>{ko ? '담임목사 관리' : 'Manage Pastors'}</span>
                  <ChevronRightIcon size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 우측 위젯 레일 (lg+) — 읽는 페이지라 목차가 주인공 */}
        <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
          <GreetingRail ko={ko} toc={tocItems} />
        </aside>
      </div>

      {sheetPastor && (
        <PastorSheet pastor={sheetPastor} onClose={() => setSheetPastor(null)} />
      )}
    </div>
  )
}

// ── 보조 컴포넌트 ────────────────────────────────────────

const GreetingSkeleton = () => (
  <div className="gr-skeleton" aria-hidden="true">
    <div className="gr-skeleton-photo" />
    <div className="gr-skeleton-line gr-skeleton-line--title" />
    <div className="gr-skeleton-line" />
    <div className="gr-skeleton-line" />
    <div className="gr-skeleton-line gr-skeleton-line--short" />
  </div>
)

const EmptyState = ({
  isAdmin,
  ko,
  onGoAdmin,
}: {
  isAdmin: boolean
  ko: boolean
  onGoAdmin: () => void
}) => (
  <div className="gr-empty">
    <span className="gr-empty-icon" aria-hidden="true">
      ✉️
    </span>
    <p className="gr-empty-title">
      {ko ? '인사말이 아직 준비 중입니다' : 'The greeting is being prepared'}
    </p>
    <p className="gr-empty-text">
      {isAdmin
        ? ko
          ? '담임목사 관리에서 현 담임목사를 등록하면 이 자리에 인사말이 표시됩니다.'
          : 'Register the current senior pastor in the admin page to fill this section.'
        : ko
          ? '곧 담임목사님의 인사말로 찾아뵙겠습니다.'
          : 'We will share our pastor’s greeting here soon.'}
    </p>
    {isAdmin && (
      <button type="button" className="gr-empty-cta" onClick={onGoAdmin}>
        {ko ? '담임목사 등록하기' : 'Register a pastor'}
      </button>
    )}
  </div>
)

export default Greeting
