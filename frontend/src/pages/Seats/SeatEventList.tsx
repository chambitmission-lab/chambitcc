// 좌석 예약 목록 — 예약 받는 행사와 내 좌석
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeatEvents } from '../../hooks/useSeatEvents'
import { useThemeArt } from '../../hooks/useThemeArt'
import { SEATS_HERO } from '../../utils/themeAssets'
import { CenterNote, RailCard, SectionTitle, Spinner, SurveyShell } from '../Survey/surveyUi'
import { SeatEventCard } from './seatUi'
import { seatPhase } from './seatShared'
import './seats-hero.css'

const SeatEventList = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useSeatEvents()
  // 히어로 삽화는 CSS 배경 — 도착에 맞춰 페이드인(utils/themeAssets.ts)
  const artReady = useThemeArt(SEATS_HERO)

  const { live, past, mineCount, openCount } = useMemo(() => {
    const list = data ?? []
    const live = list.filter((e) => seatPhase(e) !== 'ended')
    return {
      live,
      past: list.filter((e) => seatPhase(e) === 'ended'),
      mineCount: list.filter((e) => e.my_seats.length > 0 && seatPhase(e) !== 'ended').length,
      openCount: live.filter((e) => seatPhase(e) === 'open').length,
    }
  }, [data])

  const open = (id: number) => navigate(`/seats/${id}`)

  const rail = (
    <>
      <RailCard title="한눈에">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold text-gray-500 dark:text-white/55">예약 받는 행사</span>
            <span className="text-[20px] font-bold text-brand tabular-nums">{openCount}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold text-gray-500 dark:text-white/55">내가 예약한 행사</span>
            <span className="text-[20px] font-bold text-ink-strong tabular-nums">{mineCount}</span>
          </div>
        </div>
      </RailCard>
      <RailCard title="좌석 예약 안내">
        <ul className="space-y-2 text-[15px] text-gray-600 dark:text-white/60 leading-relaxed break-keep">
          <li>· 배치도에서 원하는 자리를 직접 골라요.</li>
          <li>· 일행과 붙어 앉으려면 ‘나란히 N석’을 써보세요.</li>
          <li>· 공연 시작 전까지 일부 좌석만 취소할 수도 있어요.</li>
        </ul>
      </RailCard>
    </>
  )

  return (
    <SurveyShell onBack={() => navigate('/')} title="좌석 예약" rail={rail}>
      <section className="relative overflow-hidden mx-4 mt-5 px-6 py-8 rounded-[26px] bg-[linear-gradient(120deg,#d4eafc_0%,#dff1ff_58%,#ebf5ff_125%)] ring-1 ring-[rgba(49,130,246,0.15)] shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)] dark:bg-[linear-gradient(120deg,#071222_0%,#0a1a35_58%,#0b1730_125%)] dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
        {/* 배경 삽화 "명당 사수"(docs/seats-hero-bg-prompts.md) — 카드 그라데이션은 도착 전 자리끼움 */}
        <div className={`seats-hero-art absolute inset-0${artReady ? ' is-ready' : ''}`} aria-hidden />
        <div className="relative z-10">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.34em] text-[#2563eb] dark:text-white/65">
            Seats
          </span>
          <h2 className="text-[26px] lg:text-[32px] font-extrabold tracking-[-0.02em] leading-[1.25] mt-3 whitespace-pre-line text-[#152648] dark:text-white dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {mineCount > 0
              ? `예약한 행사\n${mineCount}개가 기다려요`
              : openCount > 0
                ? `원하는 자리를\n직접 골라보세요`
                : '지금은 예약 받는\n행사가 없어요'}
          </h2>
          <p className="text-[13px] lg:text-[16px] lg:max-w-[18rem] font-light leading-[1.7] text-[#41527a] dark:text-white/80 mt-3 max-w-[11rem] break-keep">
            {openCount > 0 ? '콘서트·특별 행사 좌석을 앱에서 바로 예약해요.' : '새 행사가 열리면 일정에서 알려드릴게요.'}
          </p>
        </div>
      </section>

      <div className="px-4 pt-6 lg:px-6">
        {isLoading ? (
          <Spinner />
        ) : !live.length && !past.length ? (
          <CenterNote title="아직 예약 받는 행사가 없어요" hint="콘서트나 특별 행사가 열리면 여기서 좌석을 고를 수 있어요." />
        ) : (
          <>
            {live.length ? (
              <section>
                <SectionTitle count={live.length}>예약 행사</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
                  {live.map((e) => (
                    <SeatEventCard key={e.id} event={e} onOpen={() => open(e.id)} />
                  ))}
                </div>
              </section>
            ) : null}
            {past.length ? (
              <section className={live.length ? 'pt-8' : ''}>
                <SectionTitle count={past.length}>지난 행사</SectionTitle>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
                  {past.map((e) => (
                    <SeatEventCard key={e.id} event={e} onOpen={() => open(e.id)} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </SurveyShell>
  )
}

export default SeatEventList
