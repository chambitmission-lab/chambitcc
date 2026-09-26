// 한/영 짝 입력 — 한국어가 기본, 영문은 EN 버튼으로 펼친다(선택 입력, 비우면 화면에서 한국어로 폴백).
// PC에선 펼친 영문을 한국어 옆에 나란히 놓아 번역하며 대조하기 쉽게 한다.
// 교육·헌금·담임목사·인물 작성 모달이 같은 컴포넌트를 쓴다.
import { useState } from 'react'
import { inputCls } from './AdminFormBits'

export type Bilingual = { ko: string; en: string }

interface BilingualFieldProps {
  label: string
  required?: boolean
  value: Bilingual
  onChange: (next: Bilingual) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  hint?: string
  /** PC에서 긴 원고 칸을 넉넉히 — 예) 'lg:min-h-[380px]' (multiline 전용) */
  lgMinH?: string
  /** 자주 쓰는 값을 한 번에 넣는 칩 — 직분·그룹처럼 같은 문자열을 수십 번 치는 칸의 오타를 줄인다 */
  presets?: string[]
}

const BilingualField = ({
  label,
  required,
  value,
  onChange,
  multiline,
  rows = 4,
  placeholder,
  hint,
  lgMinH = '',
  presets,
}: BilingualFieldProps) => {
  // 영문이 이미 입력돼 있으면 펼친 채로 시작한다(수정 시 값이 숨겨지면 안 된다)
  const [showEn, setShowEn] = useState(value.en.trim().length > 0)

  const render = (lang: 'ko' | 'en') =>
    multiline ? (
      <textarea
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        rows={rows}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={`${inputCls} resize-none leading-[1.7] ${lgMinH}`}
      />
    ) : (
      <input
        type="text"
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={inputCls}
      />
    )

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
        {required && <span className="text-brand text-[12px] font-bold">*</span>}
        <button
          type="button"
          onClick={() => setShowEn((prev) => !prev)}
          className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
            showEn
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-400 dark:text-white/35 hover:text-brand hover:bg-[var(--brand-soft)]'
          }`}
        >
          EN
        </button>
      </div>
      {/* PC에선 한국어·영어를 좌우로 나란히 — 번역하며 대조하기 쉽게 */}
      <div className={showEn ? 'lg:grid lg:grid-cols-2 lg:gap-3 lg:items-start' : ''}>
        {render('ko')}
        {showEn && <div className="mt-1.5 lg:mt-0">{render('en')}</div>}
      </div>
      {presets && presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ ...value, ko: preset })}
              className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                value.ko === preset
                  ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
                  : 'bg-transparent border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:bg-[var(--brand-soft)]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
      {hint && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">{hint}</p>}
    </div>
  )
}

export default BilingualField
