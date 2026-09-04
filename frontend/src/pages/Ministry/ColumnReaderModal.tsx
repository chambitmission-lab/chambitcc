import { useEffect, useRef, useState } from 'react'
import type { Column } from '../../types/column'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import andongProfile from '../../assets/andong.png'
import { renderHighlightedText } from './highlightMarkup'
import {
  FONT_STEPS,
  PEN,
  SERIF,
  buildShareText,
  formatLetterDate,
  loadFontStep,
  readingLabel,
  saveFontStep,
} from './letterFormat'

interface ColumnReaderModalProps {
  language: string
  /** 읽고 있는 편지 — 아멘 수는 캐시 쪽이 최신이므로 부모가 목록 캐시의 같은 편지를 넘긴다 */
  column: Column
  /** 이어 읽기 — 다음(더 최신)·이전(더 과거) */
  newerColumn: Column | null
  olderColumn: Column | null
  isAdminUser: boolean
  onClose: () => void
  onNavigate: (column: Column) => void
  onAmen: (column: Column) => void
  onEdit: (column: Column) => void
  onDeleteRequest: () => void
}

/** 편지 읽기 화면 — 진행 바·글자 크기·공유·아멘·이어 읽기. 관리자면 수정/삭제 메뉴. */
const ColumnReaderModal = ({
  language,
  column,
  newerColumn,
  olderColumn,
  isAdminUser,
  onClose,
  onNavigate,
  onAmen,
  onEdit,
  onDeleteRequest,
}: ColumnReaderModalProps) => {
  const [readProgress, setReadProgress] = useState(0)
  const [fontStep, setFontStep] = useState<number>(loadFontStep)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 모바일 뒤로가기 → 페이지 이탈 대신 이 모달만 닫기
  useModalBackButton(onClose)

  // 다른 편지로 이동할 때마다 진행 바·관리자 메뉴 초기화 (prop 변화에 맞춘 상태 조정)
  const [shownId, setShownId] = useState(column.id)
  if (column.id !== shownId) {
    setShownId(column.id)
    setReadProgress(0)
    setShowAdminMenu(false)
  }
  // 스크롤은 DOM이라 커밋 뒤에
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [column.id])

  // 상세 스크롤 → 상단 읽기 진행 바
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    setReadProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 1)
  }

  const cycleFontSize = () => {
    const next = (fontStep + 1) % FONT_STEPS.length
    setFontStep(next)
    saveFontStep(next)
  }

  // 공유 — 카톡 전달을 염두에 두고 편지 전문을 텍스트로
  const handleShare = async () => {
    const text = buildShareText(column, language)
    if (navigator.share) {
      try {
        // title은 넘기지 않는다 — 카톡 등 대다수 대상이 title+text를 이어 붙여
        // 보내서 이미 text 첫 줄에 있는 제목이 두 번 나온다
        await navigator.share({ text })
      } catch {
        /* 사용자가 공유 시트를 닫은 경우 */
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        showToast(language === 'ko' ? '편지 내용이 복사되었습니다' : 'Letter copied to clipboard', 'success')
      } catch {
        showToast(language === 'ko' ? '복사에 실패했습니다' : 'Failed to copy', 'error')
      }
    }
  }

  const renderNeighbor = (target: Column, label: string) => (
    <button onClick={() => onNavigate(target)} className="feed-card w-full rounded-2xl px-5 py-4 text-left group">
      <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.03em]">{label}</div>
      <div
        className="text-[15px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] mt-1.5 group-hover:text-[var(--brand)] transition-colors"
        style={{ fontFamily: SERIF }}
      >
        {target.title}
      </div>
      <div className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1">{formatLetterDate(target.date, language)}</div>
    </button>
  )

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        ref={scrollRef}
        className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md lg:max-w-2xl md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
        onClick={(e) => e.stopPropagation()}
        onScroll={handleScroll}
      >
        {/* 슬림 상단 바 — 읽기 진행 바 + 닫기/관리 메뉴만, 본문을 가리지 않게 */}
        <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
          <div
            className="absolute top-0 left-0 h-[2.5px] bg-[var(--brand)] transition-[width] duration-150 ease-out"
            style={{ width: `${readProgress * 100}%` }}
          ></div>
          <div className="flex items-center justify-between pl-5 pr-3 h-12">
            <span className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.04em]">
              {language === 'ko' ? '목양칼럼' : 'Pastoral Column'}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={cycleFontSize}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                aria-label={language === 'ko' ? '글자 크기 조절' : 'Adjust text size'}
                title={language === 'ko' ? '글자 크기' : 'Text size'}
              >
                <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">format_size</span>
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                aria-label={language === 'ko' ? '공유' : 'Share'}
                title={language === 'ko' ? '공유' : 'Share'}
              >
                <span className="material-icons-outlined text-[19px] text-gray-600 dark:text-gray-400">share</span>
              </button>
              {isAdminUser && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminMenu((v) => !v)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                    aria-label={language === 'ko' ? '관리' : 'Manage'}
                  >
                    <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">more_horiz</span>
                  </button>
                  {showAdminMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAdminMenu(false)}></div>
                      <div className="absolute right-0 top-10 z-20 w-36 py-1.5 rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-white/[0.1] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] overflow-hidden">
                        <button
                          onClick={() => onEdit(column)}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-ink-strong flex items-center gap-2.5 hover:bg-[var(--brand-soft)] transition-colors"
                        >
                          <span className="material-icons-outlined text-[18px] text-gray-500 dark:text-gray-400">edit</span>
                          <span>{language === 'ko' ? '수정' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowAdminMenu(false)
                            onDeleteRequest()
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <span className="material-icons-outlined text-[18px]">delete</span>
                          <span>{language === 'ko' ? '삭제' : 'Delete'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                aria-label="닫기"
              >
                <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* 편지 본문 */}
        <div className="px-6 pt-6 pb-12">
          {/* 오버라인 → 세리프 대제목 → 짧은 악센트 룰 */}
          <div className="text-[12.5px] text-gray-500 dark:text-gray-400">
            {formatLetterDate(column.date, language)}
            <span className="mx-1.5 opacity-60">·</span>
            {readingLabel(column.content, language, true)}
          </div>
          <h2
            className="text-[24px] font-semibold text-ink-strong tracking-[-0.01em] leading-[1.45] mt-3"
            style={{ fontFamily: SERIF }}
          >
            {column.title}
          </h2>
          <div className="w-8 h-[3px] rounded-full bg-[var(--brand-muted)] opacity-50 mt-6 mb-8"></div>

          {column.content.split('\n\n').map((paragraph, index) => (
            <p
              key={index}
              className="text-gray-700 dark:text-gray-300 leading-[1.95] mb-7"
              style={{ fontFamily: SERIF, fontSize: `${FONT_STEPS[fontStep]}px` }}
            >
              {renderHighlightedText(paragraph)}
            </p>
          ))}

          {/* 서명 — 편지의 맺음 */}
          <div className="mt-12 pt-7 border-t border-border-light dark:border-white/[0.06] flex items-center gap-4">
            <img
              src={andongProfile}
              alt={column.author}
              className="w-12 h-12 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12] flex-shrink-0"
            />
            <div className="min-w-0">
              {language === 'ko' ? (
                <div className="text-[26px] leading-none text-ink-strong" style={{ fontFamily: PEN }}>
                  {column.author} 드림
                </div>
              ) : (
                <div className="text-[17px] italic leading-none text-ink-strong" style={{ fontFamily: SERIF }}>
                  {column.author}
                </div>
              )}
              <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">{column.role}</div>
            </div>
          </div>

          {/* 아멘 — 편지를 다 읽고 조용히 화답하는 자리 (좋아요가 아니라 응답) */}
          <div className="mt-9 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onAmen(column)}
              aria-pressed={!!column.is_amened}
              className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold border transition-all active:scale-95 ${
                column.is_amened
                  ? 'seal-chip bg-brand border-transparent text-white [--seal-drop:0_2px_10px_var(--brand-glow)]'
                  : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 hover:border-brand hover:text-brand'
              }`}
            >
              <HandHeartIcon size={16} strokeWidth={1.9} filled={!!column.is_amened} />
              <span>
                {language === 'ko'
                  ? column.is_amened
                    ? '아멘으로 함께했어요'
                    : '아멘으로 화답하기'
                  : column.is_amened
                    ? 'Amen shared'
                    : 'Say Amen'}
              </span>
              {(column.amen_count ?? 0) > 0 && (
                <span className={column.is_amened ? 'text-white/90' : 'text-brand'}>{column.amen_count}</span>
              )}
            </button>
          </div>

          {/* 이어 읽기 — 편지를 다 읽은 흐름 그대로 다음 글로 */}
          {(olderColumn || newerColumn) && (
            <div className="mt-10 space-y-3">
              {olderColumn && renderNeighbor(olderColumn, language === 'ko' ? '이전 편지' : 'Previous letter')}
              {newerColumn && renderNeighbor(newerColumn, language === 'ko' ? '다음 편지' : 'Next letter')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ColumnReaderModal
