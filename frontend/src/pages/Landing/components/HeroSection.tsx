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

// 통계 한 칸 — 모바일은 세로 스택(아이콘 위·숫자·라벨), PC 는 가로 스트립
const StatItem = ({
  icon,
  value,
  unit,
  label,
  shortLabel,
  active,
  ko,
}: {
  icon: ReactNode
  value: number
  unit: string
  label: string
  /** 모바일(<sm) 4칸 폭에 한 줄로 들어가는 짧은 라벨 */
  shortLabel: string
  active: boolean
  ko: boolean
}) => {
  const n = useCountUp(value, active)
  return (
    <div className="flex flex-col items-center text-center gap-2.5 px-1 py-4 sm:py-5 min-w-0 lg:flex-row lg:items-center lg:text-left lg:gap-4 lg:px-6">
      <span className="w-11 h-11 lg:w-12 lg:h-12 shrink-0 rounded-full bg-[var(--brand-soft)] text-brand flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 lg:[&>svg]:w-[22px] lg:[&>svg]:h-[22px]">
        {icon}
      </span>
      <span className="min-w-0 w-full">
        <span className="ld-ticker-num block text-[20px] sm:text-[24px] lg:text-[28px] font-extrabold text-ink-strong leading-none truncate">
          {fmtNum(n, ko)}
          <span className="text-[12px] lg:text-[14px] font-bold text-ink-muted ml-0.5 lg:ml-1">{unit}</span>
        </span>
        <span className="block mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-ink-muted leading-snug break-keep lg:truncate">
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
      </span>
    </div>
  )
}

// 안내 카드 — 방문자의 질문(언제·어디서·처음이라면). 모바일은 세로로 쌓이고 PC 는 3열.
const InfoCard = ({
  icon,
  title,
  desc,
  tone,
  action,
  onClick,
}: {
  icon: ReactNode
  title: string
  desc: string
  tone: 'blue' | 'green' | 'warm'
  /** 있으면 셰브론 대신 알약 버튼 */
  action?: string
  onClick: () => void
}) => {
  const bg = {
    blue: 'bg-[#eef4ff] hover:ring-brand/30',
    green: 'bg-[#eefaf3] hover:ring-emerald-500/30',
    warm: 'bg-[#fff8ec] hover:ring-amber-500/30',
  }[tone]
  const fg = { blue: 'text-brand', green: 'text-emerald-600', warm: 'text-amber-600' }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left flex items-center gap-4 px-5 py-4 rounded-2xl ${bg} dark:bg-white/[0.06] ring-1 ring-inset ring-black/[0.04] dark:ring-white/10 transition`}
    >
      <span className={`w-11 h-11 shrink-0 rounded-full bg-white dark:bg-white/10 ${fg} flex items-center justify-center shadow-sm`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-extrabold text-ink-strong">{title}</span>
        <span className="block mt-0.5 text-[13px] font-medium text-ink-muted leading-snug lg:truncate">{desc}</span>
      </span>
      {action ? (
        <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-white/10 ring-1 ring-inset ring-black/[0.08] dark:ring-white/15 text-[12.5px] font-bold text-ink-strong group-hover:bg-white/80 transition">
          {action}
          <ChevronRightIcon size={13} />
        </span>
      ) : (
        <ChevronRightIcon size={16} className="shrink-0 text-ink-muted/60 group-hover:translate-x-0.5 transition-transform" />
      )}
    </button>
  )
}

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
        { icon: <BookOpenIcon size={15} />, value: stats.verses_read_year, unit: ko ? '절' : '', label: ko ? `${stats.year}년 함께 읽은 말씀` : `verses read in ${stats.year}`, shortLabel: ko ? '함께 읽은 말씀' : 'verses read' },
        { icon: <HeartIcon size={15} />, value: stats.prayers_week, unit: ko ? '개' : '', label: ko ? '이번 주 올라온 기도' : 'prayers this week', shortLabel: ko ? '이번 주 기도' : 'this week' },
        { icon: <HandHeartIcon size={15} />, value: stats.prayed_together, unit: ko ? '번' : '', label: ko ? '서로를 위해 기도했어요' : 'times prayed for each other', shortLabel: ko ? '서로 위한 기도' : 'prayed' },
        { icon: <PlayCircleIcon size={15} />, value: stats.sermons, unit: ko ? '편' : '', label: ko ? '다시 들을 수 있는 설교' : 'sermons on replay', shortLabel: ko ? '다시 듣는 설교' : 'sermons' },
      ].filter((s) => s.value > 0)
    : []

  return (
    <section className="relative bg-gray-50 dark:bg-black">
      {/* ── 사진 띠 ──
          모바일·태블릿(<lg): 사진 위에 흰 글씨 카피 + CTA. 화면이 사진(800px)보다 좁아 cover 가 선명하다.
          아래 통계 카드가 이 띠의 하단에 걸치도록 pb 를 넉넉히 두고, 다음 블록이 -mt 로 올라탄다.
          PC(lg+): 800px 사진을 2000px 로 늘리면 뭉개지므로 배경에 깔지 않고, 캔버스 위 2단(카피 | 사진 카드). */}
      <div className="relative overflow-hidden">
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
            흰 글씨는 .ld-hero-halo 그림자로 받친다. */}
        <div className="hidden dark:block lg:dark:hidden absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
        <div className="hidden dark:block lg:dark:hidden absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
        {/* 라이트: 글씨가 놓이는 좌측(라디얼) + 부제·CTA 가 놓이는 하단(세로)만 국소적으로 눌러준다.
            우상단은 투명으로 빠져 사진 원색이 살아 있다. 밝고 복잡한 사진에서 흰 글씨가 묻힌다는 피드백으로 농도를 올렸다. */}
        <div
          className="dark:hidden lg:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(130% 95% at 0% 0%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.52) 35%, rgba(0,0,0,0.22) 60%, rgba(0,0,0,0) 82%)',
          }}
        />
        <div className="dark:hidden lg:hidden absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none" />

        <div className="relative max-w-[1040px] lg:max-w-[1240px] mx-auto px-5 pt-10 pb-24 sm:pt-16 sm:pb-28 lg:pt-10 lg:pb-0">
          {/* PC: 카피(왼쪽 440px) | 사진 카드(나머지, 약 720px). 사진은 열 폭에 갇혀 확대되지 않는다. */}
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
                {/* 손그림 하트 — PC 에서만, 제목 끝에 살짝. 색은 제목(currentColor)을 그대로 물려받는다
                    (brand 토큰은 CSS 변수라 text-brand/80 같은 투명도 수식이 먹지 않는다) */}
                <span aria-hidden="true" className="ld-hero-doodle hidden lg:inline-block align-top ml-2 -mt-0.5 rotate-[-6deg]">
                  <svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {/* 한 붓에 그린 듯한 하트 — 끝이 가운데 홈을 살짝 지나치며 겹친다 */}
                    <path d="M16 11.6c.9-2.3 3-4.1 5.4-4.3 3-.3 5.7 2 5.7 5.5 0 6.2-8 11.3-11.1 13.6C12.9 24.1 4.9 19 4.9 12.8c0-3.5 2.7-5.8 5.7-5.5 2.4.2 4.5 2 5.4 4.3z" />
                    <path d="M16 11.6c.5 1 .8 1.8.9 2.4" strokeWidth="1.8" />
                    {/* 튀어오르는 획 하나 — 두 개면 꼭지처럼 보여서 하나만 남긴다 */}
                    <path d="M25.9 4.6c.9-1.4 2.1-2.2 3.4-2.3" strokeWidth="1.8" />
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
                  className="brand-gradient relative flex items-center gap-1.5 px-5 py-3 lg:px-6 lg:py-3.5 rounded-full text-[14.5px] lg:text-[15px] font-bold text-white seal-chip [--seal-drop:0_6px_16px_-4px_var(--brand-glow)] hover:[--seal-drop:0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.97] transition-[box-shadow,transform] duration-150"
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
        </div>
      </div>

      {/* ── 캔버스 블록 ──
          모바일: 통계 카드가 -mt 로 사진 띠 하단에 걸쳐 올라탄다. 그 아래 안내 카드 3장이 세로로.
          PC: 전폭 통계 스트립(카피·사진 카드와 좌우 라인이 맞는다) + 안내 카드 3열. */}
      <div className="relative max-w-[1040px] lg:max-w-[1240px] mx-auto px-5 -mt-14 sm:-mt-16 lg:mt-10 pb-8 sm:pb-10 lg:pb-12">
        {statItems.length > 0 && (
          <div
            ref={tickerRef}
            className="grid grid-cols-4 divide-x divide-black/[0.07] dark:divide-white/10 rounded-2xl bg-white dark:bg-[#161616] ring-1 ring-inset ring-black/5 dark:ring-white/10 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] lg:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.25)]"
          >
            {statItems.map((s) => (
              <StatItem key={s.label} {...s} active={armed} ko={ko} />
            ))}
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-5 ${statItems.length > 0 ? 'mt-4 lg:mt-6' : ''}`}>
          <InfoCard
            tone="blue"
            icon={<ClockIcon size={20} />}
            title={ko ? '주일 예배' : 'Sunday service'}
            desc={tx('aboutInfoWorship')}
            onClick={() => navigate('/worship')}
          />
          <InfoCard
            tone="green"
            icon={<MapPinIcon size={20} />}
            title={ko ? '오시는 길' : 'Getting here'}
            desc={tx('aboutAddress')}
            onClick={() => navigate('/visit')}
          />
          <InfoCard
            tone="warm"
            icon={<SproutIcon size={20} />}
            title={ko ? '처음 오셨나요?' : 'First time here?'}
            desc={ko ? '새가족 안내를 도와드릴게요' : "We'll help you get settled in"}
            action={ko ? '안내 받기' : 'Guide'}
            onClick={() => navigate('/visit')}
          />
        </div>
      </div>
    </section>
  )
}

export default HeroSection
