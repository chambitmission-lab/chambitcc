import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EditableText } from '../../../components/AboutEditor'
import { useAboutContent } from '../../../hooks/useAboutContent'
import { useLandingStats } from '../../../hooks/useLandingStats'
import { ChevronRightIcon, ClockIcon, MapPinIcon } from '../../About/icons'
import { fmtNum, useCountUp } from './landingUtils'

// 히어로: 큰 약속 한 줄 + 살아있는 숫자 + 두 갈래 CTA.
// 카피는 about_content.fields 에 저장돼 관리자가 화면에서 바로 고친다.

const StatItem = ({
  value,
  unit,
  label,
  active,
  ko,
}: {
  value: number
  unit: string
  label: string
  active: boolean
  ko: boolean
}) => {
  const n = useCountUp(value, active)
  return (
    <div className="flex flex-col min-w-0">
      <span className="ld-ticker-num text-[22px] lg:text-[26px] font-extrabold text-white leading-none">
        {fmtNum(n, ko)}
        <span className="text-[13px] font-bold text-white/80 ml-0.5">{unit}</span>
      </span>
      <span className="mt-1 text-[11.5px] lg:text-[12px] font-semibold text-white/65 truncate">{label}</span>
    </div>
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
        { value: stats.verses_read_year, unit: ko ? '절' : '', label: ko ? `${stats.year}년 함께 읽은 말씀` : `verses read in ${stats.year}` },
        { value: stats.prayers_week, unit: ko ? '개' : '', label: ko ? '이번 주 올라온 기도' : 'prayers this week' },
        { value: stats.prayed_together, unit: ko ? '번' : '', label: ko ? '서로를 위해 기도했어요' : 'times prayed for each other' },
        { value: stats.sermons, unit: ko ? '편' : '', label: ko ? '다시 들을 수 있는 설교' : 'sermons on replay' },
      ].filter((s) => s.value > 0)
    : []

  return (
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#12294f] via-[#0f1e3a] to-[#0b1526]" />
      )}
      {/* 사진이 카피를 방해하지 않게 좌측·하단을 더 눌러준다 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      {/* 디졸브 — 사진 하단이 페이지 배경색(라이트 gray-50 / 다크 black)으로 녹아들어
          라이트 테마에서도 어두운 히어로와 밝은 본문 사이에 딱 잘린 경계가 생기지 않는다.
          콘텐츠는 pb 로 이 띠 위에서 끝난다(흰 글씨가 밝은 페이드 위에 얹히지 않게). */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-gray-50 dark:to-black pointer-events-none" />

      <div className="relative max-w-[1040px] mx-auto px-5 pt-16 pb-24 lg:pt-28 lg:pb-28">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 ring-1 ring-inset ring-white/20 backdrop-blur-sm px-3 py-1 text-[12px] font-bold tracking-wide text-white/85">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <EditableText fieldKey="landingHeroKicker" isAdmin={isAdmin}>
            {tx('aboutChurchName')} · {tx('landingHeroKicker')}
          </EditableText>
        </p>

        <h1 className="ld-hero-title text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.15] font-extrabold tracking-tight text-white max-w-[760px]">
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

        <p className="mt-4 text-[15px] lg:text-[17px] leading-relaxed text-white/85 max-w-[620px] whitespace-pre-line">
          <EditableText fieldKey="landingHeroSub" isAdmin={isAdmin} multiline>
            <span>{tx('landingHeroSub')}</span>
          </EditableText>
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
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
            className="flex items-center gap-1.5 px-5 py-3 rounded-full text-[14.5px] font-bold text-white bg-white/[0.14] ring-1 ring-inset ring-white/25 backdrop-blur-sm hover:bg-white/[0.22] active:scale-[0.97] transition-[background-color,transform] duration-150"
          >
            {tx('landingCtaTour')}
            <ChevronRightIcon size={16} />
          </button>
        </div>

        {/* 살아있는 숫자 — 백엔드 미배포·0건이면 자리 자체가 사라진다 */}
        {statItems.length > 0 && (
          <div
            ref={tickerRef}
            className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4 max-w-[760px] rounded-2xl bg-black/30 ring-1 ring-inset ring-white/15 backdrop-blur-md px-5 py-4"
          >
            {statItems.map((s) => (
              <StatItem key={s.label} {...s} active={armed} ko={ko} />
            ))}
          </div>
        )}

        {/* 예배·오시는 길 — 방문자의 두 가지 질문은 히어로 안에서 바로 답한다 */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-white/75">
          <button type="button" onClick={() => navigate('/worship')} className="inline-flex items-center gap-1.5 hover:text-white">
            <ClockIcon size={14} />
            <span className="font-semibold">{tx('aboutInfoWorship')}</span>
          </button>
          <button type="button" onClick={() => navigate('/visit')} className="inline-flex items-center gap-1.5 hover:text-white">
            <MapPinIcon size={14} />
            <span className="font-semibold">{tx('aboutAddress')}</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
