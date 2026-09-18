// 누군가의 기도 — 익명 편지
//
// 쓰는 쪽: 이번 달 기도하는 분께 한 통. 주기가 끝나는 아침(새 짝이 정해지는 시각)에
//          보낸 사람 없이 도착한다. 도착 전까지는 고치거나 지울 수 있다.
// 받는 쪽: 도착한 편지함. 편지지에는 "누군가"만 적힌다 — 이름도, 쓴 날짜도 없다.
//
// 음성·사진은 받지 않는다 (목소리·얼굴이 곧 이름이다). 텍스트만.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { IntercessionLetter, IntercessionTarget } from '../../api/intercession'
import {
  useDeleteIntercessionLetter,
  useIntercessionLetters,
  useReadIntercessionLetter,
  useReportIntercessionLetter,
  useSaveIntercessionLetter,
} from '../../hooks/useIntercession'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { confirmDialog } from '../../utils/confirmDialog'
import { toastFeedback } from '../../utils/toast'
import { cycleMonthLabel, formatDay } from './intercessionDates'
import { FlameGlyph } from './intercessionUi'

const LETTER_MAX = 500
const LETTER_MIN = 5

const EnvelopeGlyph = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="m3.8 6.6 8.2 6.2 8.2-6.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)

/** 하단 시트 셸 — 모바일은 아래에서 올라오고, PC 는 가운데 카드 */
const Sheet = ({
  onClose,
  label,
  children,
}: {
  onClose: () => void
  label: string
  children: React.ReactNode
}) => {
  useModalBackButton(onClose)
  // 데스크톱에서 Esc — 모바일 뒤로가기는 useModalBackButton 이 맡는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="ic-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="ic-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ic-sheet__handle" aria-hidden />
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ── 쓰는 쪽 ──────────────────────────────────────────────────────────────

const LetterComposer = ({ target, onClose }: { target: IntercessionTarget; onClose: () => void }) => {
  const existing = target.letter
  const [body, setBody] = useState(existing?.body ?? '')
  const save = useSaveIntercessionLetter(
    toastFeedback({ success: '편지를 봉인해 두었어요', error: '편지를 저장하지 못했습니다' }),
  )
  const remove = useDeleteIntercessionLetter(
    toastFeedback({ success: '편지를 지웠어요', error: '편지를 지우지 못했습니다' }),
  )
  const trimmed = body.trim()
  const deliverOn = existing?.deliver_on

  const onDelete = async () => {
    const ok = await confirmDialog({
      title: '편지 지우기',
      message: '봉인해 둔 편지를 지울까요?',
      confirmText: '지우기',
      tone: 'danger',
    })
    if (ok) remove.mutate(undefined, { onSuccess: onClose })
  }

  return (
    <Sheet onClose={onClose} label="익명 편지 쓰기">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-brand">
        <EnvelopeGlyph size={15} />
        익명 편지
      </p>
      <h2 className="mt-1.5 text-[19px] font-extrabold text-ink-strong tracking-[-0.02em] break-keep">
        {target.display_name} 님께
      </h2>
      <ul className="mt-2.5 space-y-1 text-[12.5px] leading-relaxed text-[var(--text-muted)] break-keep">
        <li>· 이번 달이 끝나는 아침, 보낸 사람 없이 &lsquo;누군가&rsquo;의 편지로 도착해요.</li>
        <li>· 이름이나 누구인지 짐작되는 이야기는 적지 말아 주세요.</li>
        <li>· 도착하기 전까지는 언제든 고치거나 지울 수 있어요.</li>
      </ul>

      <div className="ic-paper mt-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, LETTER_MAX))}
          rows={8}
          autoFocus={!existing}
          placeholder={'이번 달 기도하며 품었던 마음을 전해 주세요.\n예) 한 달 동안 당신의 이름을 부르며 기도했어요…'}
          className="ic-paper__input"
        />
        <p className="ic-paper__sign">
          <FlameGlyph size={13} /> 누군가
        </p>
      </div>
      <p className="mt-1.5 text-right text-[11.5px] tabular-nums text-[var(--text-muted)]">
        {body.length}/{LETTER_MAX}
      </p>

      <div className="mt-3 flex gap-2">
        {existing ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={remove.isPending}
            className="h-12 px-4 rounded-2xl border border-gray-200 dark:border-white/10 text-[14px] font-semibold text-[var(--text-muted)]"
          >
            지우기
          </button>
        ) : null}
        <button
          type="button"
          disabled={trimmed.length < LETTER_MIN || save.isPending || trimmed === existing?.body}
          onClick={() => save.mutate(trimmed, { onSuccess: onClose })}
          className="flex-1 h-12 rounded-2xl bg-[var(--brand)] text-[var(--on-brand)] text-[15px] font-bold shadow-[0_8px_20px_-10px_rgba(49,130,246,0.8)] disabled:opacity-50"
        >
          {save.isPending ? '봉인하는 중…' : existing ? '고친 편지 봉인하기' : '편지 봉인하기'}
        </button>
      </div>
      {deliverOn ? (
        <p className="mt-2 text-center text-[11.5px] text-[var(--text-muted)]">{formatDay(deliverOn)} 아침에 도착해요</p>
      ) : null}
    </Sheet>
  )
}

/** 기도할 분 카드 안 — 편지 쓰기 / 봉인된 편지 미리보기 */
export const LetterEntry = ({ target, deliverOn }: { target: IntercessionTarget; deliverOn: string }) => {
  const [open, setOpen] = useState(false)
  const letter = target.letter
  return (
    <>
      {letter ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 w-full text-left rounded-xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-3.5 py-3"
        >
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-brand">
            <EnvelopeGlyph size={14} />
            봉인해 둔 편지 · {formatDay(deliverOn)} 아침 도착
          </span>
          <span className="mt-1 block text-[13px] leading-relaxed text-[var(--text-body)] line-clamp-2 whitespace-pre-line">
            {letter.body}
          </span>
          <span className="mt-1 block text-[12px] font-bold text-brand">고치기</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 w-full h-11 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1.5 text-[13.5px] font-bold text-[var(--text-body)] hover:border-[var(--brand-soft-strong)] hover:text-brand transition-colors"
        >
          <EnvelopeGlyph size={16} />
          {target.display_name} 님께 익명 편지 남기기
        </button>
      )}
      {open ? <LetterComposer target={target} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

// ── 받는 쪽 ──────────────────────────────────────────────────────────────

const LetterView = ({ letter, onClose }: { letter: IntercessionLetter; onClose: () => void }) => {
  const report = useReportIntercessionLetter(
    toastFeedback({ success: '신고했어요. 편지는 숨겨졌어요', error: '신고하지 못했습니다' }),
  )
  const onReport = async () => {
    const ok = await confirmDialog({
      title: '이 편지를 신고할까요?',
      message: '편지는 바로 숨겨지고, 운영자가 확인해요.\n보낸 분께는 신고 사실이 알려지지 않아요.',
      confirmText: '신고하기',
      tone: 'warning',
    })
    if (ok) report.mutate({ id: letter.id, reason: null }, { onSuccess: onClose })
  }

  return (
    <Sheet onClose={onClose} label="도착한 편지">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-brand">
        <EnvelopeGlyph size={15} />
        {cycleMonthLabel(letter.month_start)}, 당신을 위해 기도한 누군가의 편지
      </p>
      <div className="ic-paper ic-paper--read mt-3">
        <p className="ic-paper__body">{letter.body}</p>
        <p className="ic-paper__sign">
          <FlameGlyph size={13} /> 누군가
        </p>
      </div>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-[var(--text-muted)] break-keep">
        누가 썼는지는 알 수 없어요. 한 달 동안 당신을 위해 기도한 분이에요.
      </p>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => void onReport()}
          disabled={report.isPending}
          className="text-[12px] font-semibold text-[var(--text-muted)] underline underline-offset-4"
        >
          신고하기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-5 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-[13.5px] font-bold"
        >
          닫기
        </button>
      </div>
    </Sheet>
  )
}

/** 도착한 편지함 — 편지가 한 통이라도 있을 때만 보인다 */
export const LetterInbox = ({ enabled }: { enabled: boolean }) => {
  const { data } = useIntercessionLetters(enabled)
  const read = useReadIntercessionLetter()
  const [opened, setOpened] = useState<IntercessionLetter | null>(null)

  if (!data || data.items.length === 0) return null

  const open = (letter: IntercessionLetter) => {
    setOpened(letter)
    if (!letter.is_read) read.mutate(letter.id)
  }

  return (
    <section className="mx-4 mt-3 rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none">
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="text-[14.5px] font-extrabold text-ink-strong tracking-[-0.02em]">도착한 편지</h3>
        {data.unread > 0 ? (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[var(--brand)] text-[var(--on-brand)] tabular-nums">
            {data.unread}
          </span>
        ) : null}
      </div>
      <ul className="space-y-2">
        {data.items.map((letter) => (
          <li key={letter.id}>
            <button
              type="button"
              onClick={() => open(letter)}
              className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left border transition-colors ${
                letter.is_read
                  ? 'border-gray-100 dark:border-white/[0.06]'
                  : 'border-[var(--brand-soft-strong)] bg-[var(--brand-soft)]'
              }`}
            >
              <span
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                  letter.is_read ? 'bg-gray-100 dark:bg-white/[0.05] text-[var(--text-muted)]' : 'bg-white dark:bg-white/10 text-brand'
                }`}
              >
                <EnvelopeGlyph size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-bold text-ink-strong">
                  {cycleMonthLabel(letter.month_start)}, 누군가의 편지
                </span>
                <span className="block text-[12px] text-[var(--text-muted)] truncate">
                  {letter.is_read ? letter.body.replace(/\s+/g, ' ') : '아직 열어 보지 않았어요'}
                </span>
              </span>
              {!letter.is_read ? <span className="shrink-0 w-2 h-2 rounded-full bg-[var(--brand)]" aria-label="새 편지" /> : null}
            </button>
          </li>
        ))}
      </ul>
      {opened ? <LetterView letter={opened} onClose={() => setOpened(null)} /> : null}
    </section>
  )
}
