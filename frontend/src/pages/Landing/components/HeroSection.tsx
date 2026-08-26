import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import { HandHeartIcon } from '../../../components/icons/ActionIcons'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { useLandingStats } from '../../../hooks/useLandingStats'
import { BookOpenIcon, ChevronRightIcon, ClockIcon, HeartIcon, MapPinIcon, PlayCircleIcon } from '../../About/icons'
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
}: {
  icon: ReactNode
  value: number
  unit: string
  label: string
  active: boolean
  ko: boolean
}) => {
  const n = useCountUp(value, active)
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2">
        <span className={TILE}>{icon}</span>
        <span className="ld-ticker-num text-[19px] sm:text-[21px] lg:text-[25px] font-extrabold text-ink-strong dark:text-white leading-none truncate">
          {fmtNum(n, ko)}
          <span className="text-[13px] font-bold text-ink-muted dark:text-white/80 ml-0.5">{unit}</span>
        </span>
      </div>
      <span className="mt-1 sm:mt-1.5 text-[11.5px] lg:text-[12px] font-semibold text-ink-muted dark:text-white/65 truncate">{label}</span>
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
    <section className="relative overflow-hidden">
      {heroBackgroundUrl ? (
        <>
          {/* 사진은 3:2 원본 하나뿐이라 PC 전폭(2.3:1)에 cover 로 깔면 2배 넘게 확대되어 뭉개진다.
              → 블러 필: 뒤에는 같은 사진을 크게 흐려 전폭을 채우고(색감·톤은 그대로),
                앞에는 원본을 확대 상한(1360px) 안에서 가운데 두고 좌우 가장자리만 마스크로 흐린 뒤판에 녹인다.
              모바일은 화면이 사진보다 좁아 그냥 cover 가 가장 선명하다 — lg 미만은 뒤판을 끄고 앞판을 전폭으로. */}
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            crossOrigin="anonymous"
            className="ld-hero-blurfill hidden lg:block absolute inset-0 w-full h-full object-cover object-[center_62%]"
          />
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
            crossOrigin="anonymous"
            className="ld-hero-photo absolute inset-y-0 left-1/2 -translate-x-1/2 w-full lg:w-[min(100%,1360px)] h-full object-cover object-[center_62%]"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#dbe7fb] via-[#eef3fb] to-gray-50 dark:from-[#12294f] dark:via-[#0f1e3a] dark:to-[#0b1526]" />
      )}
      {/* 다크: 사진이 카피를 방해하지 않게 좌측·하단을 검정으로 눌러준다.
          라이트: 스크림 없이 사진 원색 그대로 — 안개를 깔면 사진이 바래 어색하다는 피드백.
          사진 위에 바로 얹히는 글(제목·부제·하단 줄)은 양쪽 모두 흰 글씨, 라이트는 .ld-hero-halo 로
          진한 그림자를 더해 밝은 사진 위에서도 읽힌다. 카드·버튼·알약은 자체 흰 배경으로 잉크 글씨. */}
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      {/* 라이트: 사진 전체를 바래게 하는 안개 대신, 카피가 놓이는 좌상단만 국소적으로 눌러준다.
          우측·하단은 투명으로 빠져 사진 원색이 살아 있고, 흰 글씨와 겹치는 밝은 얼굴·셔츠만 가라앉는다. */}
      <div
        className="dark:hidden absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 0% 0%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.38) 35%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 80%)',
        }}
      />
      {/* 디졸브 — 사진 하단이 페이지 배경색(라이트 gray-50 / 다크 black)으로 녹아들어
          라이트 테마에서도 어두운 히어로와 밝은 본문 사이에 딱 잘린 경계가 생기지 않는다.
          콘텐츠는 pb 로 이 띠 위에서 끝난다(흰 글씨가 밝은 페이드 위에 얹히지 않게). */}
      <div className="absolute inset-x-0 bottom-0 h-12 sm:h-20 bg-gradient-to-b from-transparent to-gray-50 dark:to-black pointer-events-none" />

      <div className="relative max-w-[1040px] mx-auto px-5 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-16 lg:pb-16">
        {/* 히어로 콘텐츠는 좌측 한 덩어리 — 폭을 620px로 묶어 사진의 오른쪽이 그대로 살아 있게 한다.
            2단 그리드로 벌리거나 1040px 전폭을 다 쓰면 "퍼져 보인다"는 피드백. */}
        <div className="lg:max-w-[620px]">
          <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/70 ring-1 ring-inset ring-black/10 dark:bg-white/10 dark:ring-white/20 backdrop-blur-sm px-3 py-1 text-[12px] font-bold tracking-wide text-ink dark:text-white/85">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <EditableText fieldKey="landingHeroKicker" isAdmin={isAdmin}>
              {tx('aboutChurchName')} · {tx('landingHeroKicker')}
            </EditableText>
          </p>

          <h1 className="ld-hero-title ld-hero-halo text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.15] font-extrabold tracking-tight text-white max-w-[760px]">
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
          </h1>

          <p className="ld-hero-halo mt-3 sm:mt-4 text-[15px] lg:text-[17px] leading-snug sm:leading-relaxed font-medium text-white/95 dark:font-normal dark:text-white/85 max-w-[620px] whitespace-pre-line">
            <EditableText fieldKey="landingHeroSub" isAdmin={isAdmin} multiline>
              <span>{tx('landingHeroSub')}</span>
            </EditableText>
          </p>

          <div className="mt-5 sm:mt-7 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/visit')}
              className="brand-gradient flex items-center gap-1.5 px-5 py-3 rounded-full text-[14.5px] font-bold text-white shadow-[0_6px_16px_-4px_var(--brand-glow)] hover:shadow-[0_8px_20px_-4px_var(--brand-glow)] active:scale-[0.97] transition-[box-shadow,transform] duration-150"
            >
              <MapPinIcon size={16} />
              {tx('landingCtaVisit')}
            </button>
            <button
              type="button"
              onClick={onTour}
              className="flex items-center gap-1.5 px-5 py-3 rounded-full text-[14.5px] font-bold text-ink-strong bg-white/80 ring-1 ring-inset ring-black/10 hover:bg-white dark:text-white dark:bg-white/[0.14] dark:ring-white/25 dark:hover:bg-white/[0.22] backdrop-blur-sm active:scale-[0.97] transition-[background-color,transform] duration-150"
            >
              {tx('landingCtaTour')}
              <ChevronRightIcon size={16} />
            </button>
        </div>
        </div>

        {/* 한 장의 카드 — 위칸은 살아있는 숫자(백엔드 미배포·0건이면 칸 자체가 사라진다),
            아래칸은 방문자의 두 질문(예배 시간·오시는 길). 사진 위에 두 덩어리가 따로 떠 있으면
            시선이 흩어져 하나의 유리 카드로 묶었다. */}
        <div className="mt-6 sm:mt-8 max-w-[760px] lg:max-w-[620px] rounded-2xl bg-white/75 ring-1 ring-inset ring-black/5 dark:bg-black/35 dark:ring-white/15 backdrop-blur-md shadow-[0_12px_32px_-16px_rgba(0,0,0,0.45)] overflow-hidden">
          {statItems.length > 0 && (
            <div
              ref={tickerRef}
              className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-x-4 sm:gap-x-5 gap-y-3 sm:gap-y-4 px-4 sm:px-5 py-3.5 sm:py-4"
            >
              {statItems.map((s) => (
                <StatItem key={s.label} {...s} active={armed} ko={ko} />
              ))}
            </div>
          )}

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 ${statItems.length > 0 ? 'border-t border-black/[0.07] dark:border-white/10' : ''}`}
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
              className="border-t sm:border-t-0 sm:border-l lg:border-l-0 lg:border-t border-black/[0.07] dark:border-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
