// 동행 목표 고르기 — 초대 시트와 목표 바꾸기 시트가 함께 쓴다
import type { CompanionGoal } from '../../types/companion'
import { GOAL_ORDER, GOAL_SPECS } from './companionGoals'

const GoalPicker = ({ value, onChange }: { value: CompanionGoal; onChange: (goal: CompanionGoal) => void }) => {
  const spec = GOAL_SPECS[value.goal_type]
  const clamp = (n: number) => Math.min(spec.max, Math.max(spec.min, Math.round(n) || spec.min))

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-white/[0.05]">
        {GOAL_ORDER.map((type) => {
          const active = type === value.goal_type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ goal_type: type, goal_amount: GOAL_SPECS[type].defaultAmount })}
              aria-pressed={active}
              className={`py-2.5 rounded-xl text-[13.5px] font-bold transition-colors ${
                active
                  ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-gray-500 dark:text-white/50'
              }`}
            >
              {GOAL_SPECS[type].label}
            </button>
          )
        })}
      </div>
      <p className="text-[12px] text-gray-500 dark:text-white/50 mt-2.5 px-0.5">{spec.hint}</p>

      <div className="mt-4 text-[12px] font-bold text-gray-500 dark:text-white/55 px-0.5">이번 주 둘이 합쳐</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {spec.presets.map((n) => {
          const active = n === value.goal_amount
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...value, goal_amount: n })}
              aria-pressed={active}
              className={`px-3.5 py-2 rounded-full text-[13px] font-bold border transition-colors ${
                active
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white dark:bg-white/[0.04] text-gray-600 dark:text-white/70 border-gray-200 dark:border-white/[0.1]'
              }`}
            >
              {n}
              {spec.unit}
            </button>
          )
        })}
        <label className="flex items-center gap-1 pl-3 pr-2.5 py-1 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[13px] text-gray-600 dark:text-white/70">
          <span className="sr-only">직접 입력</span>
          <input
            type="number"
            inputMode="numeric"
            min={spec.min}
            max={spec.max}
            value={value.goal_amount}
            onChange={(e) => onChange({ ...value, goal_amount: Number(e.target.value) })}
            onBlur={() => onChange({ ...value, goal_amount: clamp(value.goal_amount) })}
            className="w-12 bg-transparent text-right font-bold text-ink-strong focus:outline-none"
          />
          {spec.unit}
        </label>
      </div>
    </div>
  )
}

export default GoalPicker
