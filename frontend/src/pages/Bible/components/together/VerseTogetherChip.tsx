import type { MouseEvent } from 'react'
import { CommentIcon } from '../../../../components/icons/ActionIcons'

interface VerseTogetherChipProps {
  /** 이 절을 지금 읽는 중인 다른 사람 수 (나 제외) */
  liveOthers: number
  /** 이 절에 남겨진 묵상 수 */
  reflectionCount: number
  /** 이어읽기(문단) 보기 — 인라인 배지 하나로 줄인다 */
  inline?: boolean
  onOpen: () => void
}

/**
 * 절 아래 "함께" 칩. 둘 다 0이면 아무것도 그리지 않는다 — 대부분의 절은 조용해야 한다.
 * 묵상 노트 칩과 같은 자리(좌측 3.25rem)·같은 크기라 본문 흐름을 흔들지 않는다.
 */
const VerseTogetherChip = ({ liveOthers, reflectionCount, inline = false, onOpen }: VerseTogetherChipProps) => {
  if (liveOthers <= 0 && reflectionCount <= 0) return null
  const open = (e: MouseEvent) => {
    e.stopPropagation()
    onOpen()
  }

  if (inline) {
    return (
      <button type="button" className="rt-chip rt-chip--inline" onClick={open} title="함께 읽는 성도의 묵상">
        {liveOthers > 0 ? <span className="rt-live-dot" aria-hidden /> : (
          <span className="rt-chip__icon"><CommentIcon size={11} /></span>
        )}
        {liveOthers > 0 ? `${liveOthers}명 함께` : `묵상 ${reflectionCount}`}
      </button>
    )
  }

  return (
    <div className="rt-verse-chips">
      {liveOthers > 0 && (
        <button type="button" className="rt-chip" onClick={open} title="지금 이 말씀을 함께 읽고 있어요">
          <span className="rt-live-dot" aria-hidden />
          {liveOthers}명이 이 말씀을 함께 읽는 중
        </button>
      )}
      {reflectionCount > 0 && (
        <button type="button" className="rt-chip rt-chip--muted" onClick={open} title="함께 읽는 성도의 묵상 보기">
          <span className="rt-chip__icon"><CommentIcon size={13} /></span>
          묵상 {reflectionCount}
        </button>
      )}
    </div>
  )
}

export default VerseTogetherChip
