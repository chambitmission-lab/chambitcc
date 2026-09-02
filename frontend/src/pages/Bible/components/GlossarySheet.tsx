import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { GLOSSARY_TYPE_LABEL, type GlossaryEntry } from '../data/bibleGlossary'
import { parseBibleReference } from '../../Sermon/utils/sermonMeta'

const TYPE_ICON: Record<GlossaryEntry['type'], string> = {
  person: 'person',
  place: 'place',
  title: 'workspace_premium',
  term: 'menu_book',
  archaic: 'spellcheck',
  loanword: 'translate',
}

/**
 * 인물·지명 사전 칩을 탭했을 때 열리는 가벼운 하단 시트.
 * 단어장 시트(WordNoteSheet)와 같은 문법의 축소판 — 읽기 흐름을 끊지 않게
 * 한 줄 설명과 대표 구절만 보여주고 바로 닫는다.
 */
const GlossarySheet = ({ entry, onClose }: { entry: GlossaryEntry; onClose: () => void }) => {
  useModalBackButton(onClose)
  const navigate = useNavigate()

  // "창세기 12:15" → 책 번호/장/절 — 해석되면 대표 구절 줄이 이동 버튼이 된다
  const firstRef = useMemo(() => {
    const parsed = parseBibleReference(entry.first)
    return parsed?.bookNumber ? parsed : null
  }, [entry.first])

  const goToFirstRef = () => {
    if (!firstRef?.bookNumber) return
    onClose()
    navigate(
      `/bible/${firstRef.bookNumber}/${firstRef.chapter}${firstRef.verse ? `?verse=${firstRef.verse}` : ''}`
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-sm bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />
        <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
              <span className="material-icons-round text-[22px]">{TYPE_ICON[entry.type]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">
                {GLOSSARY_TYPE_LABEL[entry.type]}
              </p>
              <h3 className="text-ink-strong text-[18px] font-bold tracking-[-0.015em] truncate">
                {entry.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>

          <p className="mt-4 text-[14.5px] leading-relaxed text-ink break-keep">{entry.desc}</p>

          {firstRef ? (
            <button
              type="button"
              onClick={goToFirstRef}
              className="mt-4 w-full flex items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--brand-soft-strong)]"
            >
              <span className="material-icons-round text-[17px] text-brand shrink-0">auto_stories</span>
              <span className="min-w-0 flex-1 text-[12.5px] font-bold text-brand">
                대표 구절 — {entry.first}
              </span>
              <span className="material-icons-round text-[18px] text-brand shrink-0">chevron_right</span>
            </button>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span className="material-icons-round text-[15px] text-brand">auto_stories</span>
              대표 구절 — {entry.first}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GlossarySheet
