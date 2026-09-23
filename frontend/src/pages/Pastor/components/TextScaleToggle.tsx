// 헤더 오른쪽 글씨 크기 토글 — 상태는 ./textScale
import { setPastorTextScale, usePastorTextScale, type PastorTextScale } from './textScale'

const OPTIONS: { key: PastorTextScale; label: string; size: string }[] = [
  { key: 'base', label: '보통', size: 'text-[13px]' },
  { key: 'large', label: '크게', size: 'text-[16px]' },
  { key: 'xlarge', label: '아주 크게', size: 'text-[19px]' },
]

/** 헤더 오른쪽 '가 가 가' — PC 에서만 보인다 */
const TextScaleToggle = () => {
  const scale = usePastorTextScale()
  return (
    <div
      role="radiogroup"
      aria-label="글씨 크기"
      title="글씨 크기"
      className="hidden lg:flex items-end gap-0.5 p-0.5 rounded-full border border-gray-200 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.03]"
    >
      {OPTIONS.map(o => {
        const active = scale === o.key
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`글씨 ${o.label}`}
            title={`글씨 ${o.label}`}
            onClick={() => setPastorTextScale(o.key)}
            className={`${o.size} w-8 h-8 rounded-full font-bold leading-none flex items-center justify-center transition-colors ${
              active ? 'bg-brand text-white' : 'text-gray-600 dark:text-white/70 hover:text-brand'
            }`}
          >
            가
          </button>
        )
      })}
    </div>
  )
}

export default TextScaleToggle
