import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import { HandHeartIcon } from '../../../components/icons/ActionIcons'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { useLandingStats } from '../../../hooks/useLandingStats'
import { BookOpenIcon, ChevronRightIcon, ClockIcon, HeartIcon, MapPinIcon, PlayCircleIcon, SproutIcon } from '../../About/icons'
import { fmtNum, useCountUp } from './landingUtils'

// 히어로: 큰 약속 한 줄 + 살아있는 숫자 + 두 갈래 CTA.
// 카피는 about_content.fields 에 저장돼 관리자가 화면에서 바로 고친다.

// 히어로 카드 안의 아이콘 타일 — 숫자·메타 양쪽이 같은 문법을 쓴다
const TILE =
  'w-7 h-7 shrink-0 rounded-lg bg-[var(--brand-soft)] text-brand flex items-center justify-center'

const StatItem = ({
  icon,
  value,
  unit,
  label,
  active,
  ko,
  strip = false,
}: {
  icon: ReactNode
  value: number
  unit: string
  label: string
  active: boolean
  ko: boolean
  /** PC 전폭 스트립 — 큰 원형 타일 + 가로 배치 */
  strip?: boolean
}) => {
  const n = useCountUp(value, active)
  if (strip) {
    return (
      <div className="flex items-center gap-4 min-w-0 px-6 py-5">
        <span className="w-12 h-12 shrink-0 rounded-full bg-[var(--brand-soft)] text-brand flex items-center justify-center [&>svg]:w-[22px] [&>svg]:h-[22px]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="ld-ticker-num block text-[28px] font-extrabold text-ink-strong leading-none truncate">
            {fmtNum(n, ko)}
            <span className="text-[14px] font-bold text-ink-muted ml-1">{unit}</span>
          </span>
          <span className="block mt-1.5 text-[12.5px] font-semibold text-ink-muted truncate">{label}</span>
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2">
        <span className={TILE}>{icon}</span>
        <span className="ld-ticker-num text-[19px] sm:text-[21px] font-extrabold text-ink-strong dark:text-white leading-none truncate">
          {fmtNum(n, ko)}
          <span className="text-[13px] font-bold text-ink-muted dark:text-white/80 ml-0.5">{unit}</span>
        </span>
      </div>
      <span className="mt-1 sm:mt-1.5 text-[11.5px] font-semibold text-ink-muted dark:text-white/65 truncate">{label}</span>
    </div>
  )
}

// 카드 아래칸 — 방문자의 두 가지 질문(언제·어디서)에 라벨 + 값으로 답한다
const MetaItem = ({
  icon,
  label,
  value,
  onClick,
  className = '',
}: {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
  className?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3.5 text-left min-w-0 hover:bg-black/[0.035] dark:hover:bg-white/[0.06] transition-colors ${className}`}
  >
    <span className={TILE}>{icon}</span>
    <span className="min-w-0">
      <span className="block text-[12px] font-bold text-ink-strong dark:text-white/90">{label}</span>
      <span className="block mt-0.5 text-[12.5px] font-semibold text-ink-muted dark:text-white/65 truncate">{value}</span>
    </span>
    <ChevronRightIcon
      size={14}
      className="ml-auto shrink-0 text-ink-muted/60 dark:text-white/40 group-hover:translate-x-0.5 transition-transform"
    />
  </button>
)

const HeroSection = ({ isAdmin, ko, onTour }: { isAdmin: boolean; ko: boolean; onTour: () => void }) => {
  const navigate = useNavigate()
  const { tx, heroBackgroundUrl } = useAboutContent()
  const { data: stats } = useLandingStats()
  const [armed, setArmed] = useState(() => typeof IntersectionObserver === 'undefined')
  const tickerRef = useRef<HTMLDivElement>(null)

  // 티커가 화면에 들어올 때 카운트업 시작
  useEffect(() => {
    if (!stats) return
    const el = tickerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setArmed(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [stats])

  // 제목 안의 *별표* 구간은 형광 밑줄(<em>)로 — 관리자가 편집 화면에서 강조 위치를 옮길 수 있다
  const titleLines = tx('landingHeroTitle').split('\n')
  const renderLine = (line: string) =>
    line.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2
        ? <em key={i}>{part.slice(1, -1)}</em>
        : <span key={i}>{part}</span>,
    )

  const statItems = stats
    ? [
        { icon: <BookOpenIcon size={15} />, value: stats.verses_read_year, unit: ko ? '절' : '', label: ko ? `${stats.year}년 함께 읽은 말씀` : `verses read in ${stats.year}` },
        { icon: <HeartIcon size={15} />, value: stats.prayers_week, unit: ko ? '개' : '', label: ko ? '이번 주 올라온 기도' : 'prayers this week' },
        { icon: <HandHeartIcon size={15} />, value: stats.prayed_together, unit: ko ? '번' : '', label: ko ? '서로를 위해 기도했어요' : 'times prayed for each other' },
        { icon: <PlayCircleIcon size={15} />, value: stats.sermons, unit: ko ? '편' : '', label: ko ? '다시 들을 수 있는 설교' : 'sermons on replay' },
      ].filter((s) => s.value > 0)
    : []

  return (
    <section className="ld-hero relative overflow-hidden lg:bg-gray-50 lg:dark:bg-black">
      {/* 모바일·태블릿(<lg): 사진을 화면 전폭에 깔고 그 위에 흰 글씨 — 화면이 사진(800px)보다 좁아 cover 가 선명하다.
          PC(lg+): 800px 사진을 2000px 로 늘리면 뭉개지므로 배경에 깔지 않는다.
          대신 캔버스 위 2단(카피 | 사진 카드) + 아래 전폭 통계 스트립 + 안내 카드 3장으로, 좌우 라인이 맞는 정돈된 구성. */}
      {heroBackgroundUrl ? (
        <img
          src={heroBackgroundUrl}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          crossOrigin="anonymous"
          className="lg:hidden absolute inset-0 w-full h-full object-cover object-[center_62%]"
        />
      ) : (
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-[#dbe7fb] via-[#eef3fb] to-gray-50 dark:from-[#12294f] dark:via-[#0f1e3a] dark:to-[#0b1526]" />
      )}
      {/* 다크: 사진이 카피를 방해하지 않게 좌측·하단을 검정으로 눌러준다.
          라이트: 스크림 없이 사진 원색 그대로 — 안개를 깔면 사진이 바래 어색하다는 피드백.
          사진 위에 바로 얹히는 글(제목·부제)은 흰 글씨 + .ld-hero-halo 그림자. 카드·버튼·알약은 자체 흰 배경으로 잉크 글씨. */}
      <div className="hidden dark:block lg:dark:hidden absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="hidden dark:block lg:dark:hidden absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div
        className="dark:hidden lg:hidden absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 0% 0%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.38) 35%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 80%)',
        }}
      />
      <div className="lg:hidden absolute inset-x-0 bottom-0 h-12 sm:h-20 bg-gradient-to-b from-transparent to-gray-50 dark:to-black pointer-events-none" />

      <div className="relative max-w-[1040px] lg:max-w-[1240px] mx-auto px-5 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-10 lg:pb-12">
        {/* 1행 — PC: 카피(왼쪽 440px) | 사진 카드(나머지, 약 720px). 사진은 열 폭에 갇혀 확대되지 않는다. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-x-12 xl:gap-x-14 lg:items-center">
          <div>
            <p className="mb-2.5 lg:mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 ring-1 ring-inset ring-black/10 dark:bg-white/10 dark:ring-white/20 lg:bg-[var(--brand-soft)] lg:ring-0 lg:text-brand lg:dark:bg-white/[0.08] backdrop-blur-sm px-3 py-1 text-[12px] font-bold tracking-wide text-ink dark:text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <EditableText fieldKey="landingHeroKicker" isAdmin={isAdmin}>
                {tx('aboutChurchName')} · {tx('landingHeroKicker')}
              </EditableText>
            </p>

            <h1 className="ld-hero-title ld-hero-halo text-[32px] sm:text-[40px] lg:text-[54px] leading-[1.15] lg:leading-[1.2] font-extrabold tracking-tight text-white lg:text-ink-strong max-w-[760px]">
              <EditableText fieldKey="landingHeroTitle" isAdmin={isAdmin} multiline>
                <span>
                  {titleLines.map((line, i) => (
                    <span key={i}>
                      {renderLine(line)}
                      {i < titleLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </EditableText>
              {/* 손그림 하트 — PC 에서만, 제목 끝에 살짝 */}
              <span aria-hidden="true" className="ld-hero-doodle hidden lg:inline-block align-top ml-2 -mt-1 text-brand/70">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 25s-9-5.6-9-12.2A4.8 4.8 0 0 1 15 10a4.8 4.8 0 0 1 9 2.8C24 19.4 15 25 15 25z" />
                  <path d="M25 5c.8-1.2 2-2 3-2" />
                </svg>
              </span>
            </h1>

            <p className="ld-hero-halo mt-3 sm:mt-4 lg:mt-5 text-[15px] lg:text-[17px] leading-snug sm:leading-relaxed font-medium text-white/95 dark:font-normal dark:text-white/85 lg:font-normal lg:text-ink lg:dark:text-ink max-w-[620px] whitespace-pre-line">
              <EditableText fieldKey="landingHeroSub" isAdmin={isAdmin} multiline>
                <span>{tx('landingHeroSub')}</span>
              </EditableText>
            </p>

            <div className="mt-5 sm:mt-7 lg:mt-8 flex flex-wrap items-center gap-2.5 lg:gap-3">
              <button
                type="button"
                onClick={() => navigate('/visit')}
                className="brand-gradient flex items-center gap-1.5 px-5 py-3 lg:px-6 lg:py-3.5 rounded-full text-[14.5px] lg:text-[15px] font-bold text-white shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.97] transition-[box-shadow,transform] duration-150"
              >
                <MapPinIcon size={16} />
                {tx('landingCtaVisit')}
              </button>
              <button
                type="button"
                onClick={onTour}
                className="flex items-center gap-1.5 px-5 py-3 lg:px-6 lg:py-3.5 rounded-full text-[14.5px] lg:text-[15px] font-bold text-ink-strong bg-white/80 ring-1 ring-inset ring-black/10 hover:bg-white dark:text-white dark:bg-white/[0.14] dark:ring-white/25 dark:hover:bg-white/[0.22] lg:bg-white lg:dark:bg-white/[0.08] backdrop-blur-sm active:scale-[0.97] transition-[background-color,transform] duration-150"
              >
                {tx('landingCtaTour')}
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>

          {/* 사진 카드(PC 전용) — 3:2 는 원본 비율과 같아 잘리는 부분이 없다. */}
          <div className="hidden lg:block relative">
            {heroBackgroundUrl ? (
              <div className="relative aspect-[3/2] rounded-2xl overflow-hidden ring-1 ring-inset ring-black/[0.06] dark:ring-white/10 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)]">
                <img
                  src={heroBackgroundUrl}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/2] rounded-2xl bg-gradient-to-br from-[#dbe7fb] to-[#eef3fb] dark:from-[#12294f] dark:to-[#0b1526] ring-1 ring-inset ring-black/[0.06] dark:ring-white/10" />
            )}
          </div>
        </div>

        {/* 2행(PC): 전폭 통계 스트립 — 사진 카드의 오른쪽 라인, 카피의 왼쪽 라인과 딱 맞춘다.
            <lg 에서는 기존 한 장의 유리 카드(숫자 위칸 + 예배·오시는 길 아래칸). */}
        <div ref={tickerRef}>
          <div className="lg:hidden mt-6 sm:mt-8 max-w-[760px] rounded-2xl bg-white/75 ring-1 ring-inset ring-black/5 dark:bg-black/35 dark:ring-white/15 backdrop-blur-md shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] overflow-hidden">
            {statItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-3 sm:gap-y-4 px-4 sm:px-5 py-3.5 sm:py-4">
                {statItems.map((s) => (
                  <StatItem key={s.label} {...s} active={armed} ko={ko} />
                ))}
              </div>
            )}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${statItems.length > 0 ? 'border-t border-black/[0.07] dark:border-white/10' : ''}`}
            >
              <MetaItem
                icon={<ClockIcon size={15} />}
                label={ko ? '주일 예배' : 'Sunday service'}
                value={tx('aboutInfoWorship')}
                onClick={() => navigate('/worship')}
              />
              <MetaItem
                icon={<MapPinIcon size={15} />}
                label={ko ? '오시는 길' : 'Getting here'}
                value={tx('aboutAddress')}
                onClick={() => navigate('/visit')}
                className="border-t sm:border-t-0 sm:border-l border-black/[0.07] dark:border-white/10"
              />
            </div>
          </div>

          {statItems.length > 0 && (
            <div className="hidden lg:grid mt-10 grid-cols-4 divide-x divide-black/[0.07] dark:divide-white/10 rounded-2xl bg-white dark:bg-white/[0.06] ring-1 ring-inset ring-black/5 dark:ring-white/10 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.25)]">
              {statItems.map((s) => (
                <StatItem key={s.label} {...s} active={armed} ko={ko} strip />
              ))}
            </div>
          )}
        </div>

        {/* 3행(PC): 방문자의 질문 카드 3장 — 언제·어디서·처음이라면.
            셋 다 같은 높이의 한 줄 행(아이콘 · 제목+설명 · 오른쪽 액션)으로 맞춰 빈 여백이 생기지 않는다. */}
        <div className="hidden lg:grid mt-6 grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => navigate('/worship')}
            className="group text-left flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#eef4ff] dark:bg-white/[0.06] ring-1 ring-inset ring-black/[0.04] dark:ring-white/10 hover:ring-brand/30 transition"
          >
            <span className="w-11 h-11 shrink-0 rounded-full bg-white dark:bg-white/10 text-brand flex items-center justify-center shadow-sm">
              <ClockIcon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-extrabold text-ink-strong">{ko ? '주일 예배' : 'Sunday service'}</span>
              <span className="block mt-0.5 text-[13px] font-medium text-ink-muted truncate">{tx('aboutInfoWorship')}</span>
            </span>
            <ChevronRightIcon size={16} className="shrink-0 text-ink-muted/60 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/visit')}
            className="group text-left flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#eefaf3] dark:bg-white/[0.06] ring-1 ring-inset ring-black/[0.04] dark:ring-white/10 hover:ring-emerald-500/30 transition"
          >
            <span className="w-11 h-11 shrink-0 rounded-full bg-white dark:bg-white/10 text-emerald-600 flex items-center justify-center shadow-sm">
              <MapPinIcon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-extrabold text-ink-strong">{ko ? '오시는 길' : 'Getting here'}</span>
              <span className="block mt-0.5 text-[13px] font-medium text-ink-muted truncate">{tx('aboutAddress')}</span>
            </span>
            <ChevronRightIcon size={16} className="shrink-0 text-ink-muted/60 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/visit')}
            className="group text-left flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#fff8ec] dark:bg-white/[0.06] ring-1 ring-inset ring-black/[0.04] dark:ring-white/10 hover:ring-amber-500/30 transition"
          >
            <span className="w-11 h-11 shrink-0 rounded-full bg-white dark:bg-white/10 text-amber-600 flex items-center justify-center shadow-sm">
              <SproutIcon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-extrabold text-ink-strong">{ko ? '처음 오셨나요?' : 'First time here?'}</span>
              <span className="block mt-0.5 text-[13px] font-medium text-ink-muted truncate">{ko ? '새가족 안내를 도와드릴게요' : "We'll help you get settled in"}</span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-white/10 ring-1 ring-inset ring-black/[0.08] dark:ring-white/15 text-[12.5px] font-bold text-ink-strong group-hover:bg-white/80 transition">
              {ko ? '안내 받기' : 'Guide'}
              <ChevronRightIcon size={13} />
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
