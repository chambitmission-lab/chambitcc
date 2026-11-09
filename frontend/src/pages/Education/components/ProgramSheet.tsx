import { createPortal } from 'react-dom'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import type { EducationCategory, EducationProgram } from '../../../types/education'
import { categoryText, programText } from '../../../types/education'
import { EduGlyph } from '../EduIcons'
import { cleanDescription, nextSession, programStaffLine, programStage, programTeachers, stripStage, whenLabel } from '../eduSchedule'
import { CalendarGlyph, TeacherStack } from './EduBits'
import { toneVars, type Lang } from './eduTone'

// ── 과정 상세 하단 시트 ────────────────────────────────
export interface Labels {
  time: string
  leader: string
  location: string
  target: string
  pending: string
}

export const ProgramSheet = ({
  program,
  category,
  tone,
  now,
  language,
  labels,
  onClose,
}: {
  program: EducationProgram
  category: EducationCategory | null
  tone: number
  now: Date
  language: Lang
  labels: Labels
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  useEscapeKey(onClose)

  const ko = language === 'ko'
  const stage = programStage(program)
  const rows = [
    [labels.target, programText(program, 'target', language)],
    [labels.time, programText(program, 'meeting_time', language)],
    [labels.leader, programText(program, 'leader', language)],
    [labels.location, programText(program, 'location', language)],
  ].filter(([, v]) => v.trim().length > 0)
  const description = cleanDescription(programText(program, 'description', language))
  const notice = programText(program, 'notice', language)
  const teachers = programTeachers(program)
  const staff = programStaffLine(program)
  const linkUrl = program.link_url?.trim() ?? ''
  const linkLabel = programText(program, 'link_label', language) || (ko ? '바로가기' : 'Open')
  const when = whenLabel(nextSession(program, now), ko)
  const hasDetails = rows.length > 0 || description.length > 0 || notice.length > 0 || linkUrl.length > 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={stripStage(programText(program, 'name', language))}
        className="pc-scale-sheet relative w-full sm:max-w-lg sheet-rise max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_8px_28px_var(--brand-glow)] flex flex-col"
        style={toneVars(tone)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <SheetGrabber onClose={onClose} className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
        <button
          type="button"
          onClick={onClose}
          aria-label={ko ? '닫기' : 'Close'}
          className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="relative overflow-y-auto px-5 pt-4 pb-7 sm:pt-6 lg:px-7">
          <div className="flex items-center gap-3 pr-10">
            <span className="edu-sheet-glyph" aria-hidden="true">
              <EduGlyph emoji={category?.emoji} size={26} />
            </span>
            <div className="min-w-0">
              {category && (
                <p className="text-[12.5px] lg:text-[14px] font-bold text-[var(--chip-b)] dark:text-[var(--chip-a)]">
                  {categoryText(category, 'name', language)}
                  {stage ? ` · ${ko ? `${stage}단계` : `Step ${stage}`}` : ''}
                </p>
              )}
              <h3 className="text-[20px] lg:text-[23px] font-bold leading-[1.3] tracking-[-0.02em] text-ink-strong">
                {stripStage(programText(program, 'name', language))}
              </h3>
            </div>
          </div>

          {when && (
            <div className="edu-next">
              <CalendarGlyph />
              <div className="min-w-0">
                <b>{when.big}</b>
                <small>
                  {when.small}
                  {!when.live && (ko ? ' · 다음 모임' : ' · next meeting')}
                </small>
              </div>
              {when.live && (
                <span className="edu-pill is-live ml-auto">
                  <i className="edu-live-dot" aria-hidden="true" />
                  LIVE
                </span>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <dl className="mt-4 space-y-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-start gap-2.5">
                  <dt className="edu-row-label mt-[1px]">{label}</dt>
                  <dd className="text-[14.5px] lg:text-[16.5px] font-medium text-ink-strong min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {teachers.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5">
              <TeacherStack names={teachers} max={6} />
              <span className="text-[13px] lg:text-[15px] text-[var(--text-muted)]">
                {ko ? `선생님 ${teachers.length}명이 함께해요` : `${teachers.length} teachers`}
              </span>
            </div>
          )}

          {description && (
            <p className="mt-4 text-[14.5px] lg:text-[16.5px] leading-[1.75] text-[var(--text-body)] whitespace-pre-line">{description}</p>
          )}

          {notice && (
            <p className="mt-4 text-[14px] lg:text-[16px] leading-[1.6] font-semibold text-ink-strong bg-[var(--brand-soft)] rounded-2xl px-4 py-3">
              {notice}
            </p>
          )}

          {teachers.length > 0 && (
            <p className="mt-3 text-[13px] lg:text-[15px] leading-[1.7] text-[var(--text-body)] rounded-2xl px-4 py-3 bg-black/[0.03] dark:bg-white/[0.04]">
              {staff && <span className="block font-semibold text-ink-strong mb-1">{staff}</span>}
              {(ko ? '교사: ' : 'Teachers: ') + teachers.join(' ')}
            </p>
          )}
          {teachers.length === 0 && staff && (
            <p className="mt-3 text-[13px] lg:text-[15px] text-[var(--text-body)]">{staff}</p>
          )}

          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 h-11 px-5 lg:h-12 lg:text-[15.5px] rounded-full bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)] transition-colors"
            >
              {linkLabel}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          )}

          {!hasDetails && <p className="mt-4 text-[13px] lg:text-[15px] text-[var(--text-muted)]">{labels.pending}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
