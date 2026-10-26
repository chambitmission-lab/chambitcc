import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { UsersIcon } from '../../../../components/icons/ActionIcons'

export const REFLECTION_MAX = 1000

/**
 * 생각 열쇠 — 빈 칸 앞에서 막히지 않도록 첫 마디를 건네는 칩 (5-Minute Journal 의 문장 시작어,
 * 인스타 질문 스티커와 같은 역할). 누르면 문장 시작어가 입력창에 들어가고 커서가 그 뒤에 선다.
 * 본문은 평범한 문장으로 저장된다 — 마커가 없으니 배너·알림 미리보기에 날것으로 보여도 자연스럽다.
 */
const THOUGHT_KEYS: { label: string; starter: string; placeholder: string }[] = [
  { label: '마음에 걸린 한 단어', starter: '오늘 마음에 걸린 단어는 ', placeholder: '위 말씀에서 단어를 눌러도 들어가요' },
  { label: '내 상황이라면', starter: '지금 내 상황에 비춰 보면, ', placeholder: '요즘 내 하루와 닿는 지점을 적어 보세요' },
  { label: '감사한 것', starter: '이 말씀 앞에서 감사한 건 ', placeholder: '작은 것이어도 좋아요' },
  { label: '기도로 바꾸기', starter: '주님, ', placeholder: '말씀을 짧은 기도로 바꿔 보세요' },
  { label: '솔직한 질문', starter: '솔직히 잘 모르겠는 건 ', placeholder: '물음표도 좋은 묵상이에요' },
  { label: '한 줄 요약', starter: '한 줄로 줄이면, ', placeholder: '나만의 말로 한 문장' },
]

const DEFAULT_PLACEHOLDER = '짧아도 괜찮아요. 마음에 남은 한 줄이면 충분해요.'

export interface ReflectionComposerHandle {
  /** 끝에 글을 붙이고 커서를 그 뒤로 — 말씀 단어 인용·생각 열쇠가 쓴다 */
  append: (text: string) => void
}

interface ReflectionComposerProps {
  draft: string
  onDraftChange: (next: string) => void
  activeKey: number | null
  onActiveKeyChange: (index: number | null) => void
  pending: boolean
  onSubmit: () => void
}

/** 묵상 작성 카드 — 생각 열쇠 칩 · 자라는 입력창 · 실명 안내 · 나누기 */
const ReflectionComposer = forwardRef<ReflectionComposerHandle, ReflectionComposerProps>(
  ({ draft, onDraftChange, activeKey, onActiveKeyChange, pending, onSubmit }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const focusEnd = (value: string) => {
      requestAnimationFrame(() => {
        const el = inputRef.current
        if (!el) return
        el.focus({ preventScroll: true })
        el.setSelectionRange(value.length, value.length)
      })
    }

    const append = (text: string) => {
      const base = draft.replace(/\s+$/, '')
      // 빈 칸이면 그대로, 문장 중간이면 한 칸 띄워 붙인다
      const next = (base ? `${base} ${text}` : text).slice(0, REFLECTION_MAX)
      onDraftChange(next)
      focusEnd(next)
    }
    useImperativeHandle(ref, () => ({ append }))

    const pickKey = (index: number) => {
      const key = THOUGHT_KEYS[index]
      onActiveKeyChange(index)
      const base = draft.trim()
      if (base.startsWith(key.starter.trim())) {
        focusEnd(draft)
        return
      }
      // 아직 아무것도 안 썼거나 다른 시작어만 있으면 갈아 끼우고, 쓴 글이 있으면 줄을 바꿔 잇는다
      const onlyStarter = THOUGHT_KEYS.some((k) => base === k.starter.trim())
      const next = (!base || onlyStarter ? key.starter : `${base}\n${key.starter}`).slice(0, REFLECTION_MAX)
      onDraftChange(next)
      focusEnd(next)
    }

    // 글이 늘면 입력창도 함께 자란다 (최대 높이 이후엔 내부 스크롤)
    useLayoutEffect(() => {
      const el = inputRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 240)}px`
    }, [draft])

    const length = draft.length
    const canSubmit = draft.trim().length > 0 && !pending
    const nearLimit = length > REFLECTION_MAX * 0.9

    return (
      <section className="rt-composer" aria-label="묵상 나누기">
        <div className="rt-composer__keys" role="list" aria-label="생각 열쇠">
          {THOUGHT_KEYS.map((k, i) => (
            <button
              key={k.label}
              type="button"
              role="listitem"
              className={`rt-key ${activeKey === i ? 'rt-key--on' : ''}`}
              onClick={() => pickKey(i)}
            >
              {k.label}
            </button>
          ))}
        </div>

        <textarea
          ref={inputRef}
          className="rt-composer__input"
          value={draft}
          rows={3}
          maxLength={REFLECTION_MAX}
          placeholder={activeKey != null ? THOUGHT_KEYS[activeKey].placeholder : DEFAULT_PLACEHOLDER}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
              e.preventDefault()
              onSubmit()
            }
          }}
        />

        <div className="rt-composer__foot">
          <span className="rt-composer__who">
            <UsersIcon size={13} />
            함께 읽는 성도들에게 실명으로 전해져요
          </span>
          {length > 0 && (
            <span className={`rt-composer__count ${nearLimit ? 'rt-composer__count--warn' : ''}`}>
              {length}/{REFLECTION_MAX}
            </span>
          )}
          <button type="button" className="rt-composer__send" onClick={onSubmit} disabled={!canSubmit}>
            {pending ? '전하는 중…' : '나누기'}
          </button>
        </div>
      </section>
    )
  },
)
ReflectionComposer.displayName = 'ReflectionComposer'

export default ReflectionComposer
