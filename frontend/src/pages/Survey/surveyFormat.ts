// 설문 날짜 표기 — surveyShared 가 재수출한다(통계 전략이 surveyShared 를 끌지 않도록 분리)
import { formatLongDate, formatLongDateTime } from '../../utils/dateUtils'

const valid = (iso?: string | null): iso is string => !!iso && !Number.isNaN(new Date(iso).getTime())

export const formatDate = (iso?: string | null): string => (valid(iso) ? formatLongDate(iso) : '')

export const formatDateTime = (iso?: string | null): string => (valid(iso) ? formatLongDateTime(iso) : '')
