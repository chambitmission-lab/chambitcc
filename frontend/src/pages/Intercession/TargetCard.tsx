// 누군가의 기도 — 이번 달 내가 기도할 분 카드
//
// 위에서 아래로: 그분(얼굴·이번 달 흐름) → 그분이 남긴 한 줄(손글씨 쪽지) → 최근에 나눈 기도(타임라인)
// → 오늘의 기도 → 봉인된 편지. 매일 와서 버튼 하나 누르는 화면이라, 누를 때의 순간과
// 한 달이 쌓이는 감각이 보이도록 꾸민다.
import { useState } from 'react'
import type { IntercessionCycle, IntercessionTarget } from '../../api/intercession'
import { usePrayIntercession } from '../../hooks/useIntercession'
import { toastFeedback } from '../../utils/toast'
import { FlameGlyph } from './intercessionUi'
import { cycleMonthLabel, daysUntil } from './intercessionDates'
import { LetterEntry } from './Letters'

/** 얼굴 — 오늘 기도했으면 따뜻한 빛무리와 작은 불꽃 배지가 붙는다 */
const Portrait = ({ name, url, lit }: { name: string; url: string | null; lit: boolean }) => (
  <span className={`ic-portrait${lit ? ' is-lit' : ''}`}>
    {url ? (
      <img src={url} alt="" className="ic-portrait__img object-cover" />
    ) : (
      <span className="ic-portrait__img ic-portrait__img--initial text-brand text-[24px] lg:text-[28px] font-bold flex items-center justify-center">
        {name.slice(0, 1)}
      </span>
    )}
    {lit ? (
      <span className="ic-portrait__badge" aria-hidden>
        <FlameGlyph size={13} />
      </span>
    ) : null}
  </span>
)

/** 이번 달 흐름 — 기도한 날 / 함께한 날 / 남은 날 */
const Stat = ({ label, value, unit, accent }: { label: string; value: number | string; unit: string; accent?: boolean }) => (
  <div className="flex-1 min-w-0 rounded-xl bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/[0.04] dark:ring-white/[0.06] px-3 py-2.5 lg:px-4 lg:py-3">
    <p className="text-[11px] lg:text-[13.5px] font-semibold text-[var(--text-muted)] lg:text-[var(--text-body)] truncate">{label}</p>
    <p className="mt-0.5 text-ink-strong">
      <strong className={`text-[19px] lg:text-[23px] font-extrabold tabular-nums tracking-[-0.02em] ${accent ? 'text-brand' : ''}`}>
        {value}
      </strong>
      <span className="ml-0.5 text-[12px] lg:text-[14px] font-semibold text-[var(--text-body)]">{unit}</span>
    </p>
  </div>
)

const SectionLabel = ({ children }: { children: string }) => (
  <p className="mb-2 lg:mb-2.5 text-[11.5px] lg:text-[14px] font-bold tracking-[0.02em] text-[var(--text-muted)] lg:text-[var(--text-body)]">
    {children}
  </p>
)

const daysBetween = (fromIso: string, toIso: string) => daysUntil(toIso) - daysUntil(fromIso)

export const TargetCard = ({ target, cycle }: { target: IntercessionTarget; cycle: IntercessionCycle }) => {
  const [burst, setBurst] = useState(false)
  const pray = usePrayIntercession(
    toastFeedback({ success: '기도가 조용히 전해질 거예요', error: '기도를 기록하지 못했습니다' }),
  )
  const done = target.prayed_today
  const month = cycleMonthLabel(cycle.start_date)

  // end_date 는 다음 주기 시작일(미포함) — 그날 아침 짝이 바뀌고 편지가 도착한다
  const totalDays = Math.max(1, daysBetween(cycle.start_date, cycle.end_date))
  const dayIndex = Math.min(totalDays, Math.max(1, 1 - daysUntil(cycle.start_date)))
  const daysLeft = Math.max(0, daysUntil(cycle.end_date))

  return (
    <section className="mx-4 mt-3 lg:mt-4 rounded-2xl overflow-hidden bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
      {/* 머리 — 그분과 이번 달 흐름. 옅은 브랜드 물결로 카드 본문과 나눈다 */}
      <div className="ic-target__head px-4 pt-4 pb-4 lg:px-6 lg:pt-6 lg:pb-5">
        <h3 className="text-[14.5px] lg:text-[18px] font-extrabold text-ink-strong tracking-[-0.02em]">
          {month}에 내가 기도할 분
        </h3>

        <div className="mt-4 lg:mt-5 flex items-center gap-4 lg:gap-5">
          <Portrait name={target.display_name} url={target.avatar_url} lit={done} />
          <div className="min-w-0">
            <p className="text-[20px] lg:text-[25px] font-extrabold text-ink-strong tracking-[-0.025em] truncate">
              {target.display_name}{' '}
              <span className="text-[14px] lg:text-[17px] font-semibold text-[var(--text-muted)] lg:text-[var(--text-body)]">성도님</span>
            </p>
            <p className="mt-0.5 text-[12.5px] lg:text-[15px] text-[var(--text-body)] break-keep">
              {done ? '오늘도 이분의 이름을 불러 주셨어요' : '오늘 이분의 이름을 불러 주세요'}
            </p>
          </div>
        </div>

        <div className="mt-4 lg:mt-5 flex gap-2 lg:gap-3">
          <Stat label="기도한 날" value={target.prayed_days} unit="일" accent />
          <Stat label="함께한 지" value={dayIndex} unit="일째" />
          <Stat label="짝이 바뀌기까지" value={daysLeft > 0 ? `D-${daysLeft}` : '오늘'} unit="" />
        </div>
      </div>

      <div className="px-4 pb-4 lg:px-6 lg:pb-6">
        {/* 그분이 남긴 한 줄 — 손글씨 쪽지 */}
        {target.request_line ? (
          <figure className="ic-request mt-1">
            <span className="ic-request__mark" aria-hidden>
              “
            </span>
            <figcaption className="ic-request__label">
              <FlameGlyph size={12} />
              {target.display_name} 님의 기도제목
            </figcaption>
            <blockquote className="ic-request__text">{target.request_line}</blockquote>
          </figure>
        ) : (
          <p className="mt-1 rounded-xl border border-dashed border-gray-200 dark:border-white/10 px-4 py-3.5 lg:px-5 lg:py-4 text-[13px] lg:text-[16px] leading-relaxed text-[var(--text-muted)] lg:text-[var(--text-body)] break-keep">
            따로 남긴 기도제목은 없어요. 이분의 한 달을 하나님께 맡겨 드려요.
          </p>
        )}

        {/* 최근에 나눈 기도 — 세로 타임라인 */}
        {target.recent_prayers.length > 0 ? (
          <div className="mt-5 lg:mt-6">
            <SectionLabel>최근에 나눈 기도</SectionLabel>
            <ul>
              {target.recent_prayers.map((p) => (
                <li key={p.id} className="group relative pl-6 lg:pl-7 pb-4 last:pb-0">
                  <span className="absolute left-[5px] lg:left-[6px] top-[18px] bottom-0 w-px bg-gray-200 dark:bg-white/10 group-last:hidden" aria-hidden />
                  <span className="absolute left-0 top-[5px] w-[11px] h-[11px] lg:w-[13px] lg:h-[13px] rounded-full border-2 border-[var(--brand)] bg-white dark:bg-card-dark" aria-hidden />
                  <p className="text-[11.5px] lg:text-[13.5px] font-semibold text-[var(--text-muted)]">{p.time_ago}</p>
                  {p.title ? (
                    <p className="mt-0.5 text-[13.5px] lg:text-[16.5px] font-bold text-ink-strong tracking-[-0.01em]">{p.title}</p>
                  ) : null}
                  <p className="mt-0.5 text-[13px] lg:text-[16px] leading-relaxed text-[var(--text-body)] line-clamp-2 break-keep">
                    {p.preview}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 오늘의 기도 */}
        <div className="mt-5 lg:mt-6">
          {done ? (
            <div className={`ic-prayed ${burst ? 'ic-pray-burst' : ''}`} role="status">
              <span className="ic-prayed__flame" aria-hidden>
                <FlameGlyph size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] lg:text-[18px] font-extrabold tracking-[-0.015em] text-[var(--amber)]">
                  오늘 기도했어요
                </span>
                <span className="mt-0.5 block text-[12px] lg:text-[14.5px] text-[var(--text-body)] break-keep">
                  저녁 8시, 그분 창가에 조용히 불이 켜져요
                </span>
              </span>
              <span className="shrink-0 text-[12px] lg:text-[14px] font-bold text-[var(--amber)] opacity-80">내일 또 만나요</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={pray.isPending}
                onClick={() => pray.mutate(undefined, { onSuccess: () => setBurst(true) })}
                className="w-full h-[52px] lg:h-[60px] rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] text-[16px] lg:text-[18px] font-bold tracking-[-0.01em] shadow-[0_10px_24px_-12px_rgba(49,130,246,0.85)] hover:brightness-110 active:scale-[0.985] transition disabled:opacity-60 disabled:active:scale-100"
              >
                🙏 오늘 기도했어요
              </button>
              <p className="mt-2 text-center text-[11.5px] lg:text-[14px] text-[var(--text-muted)] lg:text-[var(--text-body)] break-keep">
                기도를 마친 뒤 눌러 주세요 · 하루 한 번, 그분께 조용히 전해져요
              </p>
            </>
          )}
        </div>

        <LetterEntry target={target} deliverOn={cycle.end_date} />
      </div>
    </section>
  )
}
