import type {
  CultureApplicationStatus,
  CultureClass,
  CultureCurriculumRow,
  CultureDetailSection,
  CreateCultureClassRequest,
} from '../../../types/culture'

export const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

export const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

export const cardClass =
  'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

export const STATUS_LABEL: Record<CultureApplicationStatus, string> = {
  pending: '접수 대기',
  confirmed: '등록 완료',
  cancelled: '취소됨',
}

export const STATUS_BADGE: Record<CultureApplicationStatus, string> = {
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  confirmed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  cancelled:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/40 dark:border-white/[0.08]',
}

export const EMPTY_CLASS_FORM = {
  title: '',
  description: '',
  instructor: '',
  schedule: '',
  fee: '',
  capacity: '',
  location: '',
  quarter: '',
  is_open: true,
  is_active: true,
  display_order: 0,
  // ── 강좌 상세 ──
  cover_image_url: '',
  cover_thumb_url: '',
  accent: '',
  target: '',
  duration: '',
  instructor_bio: '',
  curriculum: [] as CultureCurriculumRow[],
  sections: [] as CultureDetailSection[],
}

export type ClassForm = typeof EMPTY_CLASS_FORM

/** 저장된 강좌 → 폼 */
export const classToForm = (c: CultureClass): ClassForm => ({
  title: c.title,
  description: c.description ?? '',
  instructor: c.instructor ?? '',
  schedule: c.schedule ?? '',
  fee: c.fee ?? '',
  capacity: c.capacity ? String(c.capacity) : '',
  location: c.location ?? '',
  quarter: c.quarter ?? '',
  is_open: c.is_open,
  is_active: c.is_active,
  display_order: c.display_order,
  cover_image_url: c.detail?.cover_image_url ?? '',
  cover_thumb_url: c.detail?.cover_thumb_url ?? '',
  accent: c.detail?.accent ?? '',
  target: c.detail?.target ?? '',
  duration: c.detail?.duration ?? '',
  instructor_bio: c.detail?.instructor_bio ?? '',
  curriculum: (c.detail?.curriculum ?? []).map((row) => ({ ...row })),
  sections: (c.detail?.sections ?? []).map((section) => ({ ...section })),
})

/** 폼 → 저장 요청. 상세는 늘 통째로 보낸다(비운 칸이 지워지도록) */
export const formToPayload = (form: ClassForm): CreateCultureClassRequest => {
  // 끝에 남은 빈 주차는 버린다(중간 빈 주는 주차 번호가 밀리지 않게 둔다)
  const curriculum = form.curriculum.map((row) => ({ title: row.title.trim(), note: row.note.trim() }))
  while (curriculum.length > 0) {
    const last = curriculum[curriculum.length - 1]
    if (last.title || last.note) break
    curriculum.pop()
  }
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    instructor: form.instructor.trim() || undefined,
    schedule: form.schedule.trim() || undefined,
    fee: form.fee.trim() || undefined,
    capacity: form.capacity ? Number(form.capacity) : undefined,
    location: form.location.trim() || undefined,
    quarter: form.quarter.trim() || undefined,
    is_open: form.is_open,
    is_active: form.is_active,
    display_order: form.display_order,
    detail: {
      cover_image_url: form.cover_image_url || null,
      cover_thumb_url: (form.cover_image_url && form.cover_thumb_url) || null,
      accent: form.accent || null,
      target: form.target.trim() || null,
      duration: form.duration.trim() || null,
      instructor_bio: form.instructor_bio.trim() || null,
      curriculum,
      sections: form.sections
        .map((section) => ({
          ...section,
          title: section.title.trim(),
          body: section.body.trim(),
          image_url: section.type === 'image' ? section.image_url || null : null,
        }))
        .filter((section) => (section.type === 'image' ? section.image_url : section.body)),
    },
  }
}

export const EMPTY_NOTICE_FORM = { title: '', content: '', is_active: true }
export type NoticeForm = typeof EMPTY_NOTICE_FORM
