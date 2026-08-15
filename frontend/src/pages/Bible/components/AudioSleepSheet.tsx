import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface AudioSleepSheetProps {
  bookName: string
  currentChapter: number
  totalChapters: number
  /** 남은 수면 타이머(ms). 미설정이면 null */
  sleepRemainingMs: number | null
  /** 분 단위 타이머 설정. null이면 해제 */
  onSetSleepMinutes: (minutes: number | null) => void
  /** 듣기 종료 장. 미설정이면 null */
  endChapter: number | null
  /** 종료 장 설정. null이면 해제(책 끝까지 기존 연속 재생 그대로) */
  onSetEndChapter: (chapter: number | null) => void
  onClose: () => void
}

const TIMER_OPTIONS = [5, 10, 15, 30, 60]

const formatRemain = (ms: number): string => {
  if (ms < 60_000) return `${Math.max(1, Math.ceil(ms / 1000))}초`
  return `${Math.ceil(ms / 60_000)}분`
}

/**
 * 잠들기 전 듣기 설정 바텀시트 — 수면 타이머 + 듣기 범위(어느 장까지).
 *
 * 장 선택 시트(ChapterPickerSheet)의 시각 문법(.chapter-sheet, .ch-cell,
 * .chapter-jump)을 그대로 빌려 쓴다: 잠자리에서 한 손으로 조작하는 화면이라
 * 새 문법을 익힐 필요 없이 이미 아는 그리드로 "○장까지"를 짚게 한다.
 *
 * 시트는 설정을 골라도 닫히지 않는다 — 타이머와 범위를 이어서 함께 정하는
 * 흐름이 자연스럽도록. 닫기는 배경 탭/닫기 버튼/뒤로가기.
 */
const AudioSleepSheet = ({
  bookName,
  currentChapter,
  totalChapters,
  sleepRemainingMs,
  onSetSleepMinutes,
  endChapter,
  onSetEndChapter,
  onClose,
}: AudioSleepSheetProps) => {
  useModalBackButton(onClose)

  const chapters = Array.from(
    { length: totalChapters - currentChapter + 1 },
    (_, i) => currentChapter + i
  )

  const summaryParts: string[] = []
  if (sleepRemainingMs != null) summaryParts.push(`${formatRemain(sleepRemainingMs)} 뒤 멈춤`)
  if (endChapter != null) summaryParts.push(`${bookName} ${endChapter}장까지`)

  const chipClass = (active: boolean) =>
    `chapter-jump${active ? ' chapter-jump--resume' : ''}`

  return createPortal(
    <div className="chapter-sheet-backdrop" onClick={onClose}>
      <div
        className="chapter-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="잠들기 전 듣기 설정"
      >
        <span className="chapter-sheet__grip" aria-hidden="true" />

        <div className="chapter-sheet__head">
          <div className="chapter-sheet__head-body">
            <h3 className="chapter-sheet__title">
              <span className="material-icons-round align-[-3px] mr-1 text-[18px] text-brand">
                bedtime
              </span>
              잠들기 전 듣기
            </h3>
            <p className="chapter-sheet__sub">
              {summaryParts.length > 0
                ? summaryParts.join(' · ')
                : '시간이나 범위를 정해두면 알아서 멈춰요'}
            </p>
          </div>
          <button
            type="button"
            className="chapter-sheet__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        <div className="chapter-sheet__body">
          {/* 수면 타이머 */}
          <p className="mb-2 mt-1 text-[11px] font-extrabold tracking-wide text-gray-400 dark:text-white/40">
            수면 타이머
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={chipClass(sleepRemainingMs == null)}
              onClick={() => onSetSleepMinutes(null)}
            >
              끄기
            </button>
            {TIMER_OPTIONS.map(m => (
              <button
                key={m}
                type="button"
                className="chapter-jump"
                onClick={() => onSetSleepMinutes(m)}
              >
                {m}분
              </button>
            ))}
          </div>
          {sleepRemainingMs != null && (
            <p className="mt-2 flex items-center gap-1 text-[12px] font-bold text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              {formatRemain(sleepRemainingMs)} 뒤에 소리를 서서히 줄이며 멈춰요
            </p>
          )}

          {/* 듣기 범위 */}
          <p className="mb-2 mt-5 text-[11px] font-extrabold tracking-wide text-gray-400 dark:text-white/40">
            어디까지 들을까요
          </p>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={chipClass(endChapter == null)}
              onClick={() => onSetEndChapter(null)}
            >
              설정 안 함
            </button>
            <button
              type="button"
              className={chipClass(endChapter === currentChapter)}
              onClick={() => onSetEndChapter(currentChapter)}
            >
              이 장까지
            </button>
            <button
              type="button"
              className={chipClass(endChapter === totalChapters)}
              onClick={() => onSetEndChapter(totalChapters)}
            >
              책 끝까지
            </button>
          </div>
          <div className="chapter-sheet__grid">
            {chapters.map(ch => {
              const isEnd = ch === endChapter
              const isCurrent = ch === currentChapter
              return (
                <button
                  key={ch}
                  type="button"
                  className={`ch-cell${isEnd ? ' is-current' : ''}${
                    !isEnd && isCurrent ? ' is-resume' : ''
                  }`}
                  aria-pressed={isEnd}
                  aria-label={`${ch}장까지 듣기${isCurrent ? ' (지금 듣는 장)' : ''}`}
                  onClick={() => onSetEndChapter(ch)}
                >
                  <span className="ch-cell__num">{ch}</span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 pb-1 text-[11px] leading-relaxed text-gray-400 dark:text-white/35">
            수면 타이머는 정한 시각에 소리를 줄이며 멈추고, 듣기 범위는 그 장을
            끝까지 들려드린 뒤 멈춰요. 둘 다 정하면 먼저 오는 쪽에서 멈춰요.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AudioSleepSheet
