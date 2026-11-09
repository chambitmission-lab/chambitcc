import { toLocalInputValue } from '../../../Election/electionShared'
import { chipBtn } from './boardStyles'

// ── 회차 옵션 (예약 마감·알림) ─────────────────────────────────────────

const QUICK_CLOSES: { label: string; minutes: number }[] = [
  { label: '30분 뒤', minutes: 30 },
  { label: '1시간 뒤', minutes: 60 },
  { label: '3시간 뒤', minutes: 180 },
]

/** 예약 마감 고르기 — 빠른 칩 + 직접 입력. 값은 datetime-local(로컬 시각) 문자열, 없으면 '' */
export const ClosesPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onChange('')} className={chipBtn(!value)}>
        직접 마감
      </button>
      {QUICK_CLOSES.map((q) => (
        <button
          key={q.minutes}
          type="button"
          onClick={() => onChange(toLocalInputValue(new Date(Date.now() + q.minutes * 60000)))}
          className={chipBtn(false)}
        >
          {q.label}
        </button>
      ))}
    </div>
    <input
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong focus:outline-none focus:border-brand"
    />
  </div>
)

export const Toggle = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: string }) => (
  <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-[18px] h-[18px] accent-[var(--brand)]" />
    {children}
  </label>
)
