import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAboutContent } from '../../hooks/useAboutContent'
import { useSermons } from '../../hooks/useSermons'
import { useEvents } from '../../hooks/useEvents'
import {
  BookOpenIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  SproutIcon,
} from '../About/icons'

// 비로그인 방문자용 메인 — 로그인 교인은 App의 HomeGate가 기도 피드 홈(NewHome)을 보여준다.
// 처음 온 사람이 기대하는 "교회 홈페이지" 문법(히어로 → 예배·오시는길 → 설교 → 일정)으로
// 안내한 뒤, 마지막에 이 앱의 정체성인 기도 커뮤니티로 초대한다.
// 콘텐츠는 전부 기존 소스 재사용: 히어로·예배·주소는 소개 페이지의 useAboutContent(관리자 편집 반영),
// 설교·일정은 각 페이지와 같은 쿼리라 캐시도 공유된다.

const toDateString = (d: Date) => {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

const Landing = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const ko = language === 'ko'
  const { tx, heroBackgroundUrl } = useAboutContent()

  // 최신 설교 2편 — 설교 페이지 목록 첫 페이지와 같은 데이터의 앞부분
  const { data: sermons } = useSermons(0, 2)

  // 다가오는 일정 3건 — 오늘부터 60일
  const today = new Date()
  const rangeEnd = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const { events } = useEvents(toDateString(today), toDateString(rangeEnd))
  const upcoming = events.slice(0, 3)

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return ko
      ? `${d.getMonth() + 1}월 ${d.getDate()}일`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const sectionTitleClass =
    'text-[19px] font-extrabold tracking-tight text-ink-strong'
  const seeAllClass =
    'flex items-center gap-0.5 text-[13px] font-semibold text-brand hover:underline'

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen page-stage">
      {/* ── 히어로: 소개 페이지와 같은 사진·문구를 쓰는 첫인사 ── */}
      <section className="relative overflow-hidden">
        {heroBackgroundUrl ? (
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // 사진이 없어도 밤하늘 네이비 그라데이션으로 스크림과 톤을 맞춘다
          <div className="absolute inset-0 bg-gradient-to-b from-[#12294f] via-[#0f1e3a] to-[#0b1526]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/25" />

        <div className="relative max-w-[1040px] mx-auto px-5 pt-16 pb-12 lg:pt-28 lg:pb-16">
          <p className="mb-3 text-[12px] font-bold tracking-[0.18em] uppercase text-white/70">
            Welcome
          </p>
          <h1 className="text-[34px] lg:text-[46px] leading-tight font-extrabold tracking-tight text-white">
            {tx('aboutChurchName')}
          </h1>
          <p className="mt-2 text-[16px] lg:text-[18px] text-white/85">
            {tx('aboutTagline')}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="brand-gradient flex items-center gap-1.5 px-5 py-3 rounded-full text-[14.5px] font-bold text-white shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.97] transition-[box-shadow,transform] duration-150"
            >
              <SproutIcon size={17} />
              {ko ? '처음 오셨나요?' : 'New Here?'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full text-[14.5px] font-bold text-white bg-white/[0.14] ring-1 ring-inset ring-white/25 backdrop-blur-sm hover:bg-white/[0.22] active:scale-[0.97] transition-[background-color,transform] duration-150"
            >
              {ko ? '기도 커뮤니티 둘러보기' : 'Explore the Community'}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1040px] mx-auto px-5 pb-16">
        {/* ── 한눈에: 예배 시간 · 오시는 길 (방문자의 두 가지 질문) ── */}
        <section className="grid gap-3 sm:grid-cols-2 -mt-6 relative z-10">
          {[
            {
              icon: <ClockIcon size={20} />,
              label: ko ? '주일예배' : 'Sunday Worship',
              value: tx('aboutInfoWorship'),
              to: '/worship',
            },
            {
              icon: <MapPinIcon size={20} />,
              label: ko ? '오시는 길' : 'Directions',
              value: tx('aboutAddress'),
              to: '/visit',
            },
          ].map((info) => (
            <button
              key={info.to}
              type="button"
              onClick={() => navigate(info.to)}
              className="feed-card rounded-2xl px-4 py-4 flex items-center gap-3.5 text-left shadow-lg hover:border-[var(--brand-glow)] hover:shadow-[0_8px_22px_-8px_var(--brand-glow)] active:scale-[0.99] transition-[border-color,box-shadow,transform] duration-150"
            >
              <span className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center shrink-0">
                {info.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] font-semibold text-ink-muted">
                  {info.label}
                </span>
                <span className="block text-[14.5px] font-bold text-ink-strong truncate">
                  {info.value}
                </span>
              </span>
              <ChevronRightIcon size={18} className="text-ink-muted shrink-0" />
            </button>
          ))}
        </section>

        {/* ── 최신 설교 ── */}
        {sermons && sermons.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className={sectionTitleClass}>{ko ? '최신 설교' : 'Recent Sermons'}</h2>
              <button type="button" onClick={() => navigate('/sermon')} className={seeAllClass}>
                {ko ? '전체 보기' : 'See all'}
                <ChevronRightIcon size={15} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {sermons.slice(0, 2).map((sermon) => (
                <button
                  key={sermon.id}
                  type="button"
                  onClick={() => navigate('/sermon')}
                  className="feed-card rounded-2xl p-4 text-left hover:border-[var(--brand-glow)] hover:shadow-[0_8px_22px_-8px_var(--brand-glow)] active:scale-[0.99] transition-[border-color,box-shadow,transform] duration-150"
                >
                  <span className="inline-flex items-center gap-1.5 mb-2 px-2 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[11.5px] font-bold">
                    <BookOpenIcon size={13} />
                    {fmtDate(sermon.sermon_date)}
                  </span>
                  <p className="text-[15.5px] font-bold text-ink-strong leading-snug line-clamp-2">
                    {sermon.title}
                  </p>
                  <p className="mt-1.5 text-[12.5px] text-ink-muted">
                    {sermon.pastor}
                    {sermon.bible_verse ? ` · ${sermon.bible_verse}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── 다가오는 일정 ── */}
        {upcoming.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className={sectionTitleClass}>{ko ? '다가오는 일정' : 'Upcoming Events'}</h2>
              <button type="button" onClick={() => navigate('/events')} className={seeAllClass}>
                {ko ? '전체 보기' : 'See all'}
                <ChevronRightIcon size={15} />
              </button>
            </div>
            <div className="feed-card rounded-2xl overflow-hidden divide-y divide-[var(--card-border)]">
              {upcoming.map((event) => {
                const d = new Date(event.start_datetime)
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate('/events')}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-soft-strong)] transition-colors duration-150"
                  >
                    <span className="w-11 h-11 rounded-xl bg-[var(--brand-soft)] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-brand leading-none">
                        {ko ? `${d.getMonth() + 1}월` : d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-[16px] font-extrabold text-brand leading-tight">
                        {d.getDate()}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14.5px] font-bold text-ink-strong truncate">
                        {event.title}
                      </span>
                      <span className="block text-[12.5px] text-ink-muted">
                        {fmtDate(event.start_datetime)}
                      </span>
                    </span>
                    <ChevronRightIcon size={18} className="text-ink-muted shrink-0" />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── 커뮤니티 초대: 이 앱만의 정체성으로 마무리 ── */}
        <section className="mt-12">
          <div className="feed-card rounded-3xl px-6 py-10 text-center">
            <span className="inline-flex w-12 h-12 rounded-full bg-[var(--brand-soft-strong)] text-brand items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M11 6.5 C11.65 10.4 13.8 12.55 17.7 13.2 C13.8 13.85 11.65 16 11 19.9 C10.35 16 8.2 13.85 4.3 13.2 C8.2 12.55 10.35 10.4 11 6.5 Z" />
                <path d="M17.8 4.6 C18.08 6.06 18.94 6.92 20.4 7.2 C18.94 7.48 18.08 8.34 17.8 9.8 C17.52 8.34 16.66 7.48 15.2 7.2 C16.66 6.92 17.52 6.06 17.8 4.6 Z" />
              </svg>
            </span>
            <h2 className="text-[21px] font-extrabold tracking-tight text-ink-strong">
              {ko ? '혼자 말고, 함께 기도해요' : 'Pray together, not alone'}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-muted" style={{ whiteSpace: 'pre-line' }}>
              {ko
                ? '기도제목을 나누고, 서로의 기도에 아멘으로 함께하고,\n말씀과 함께 하루를 시작하는 참빛 온라인 공동체입니다.'
                : 'Share prayer topics, say amen for one another,\nand start each day in the Word with our online community.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="brand-gradient px-5 py-3 rounded-full text-[14.5px] font-bold text-white shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.97] transition-[box-shadow,transform] duration-150"
              >
                {ko ? '함께 시작하기' : 'Get Started'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-3 rounded-full text-[14.5px] font-bold text-ink-strong ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12] hover:bg-[var(--brand-soft)] hover:text-brand active:scale-[0.97] transition-[background-color,color,transform] duration-150"
              >
                {ko ? '로그인' : 'Log in'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="px-4 py-3 text-[14px] font-semibold text-ink-muted hover:text-brand transition-colors duration-150"
              >
                {ko ? '먼저 둘러볼게요' : 'Just browsing'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Landing
