import { timeAgo as relativeTime } from '../../../utils/dateUtils'

export const timeAgo = (iso: string): string => relativeTime(iso)
