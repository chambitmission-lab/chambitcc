import type { GrowthSummaryData } from '../../../types/growth'
// 홈 묵상 카드의 아침 히어로와 같은 사진 — 여명빛이 "빛을 향해 자라나는 여정" 서사와 맞닿는다
import heroMorning from '../../../assets/hero/morning.jpg'

interface GrowthHeroProps {
  summary: GrowthSummaryData
}

/** 여정의 첫 카드 — 함께한 일수 + 한 줄 요약 (여명 사진 배경) */
const GrowthHero = ({ summary }: GrowthHeroProps) => {
  const { days_together, headline, sub, has_activity } = summary
  // 구버전 백엔드 문구("N일째, …")가 오더라도 큰 숫자와 중복되지 않게 정리
  const narrative = headline.replace(/^\d+\s*일째[,，]?\s*/, '')

  return (
    <div className="px-4 pt-4">
      <div
        className="
          relative overflow-hidden rounded-2xl px-5 py-6
          shadow-[0_4px_16px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.14)]
          dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_12px_28px_rgba(0,0,0,0.35)]
        "
      >
        {/* 배경 사진 — 텍스트가 좌측에 모이므로 우상단의 해는 그대로 살린다 */}
        <img
          src={heroMorning}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        {/* 스크림 — 텍스트 구간(좌하단)만 어둡게, 빛(우상단)은 남긴다 */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/65 via-black/35 to-black/10"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg">
              🌱
            </span>
            <span className="text-[12px] font-semibold text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">
              나의 신앙 여정
            </span>
          </div>

          {has_activity ? (
            <>
              <div className="flex items-end gap-1.5 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">
                <span className="text-[44px] leading-none font-extrabold text-white tracking-[-0.02em]">
                  {days_together}
                </span>
                <span className="text-[18px] font-bold text-white/90 pb-1">일째</span>
              </div>
              <h2 className="mt-3 text-[18px] font-bold text-white leading-snug tracking-[-0.015em] [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">
                {narrative}
              </h2>
              <p className="mt-2 pb-0.5 text-[14px] text-white/90 leading-relaxed [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{sub}</p>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-bold text-white leading-snug tracking-[-0.015em] [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">
                {headline}
              </h2>
              <p className="mt-1.5 text-[13px] text-white/90 leading-relaxed [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">{sub}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GrowthHero
