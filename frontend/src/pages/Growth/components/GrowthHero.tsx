import type { GrowthSummaryData } from '../../../types/growth'

interface GrowthHeroProps {
  summary: GrowthSummaryData
}

/** 여정의 첫 카드 — 함께한 일수 + 한 줄 요약 (brand 그라데이션) */
const GrowthHero = ({ summary }: GrowthHeroProps) => {
  const { days_together, headline, sub, has_activity } = summary

  return (
    <div className="px-4 pt-4">
      <div
        className="
          relative overflow-hidden rounded-2xl px-5 py-6
          bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500
          shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(168,85,247,0.30)]
          dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_12px_28px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.10)]
        "
      >
        {/* 글로우 장식 */}
        <div
          className="pointer-events-none absolute -top-12 -right-10 w-36 h-36 rounded-full bg-pink-300/25 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-14 -left-10 w-32 h-32 rounded-full bg-purple-300/25 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg">
              🌱
            </span>
            <span className="text-[12px] font-semibold text-white/85">
              나의 신앙 여정
            </span>
          </div>

          {has_activity ? (
            <>
              <div className="flex items-end gap-1.5">
                <span className="text-[44px] leading-none font-extrabold text-white tracking-[-0.02em]">
                  {days_together}
                </span>
                <span className="text-[18px] font-bold text-white/90 pb-1">일째</span>
              </div>
              <h2 className="mt-3 text-[17px] font-bold text-white leading-snug tracking-[-0.015em]">
                {headline}
              </h2>
              <p className="mt-1 text-[13px] text-white/85 leading-relaxed">{sub}</p>
            </>
          ) : (
            <>
              <h2 className="text-[20px] font-bold text-white leading-snug tracking-[-0.015em]">
                {headline}
              </h2>
              <p className="mt-1.5 text-[13px] text-white/85 leading-relaxed">{sub}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GrowthHero
