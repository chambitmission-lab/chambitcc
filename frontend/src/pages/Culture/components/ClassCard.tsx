// 문화교실 강좌 카드 — 잔여석 게이지 · 상태 배지 · 신청 CTA.

import type { CultureClass } from '../../../types/culture'
import { getCultureAccent, withAlpha, parseScheduleDays } from '../cultureAccents'
import { cardClass } from './styles'

const ClassCard = ({
  cultureClass,
  onApply,
}: {
  cultureClass: CultureClass
  onApply: (c: CultureClass) => void
}) => {
  const accent = getCultureAccent(cultureClass.title)
  const days = parseScheduleDays(cultureClass.schedule)

  const capacity = cultureClass.capacity ?? null
  const count = cultureClass.application_count
  const hasSeatInfo = capacity !== null && capacity > 0 && typeof count === 'number'
  const remaining = hasSeatInfo ? Math.max(0, capacity - count) : null
  const ratio = hasSeatInfo ? Math.min(1, count / capacity) : 0
  const isFull = remaining === 0
  const almostFull = hasSeatInfo && !isFull && (remaining! <= 3 || ratio >= 0.8)

  return (
    <div className={`${cardClass} overflow-hidden`}>
      {/* 상단 파스텔 틴트 헤더 */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(accent.color, 0.1)}, transparent 70%)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: withAlpha(accent.color, 0.14),
            border: `1px solid ${withAlpha(accent.color, 0.22)}`,
            color: accent.color,
          }}
        >
          <accent.Icon width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-[15.5px] font-bold text-gray-900 dark:text-white/90">
              {cultureClass.title}
            </h3>
            {cultureClass.is_open ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand">
                모집중
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40">
                모집 마감
              </span>
            )}
            {almostFull && cultureClass.is_open && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-600 dark:text-amber-300">
                마감 임박
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {cultureClass.quarter && (
              <span className="text-[11.5px] font-semibold" style={{ color: accent.color }}>
                {cultureClass.quarter}
              </span>
            )}
            {days.length > 0 && (
              <span className="flex items-center gap-1">
                {days.map((d) => (
                  <span
                    key={d}
                    className="w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                      background: withAlpha(accent.color, 0.13),
                      color: accent.color,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {cultureClass.description && (
          <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed whitespace-pre-wrap">
            {cultureClass.description}
          </p>
        )}

        <div className="mt-3 space-y-1.5">
          {[
            { icon: 'person', value: cultureClass.instructor && `강사 ${cultureClass.instructor}` },
            { icon: 'schedule', value: cultureClass.schedule },
            { icon: 'payments', value: cultureClass.fee },
            { icon: 'place', value: cultureClass.location },
          ]
            .filter((row) => row.value)
            .map((row) => (
              <div key={row.icon} className="flex items-center gap-2">
                <span className="material-icons-outlined text-[15px] text-gray-400 dark:text-white/35">
                  {row.icon}
                </span>
                <span className="text-[12.5px] text-gray-600 dark:text-white/55">{row.value}</span>
              </div>
            ))}
        </div>

        {/* 잔여석 게이지 */}
        {hasSeatInfo ? (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] text-gray-400 dark:text-white/40">
                정원 {capacity}명
              </span>
              <span
                className={`text-[11.5px] font-bold ${
                  isFull
                    ? 'text-gray-400 dark:text-white/40'
                    : almostFull
                      ? 'text-amber-600 dark:text-amber-300'
                      : ''
                }`}
                style={isFull || almostFull ? undefined : { color: accent.color }}
              >
                {isFull ? '정원이 모두 찼어요' : `${remaining}자리 남았어요`}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: withAlpha(accent.color, 0.12) }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${ratio * 100}%`, background: accent.color }}
              />
            </div>
          </div>
        ) : (
          capacity !== null &&
          capacity > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="material-icons-outlined text-[15px] text-gray-400 dark:text-white/35">
                groups
              </span>
              <span className="text-[12.5px] text-gray-600 dark:text-white/55">
                정원 {capacity}명
              </span>
            </div>
          )
        )}

        {cultureClass.is_open && (
          <button
            onClick={() => onApply(cultureClass)}
            disabled={isFull}
            className={`relative mt-3.5 w-full py-2.5 text-sm font-semibold rounded-xl transition-colors [--seal-radius:0.75rem] ${
              isFull
                ? 'bg-gray-200 text-gray-400 dark:bg-white/[0.06] dark:text-white/35'
                : 'seal-chip bg-brand hover:bg-brand-dim text-white'
            }`}
          >
            {isFull ? '정원 마감' : '이 강좌 수강신청'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { ClassCard }
