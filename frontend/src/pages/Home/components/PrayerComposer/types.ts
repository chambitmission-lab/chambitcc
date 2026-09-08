import type { Prayer, SortType } from '../../../../types/prayer'

export interface PrayerComposerProps {
  onClose: () => void
  /** 등록 성공 — 방금 만든 기도(비밀기도면 호출부가 '내 기도' 탭으로 옮겨준다) */
  onSuccess?: (prayer: Prayer) => void
  sort?: SortType
  groupId?: number | null  // ✅ groupId 추가
}

export interface PrayerFormData {
  title: string
  content: string
  isAnonymous: boolean
  isPrivate: boolean
  displayName: string
}
