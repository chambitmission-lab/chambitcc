import { useNavigate } from 'react-router-dom'
import { useFaithJourneyInsight } from '../../../hooks/useGrowth'
import type { JourneyFlowStop, JourneyVerse } from '../../../types/growth'
import { GrowthGlyph, JourneyStageGlyph } from '../../../components/icons/GrowthIcons'

/**
 * 말씀 여정 인사이트 카드 — 읽기 동선(어떤 책을 어떤 순서로)을 룰 엔진이 해석해
 * "지금 여정의 어느 자리에 있는지"를 진단해 보여준다. (백엔드 /growth/insight, AI 미사용)
 */
const JourneyInsightCard = () => {
  const navigate = useNavigate()
  const { data, isLoading, error } = useFaithJourneyInsight()

  // 로딩 중엔 자리만 잡는 얇은 스켈레톤 — 아래 통계 카드가 튀지 않게
  if (isLoading) {
    return (
      <div className="px-4 pt-5">
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
      </div>
    )
  }
  // 인사이트는 보조 기능 — 실패해도 여정 페이지 자체를 막지 않는다
  if (error || !data?.data) return null

  const insight = data.data
  const {
    has_data,
    stage_key,
    stage_title,
    headline,
    metaphor,
    narrative,
    emotion_note,
    flow,
    verses,
  } = insight

  return (
    <div className="px-4 pt-5">
      <h3 className="text-[14px] font-bold text-ink-strong mb-3 flex items-center gap-2 tracking-[-0.01em]">
        <span className="material-icons-outlined text-xl text-brand">explore</span>
        말씀 여정 인사이트
      </h3>

      <div
        className="
          relative overflow-hidden rounded-2xl
          bg-white/80 dark:bg-card-dark
          border border-gray-200/70 dark:border-white/[0.06] shadow-sm
          dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
        "
      >
        {/* 상단 1px 빛줄 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand)]/50 to-transparent"
          aria-hidden="true"
        />
        {/* 미세 그라데이션 (다크) */}
        <div
          className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none"
          aria-hidden="true"
        />
        {/* 우상단 은은한 브랜드 빛망울 */}
        <div
          className="pointer-events-none absolute -top-12 -right-10 w-36 h-36 rounded-full bg-[var(--brand-soft-strong)] blur-2xl"
          aria-hidden="true"
        />

        <div className="relative p-4">
          {/* 단계 진단 */}
          <div className="flex items-center gap-3">
            <span
              className="
                shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-brand
                bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]
              "
            >
              <JourneyStageGlyph stage={stage_key} size={26} />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-brand tracking-[-0.01em]">
                {stage_title}
              </div>
              <div className="text-[17px] font-bold text-ink-strong leading-snug tracking-[-0.015em]">
                {headline}
              </div>
            </div>
          </div>

          {/* 읽기 동선 칩 */}
          {flow.length > 0 && (
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {flow.map((stop: JourneyFlowStop, i: number) => (
                <div key={`${stop.book}-${i}`} className="flex items-center gap-1.5 shrink-0">
                  {i > 0 && (
                    <span
                      className="material-icons-outlined text-base text-gray-300 dark:text-white/25"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  )}
                  <div
                    className="
                      rounded-xl px-2.5 py-1.5 leading-tight
                      bg-gray-50 dark:bg-white/[0.05]
                      border border-gray-200/70 dark:border-white/[0.07]
                    "
                  >
                    <div className="flex items-center gap-1 text-[12px] font-bold text-gray-800 dark:text-white/85">
                      <GrowthGlyph name="book" size={13} className="text-brand" />
                      {stop.book}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-white/50">
                      {stop.theme}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 동선 해석 */}
          <p className="mt-3 text-[13px] leading-relaxed text-[#4b5563] dark:text-white/75">
            {narrative}
          </p>

          {/* 마음 신호 */}
          {emotion_note && (
            <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-gray-500 dark:text-white/55">
              <GrowthGlyph name="quote" size={14} className="shrink-0 mt-0.5" />
              <span>{emotion_note}</span>
            </p>
          )}

          {/* 여정 은유 — 인용 블록 */}
          <div className="mt-3.5 rounded-r-xl border-l-2 border-[var(--brand)] bg-[var(--brand-soft)] px-3.5 py-3">
            <p className="text-[13px] leading-relaxed text-gray-700 dark:text-white/80">
              {metaphor}
            </p>
          </div>

          {/* 추천 말씀 */}
          {verses.length > 0 && (
            <div className="mt-3.5 space-y-2">
              <div className="text-[12px] font-bold text-gray-500 dark:text-white/50">
                이 자리에 함께 읽으면 좋은 말씀
              </div>
              {verses.map((v: JourneyVerse) => (
                <div
                  key={v.reference}
                  className="
                    rounded-xl px-3.5 py-3
                    bg-gray-50 dark:bg-white/[0.04]
                    border border-gray-200/70 dark:border-white/[0.06]
                  "
                >
                  <div className="text-[12px] font-bold text-brand">{v.reference}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-800 dark:text-white/85">
                    {v.text}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-white/50">
                    {v.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate('/bible')}
            className="
              mt-4 w-full py-2.5 rounded-full brand-gradient font-bold text-[14px]
              shadow-[0_2px_10px_var(--brand-glow)] active:scale-[0.99] transition-transform
            "
          >
            {has_data ? '이어서 말씀 읽기' : '오늘 한 절로 여정 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default JourneyInsightCard
