// "/말씀" 미리보기 패널 — 상태 계산은 verseSlash.ts
import { formatReference } from '../../../Sermon/utils/sermonMeta'
import { MAX_SLASH_VERSES, type SlashState } from './verseSlash'

interface VerseSlashPanelProps {
  state: SlashState
  ko: boolean
  onInsert: () => void
  onDismiss: () => void
}

/** 작성 칸 바로 아래에 뜨는 말씀 미리보기. 버튼은 mousedown 기본동작을 막아 textarea 포커스를 지킨다 */
export const VerseSlashPanel = ({ state, ko, onInsert, onDismiss }: VerseSlashPanelProps) => {
  const keep = (e: React.MouseEvent) => e.preventDefault()

  let body: React.ReactNode
  switch (state.kind) {
    case 'hint':
      body = (
        <p className="text-[12.5px] lg:text-[16px] text-ink-muted leading-relaxed">
          {state.books.length > 0 ? (
            <>
              <b className="text-ink-strong font-semibold">{state.books.join(' · ')}</b>
              {ko ? ' — 장:절을 이어서 적어 주세요' : ' — add chapter:verse'}
            </>
          ) : ko ? (
            <>
              넣고 싶은 말씀을 적어 주세요 <span className="text-ink-strong font-semibold">예: 창 1:1 · 요 3:16-18</span>
            </>
          ) : (
            <>
              Type a reference <span className="text-ink-strong font-semibold">e.g. 창 1:1 · 요 3:16-18</span>
            </>
          )}
        </p>
      )
      break
    case 'unknown-book':
      body = (
        <p className="text-[12.5px] lg:text-[16px] text-ink-muted">
          {ko ? `‘${state.book}’ 책을 찾지 못했어요` : `Couldn’t find the book ‘${state.book}’`}
        </p>
      )
      break
    case 'need-verse':
      body = (
        <p className="text-[12.5px] lg:text-[16px] text-ink-muted">
          {ko
            ? `${state.ref.book} ${state.ref.chapter}장 — 몇 절인지도 적어 주세요 (예: ${state.ref.book} ${state.ref.chapter}:1)`
            : `${state.ref.book} ${state.ref.chapter} — add a verse number`}
        </p>
      )
      break
    case 'loading':
      body = (
        <p className="text-[12.5px] lg:text-[16px] text-ink-muted animate-pulse">
          {ko ? '말씀을 찾고 있어요…' : 'Looking up the verse…'}
        </p>
      )
      break
    case 'not-found':
      body = (
        <p className="text-[12.5px] lg:text-[16px] text-ink-muted">
          {ko ? `${formatReference(state.ref)} 말씀이 없어요` : `${formatReference(state.ref)} not found`}
        </p>
      )
      break
    case 'ready':
      body = (
        <button
          type="button"
          onMouseDown={keep}
          onClick={onInsert}
          className="w-full text-left group"
        >
          <span className="block text-[12px] lg:text-[15px] font-bold text-brand mb-0.5">{state.label}</span>
          <span className="block text-[13.5px] lg:text-[17px] leading-[1.6] text-ink-strong line-clamp-3">
            {state.text}
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] lg:text-[14.5px] font-semibold text-ink-muted group-hover:text-brand">
            <span className="material-icons-outlined text-[14px] lg:text-[18px]">add</span>
            {ko ? 'Enter 또는 눌러서 넣기' : 'Press Enter or tap to insert'}
            {state.clipped && (ko ? ` · 최대 ${MAX_SLASH_VERSES}절까지` : ` · up to ${MAX_SLASH_VERSES} verses`)}
          </span>
        </button>
      )
      break
  }

  return (
    <div
      className="mt-2 flex items-start gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--brand-soft)] px-3.5 py-2.5 lg:px-5 lg:py-4"
      role="status"
      aria-live="polite"
    >
      <span className="material-icons-outlined text-[18px] lg:text-[22px] text-brand mt-0.5">menu_book</span>
      <div className="flex-1 min-w-0">{body}</div>
      <button
        type="button"
        onMouseDown={keep}
        onClick={onDismiss}
        aria-label={ko ? '말씀 찾기 닫기' : 'Close verse lookup'}
        className="shrink-0 w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full text-ink-muted hover:text-brand"
      >
        <span className="material-icons-outlined text-[16px] lg:text-[20px]">close</span>
      </button>
    </div>
  )
}
