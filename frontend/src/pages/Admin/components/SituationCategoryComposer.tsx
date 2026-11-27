// 상황별 성구 — 상황(카테고리) 만들기·고치기 모달(관리자 작성 모달 PC 2단 표준, AdminComposerShell)
//   좌: 이름·아이콘·색 + 미리보기 / 우: 추천 연결(감정·키워드·기본)·순서·공개
// (2026-11-27 SituationManagement 안에 있던 CategoryForm 을 옮겨 왔다. 구절은 상세 화면에서 바로 고친다)
import { useState, type ReactNode } from 'react'
import type { SituationCategory, SituationCategoryCreate } from '../../../types/situation'
import AdminComposerShell from './AdminComposerShell'
import { COLOR_OPTIONS, EMOTION_OPTIONS, ICON_OPTIONS } from './situationDeskUtils'

interface Props {
  editing: SituationCategory | null
  /** 새로 만들 때 기본 순서(맨 뒤) */
  nextOrder: number
  pending: boolean
  onClose: () => void
  onSave: (payload: SituationCategoryCreate) => void
}

const Label = ({ children, hint }: { children: ReactNode; hint?: string }) => (
  <div className="mb-2">
    <p className="text-[14px] font-bold text-ink-strong">{children}</p>
    {hint && <p className="mt-0.5 text-[12.5px] leading-[1.5] text-gray-500 dark:text-white/50 break-keep">{hint}</p>}
  </div>
)

const Toggle = ({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) => (
  <button type="button" onClick={onClick} role="switch" aria-checked={on} className="w-full flex items-center gap-3 text-left">
    <span className="flex-1 min-w-0">
      <span className="block text-[14px] font-bold text-ink-strong">{label}</span>
      <span className="block text-[12.5px] leading-[1.5] text-gray-500 dark:text-white/50 break-keep">{hint}</span>
    </span>
    <span className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}>
      <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
    </span>
  </button>
)

const inputCls =
  'w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[15px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const SituationCategoryComposer = ({ editing, nextOrder, pending, onClose, onSave }: Props) => {
  const [name, setName] = useState(editing?.name ?? '')
  const [icon, setIcon] = useState(editing?.icon ?? 'favorite_border')
  const [color, setColor] = useState(editing?.color ?? COLOR_OPTIONS[0])
  const [order, setOrder] = useState(editing?.order ?? nextOrder)
  const [isActive, setIsActive] = useState(editing?.is_active ?? true)
  const [isDefault, setIsDefault] = useState(editing?.is_default ?? false)
  const [emotions, setEmotions] = useState<string[]>(editing?.emotion_keys ?? [])
  const [keywords, setKeywords] = useState((editing?.keywords ?? []).join(', '))

  const kwList = keywords.split(',').map((k) => k.trim()).filter(Boolean)
  const canSave = name.trim().length > 0 && !pending

  const save = () => {
    if (!canSave) return
    onSave({ name: name.trim(), icon, color, order, is_active: isActive, is_default: isDefault, emotion_keys: emotions, keywords: kwList })
  }

  return (
    <AdminComposerShell
      title={editing ? '상황 고치기' : '새 상황'}
      onClose={onClose}
      width="lg"
      closeOnBackdrop={false}
      footer={
        <div className="shrink-0 px-5 lg:px-7 py-4 border-t border-border-light dark:border-border-dark flex gap-2">
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14.5px] font-bold disabled:opacity-40 transition"
          >
            {pending ? '저장 중…' : editing ? '저장' : '만들기'}
          </button>
        </div>
      }
      columns={[
        <>
          <div>
            <Label>상황 이름</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 두려울 때" maxLength={40} className={inputCls} />
          </div>

          <div>
            <Label>아이콘</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  aria-pressed={icon === ic}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
                    icon === ic ? 'border-brand bg-[var(--brand-soft-strong)]' : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="material-icons-round text-[20px] text-gray-700 dark:text-white/70">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>색</Label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  aria-pressed={color === c}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-[3px] ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e] scale-110' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] p-4">
            <span className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${color}22` }}>
              <span className="material-icons-round text-[26px]" style={{ color }}>
                {icon}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-bold text-ink-strong truncate">{name || '이름 없음'}</span>
              <span className="block text-[12.5px] text-gray-500 dark:text-white/50">관리 목록에 이렇게 보여요</span>
            </span>
          </div>
        </>,
        <>
          <div>
            <Label hint="성도가 기도에 이 감정을 붙이면 이 상황의 구절이 1순위로 추천돼요. 여러 개 골라도 돼요.">연결할 감정</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTION_OPTIONS.map((o) => {
                const on = emotions.includes(o.key)
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setEmotions((l) => (on ? l.filter((k) => k !== o.key) : [...l, o.key]))}
                    aria-pressed={on}
                    className={`h-9 px-3.5 rounded-full text-[13.5px] font-semibold transition ${
                      on ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label hint="기도 제목·내용에 이 단어가 들어 있으면 추천돼요(2순위). 쉼표로 나눠요. '두려'처럼 앞부분만 쓰면 두려워·두려움 다 잡혀요.">키워드</Label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="예) 두려, 무서, 겁이" className={inputCls} />
            {kwList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kwList.map((k) => (
                  <span key={k} className="inline-flex items-center h-7 px-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-semibold">
                    “{k}”
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.06]">
            <div className="p-4">
              <Toggle on={isDefault} onClick={() => setIsDefault((v) => !v)} label="기본 상황" hint="감정·키워드가 하나도 안 맞는 기도에 이 상황의 구절을 써요(3순위)." />
            </div>
            <div className="p-4">
              <Toggle on={isActive} onClick={() => setIsActive((v) => !v)} label="성도에게 보이기" hint="끄면 상황별 말씀 화면과 기도 묵상 추천에서 빠져요." />
            </div>
            <div className="p-4 flex items-center gap-3">
              <span className="flex-1">
                <span className="block text-[14px] font-bold text-ink-strong">목록 순서</span>
                <span className="block text-[12.5px] text-gray-500 dark:text-white/50">작을수록 앞에 와요</span>
              </span>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(+e.target.value)}
                className="w-20 h-10 px-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[15px] text-ink-strong tabular-nums text-right focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </>,
      ]}
    />
  )
}

export default SituationCategoryComposer
