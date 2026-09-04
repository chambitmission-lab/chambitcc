import { useState } from 'react'
import type { WordNote } from '../../../../api/bibleWordNote'
import { cleanWord, rangesOverlap, type NoteSegment, type WordToken } from './verseTextSegments'

/** 단어 뜻 입력/보기 시트의 열림 상태. existing이 있으면 수정 모드 */
export interface WordSheetState {
  initialWord: string
  charStart: number | null
  charEnd: number | null
  existing: WordNote | null
}

interface UseWordSelectionOptions {
  noteSegments: NoteSegment[]
  wordNotes: WordNote[] | undefined
}

/**
 * "모르는 단어 체크" 흐름 — 선택 모드 켜기 → 토큰 탭 → 단어 시트 열기.
 * 저장된 밑줄 단어를 탭했을 때 수정 모드로 여는 것도 같은 시트를 쓴다.
 */
export const useWordSelection = ({ noteSegments, wordNotes }: UseWordSelectionOptions) => {
  // 단어 선택 모드 — 켜지면 본문이 단어 단위 탭 타깃으로 바뀐다
  const [selectMode, setSelectMode] = useState(false)
  const [sheet, setSheet] = useState<WordSheetState | null>(null)

  const openForToken = (token: WordToken) => {
    setSelectMode(false)
    // 이 토큰과 범위가 겹치는 노트가 있으면 수정 모드로 연다 (중복 생성 방지).
    // 단어 다듬기로 범위가 토큰 일부("완악")로 좁혀질 수 있어 시작 위치 일치만으론 부족.
    const existing =
      noteSegments.find((s) => rangesOverlap(s, token))?.note ??
      wordNotes?.find(
        (n) =>
          n.char_start != null &&
          n.char_end != null &&
          rangesOverlap({ start: n.char_start, end: n.char_end }, token)
      ) ??
      null
    setSheet({
      initialWord: cleanWord(token.text) || token.text,
      charStart: token.start,
      charEnd: token.end,
      existing,
    })
  }

  const openForNote = (seg: NoteSegment) =>
    setSheet({
      initialWord: seg.note.word,
      charStart: seg.start,
      charEnd: seg.end,
      existing: seg.note,
    })

  return {
    selectMode,
    enterSelectMode: () => setSelectMode(true),
    exitSelectMode: () => setSelectMode(false),
    sheet,
    closeSheet: () => setSheet(null),
    openForToken,
    openForNote,
  }
}
