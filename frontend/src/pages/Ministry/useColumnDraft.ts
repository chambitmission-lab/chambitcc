// 작성 중이던 편지를 브라우저에 잠깐 맡아 두는 훅.
// 실수로 창을 닫거나 새로고침해도 쓰던 글이 사라지지 않게 한다(저장되면 바로 비운다).

import { useEffect, useRef, useState } from 'react'
import type { Column } from '../../types/column'
import { safeStorage } from '../../utils/safeStorage'

const KEY_PREFIX = 'ministry_column_draft_'
const SAVE_DELAY = 800

const draftKey = (id?: number) => `${KEY_PREFIX}${id ?? 'new'}`

const read = (key: string): Partial<Column> | null => {
  const saved = safeStorage.getJson(key)
  return saved && typeof saved === 'object' ? (saved as Partial<Column>) : null
}

/** 본문·제목 중 하나라도 실제로 달라졌을 때만 "이어 쓰기"를 권한다 */
const isMeaningfullyDifferent = (saved: Partial<Column>, initial: Partial<Column>): boolean =>
  (saved.content ?? '') !== (initial.content ?? '') || (saved.title ?? '') !== (initial.title ?? '')

export const useColumnDraft = (initial: Partial<Column>, draft: Partial<Column>) => {
  const key = draftKey(initial.id)
  // 모달이 열린 시점에 한 번만 확인한다 — 자동 저장이 시작되면 판단 기준이 사라진다
  const [pendingRestore, setPendingRestore] = useState<Partial<Column> | null>(() => {
    const saved = read(key)
    return saved && isMeaningfullyDifferent(saved, initial) ? saved : null
  })
  const timerRef = useRef<number | undefined>(undefined)
  // 마지막으로 브라우저에 맡긴 시각 — 편집기 상태줄의 "자동 저장됨" 표시용
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const firstRunRef = useRef(true)

  useEffect(() => {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      // 용량 초과 등 저장 실패는 무시 — 자동 저장은 어디까지나 보조 장치 (실패했으면 "저장됨"도 띄우지 않는다)
      if (!safeStorage.setJson(key, draft)) return
      // 열자마자 한 번 도는 저장은 "자동 저장됨"으로 알리지 않는다 — 아직 쓴 게 없다
      if (firstRunRef.current) firstRunRef.current = false
      else setSavedAt(new Date())
    }, SAVE_DELAY)
    return () => window.clearTimeout(timerRef.current)
  }, [key, draft])

  const clearDraft = () => {
    window.clearTimeout(timerRef.current)
    safeStorage.remove(key)
  }

  return {
    /** 복구를 제안할 자동 저장본 (없으면 null) */
    pendingRestore,
    dismissRestore: () => setPendingRestore(null),
    savedAt,
    clearDraft,
  }
}
