import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { BibleBook } from '../../../types/bible'

interface BookQuickPickerProps {
  books: BibleBook[]
  /** 현재 보고 있는 책 — 하이라이트 + 시트를 열 때 그 위치로 스크롤 */
  currentBookNumber?: number
  onPick: (book: BibleBook) => void
  onClose: () => void
}

/**
 * 책 퀵 전환 바텀시트.
 * 검색 결과의 책 헤더를 탭하면 열린다 — 검색창을 지우고 다시 타이핑하는 대신
 * 구약/신약 전체 책을 세로 스크롤로 훑어 한 번에 갈아탈 수 있다.
 */
const BookQuickPicker = ({ books, currentBookNumber, onPick, onClose }: BookQuickPickerProps) => {
  const { language } = useLanguage()
  // 뒤로가기 → 시트만 닫기
  useModalBackButton(onClose)

  const currentRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    // 66권 목록에서 현재 책부터 보이게 — 주변 책(같은 시대/장르)으로 이동하는 동선이 가장 잦다
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const t =
    language === 'ko'
      ? { title: '다른 책 보기', subtitle: '탭 한 번으로 바로 이동', old: '구약', new: '신약', close: '닫기', chapters: '장' }
      : { title: 'Switch book', subtitle: 'Jump with one tap', old: 'Old Testament', new: 'New Testament', close: 'Close', chapters: 'ch' }

  const sections: { key: 'OLD' | 'NEW'; label: string }[] = [
    { key: 'OLD', label: t.old },
    { key: 'NEW', label: t.new },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[82vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500/15 to-pink-500/10 text-purple-600 dark:text-purple-300 shrink-0">
            <span className="material-icons-round text-[22px]">auto_stories</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {t.title}
            </h3>
            <p className="text-gray-500 dark:text-white/45 text-[12px]">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors shrink-0"
            aria-label={t.close}
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 책 목록 — 구약/신약 섹션 + 3열 그리드 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {sections.map(({ key, label }) => {
            const sectionBooks = books.filter(b => b.testament === key)
            if (sectionBooks.length === 0) return null
            return (
              <div key={key}>
                <p className="px-1 mb-2 text-[11.5px] font-bold tracking-[0.08em] text-purple-600/80 dark:text-purple-300/80">
                  {label}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {sectionBooks.map(book => {
                    const isCurrent = book.book_number === currentBookNumber
                    return (
                      <button
                        key={book.book_number}
                        ref={isCurrent ? currentRef : undefined}
                        type="button"
                        onClick={() => onPick(book)}
                        aria-current={isCurrent ? 'true' : undefined}
                        className={`flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors border ${
                          isCurrent
                            ? 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_14px_rgba(168,85,247,0.35)]'
                            : 'border-black/[0.06] dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-800 dark:text-white/85 hover:border-purple-400/60 hover:text-purple-600 dark:hover:text-purple-300'
                        }`}
                      >
                        <span className="w-full truncate text-[13px] font-semibold leading-tight">
                          {book.book_name_ko}
                        </span>
                        <span
                          className={`text-[10.5px] leading-none ${
                            isCurrent ? 'text-white/80' : 'text-gray-400 dark:text-white/40'
                          }`}
                        >
                          {book.chapter_count}
                          {t.chapters}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default BookQuickPicker
