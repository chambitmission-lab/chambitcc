import type { SortType } from '../../../../types/prayer'

export interface PrayerComposerProps {
  onClose: () => void
  onSuccess?: () => void
  sort?: SortType
  groupId?: number | null  // ✅ groupId 추가
}

export interface PrayerFormData {
  title: string
  content: string
  isAnonymous: boolean
  displayName: string
}
