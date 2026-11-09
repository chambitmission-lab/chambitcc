import type { EducationCategory, EducationProgram } from '../../../types/education'
import { categoryText, programText } from '../../../types/education'
import { EduGlyph } from '../EduIcons'
import { nextSession, programStage, programTeachers, programWeeks, stripStage, whenLabel } from '../eduSchedule'
import { HiddenBadge, MetaRow, TeacherStack } from './EduBits'
import { toneVars, type Lang } from './eduTone'

// ── 과정 카드 ─────────────────────────────────────────
export const CourseCard = ({
  program,
  category,
  tone,
  now,
  language,
  isAdmin,
  onOpen,
}: {
  program: EducationProgram
  category: EducationCategory
  tone: number
  now: Date
  language: Lang
  isAdmin: boolean
  onOpen: () => void
}) => {
  const ko = language === 'ko'
  const name = stripStage(programText(program, 'name', language))
  const time = programText(program, 'meeting_time', language)
  const location = programText(program, 'location', language)
  const leader = programText(program, 'leader', language)
  const target = programText(program, 'target', language)
  const weeks = programWeeks(program)
  const stage = programStage(program)
  const teachers = programTeachers(program)
  const when = whenLabel(nextSession(program, now), ko)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`edu-course ${!program.is_active ? 'opacity-60' : ''}`}
      style={toneVars(tone)}
    >
      <span className={`edu-cover ${program.image_url ? 'has-image' : ''}`}>
        {program.image_url ? (
          <img src={program.image_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="edu-cover-mark" aria-hidden="true">
            <EduGlyph emoji={category.emoji} size={116} />
          </span>
        )}
        <span className="edu-cover-cat">{categoryText(category, 'name', language)}</span>
        {weeks && (
          <span className="edu-cover-weeks">
            {weeks}
            <small>{ko ? '주 과정' : '-week'}</small>
          </span>
        )}
        {stage && <span className="edu-cover-stage">{ko ? `${stage}단계` : `Step ${stage}`}</span>}
      </span>

      <span className="edu-course-body">
        <span className="edu-course-name">
          {name}
          {!program.is_active && isAdmin && <HiddenBadge />}
        </span>
        {time && <MetaRow icon="clock" text={time} />}
        {location && <MetaRow icon="pin" text={location} />}
        <span className="edu-course-foot">
          {teachers.length > 0 ? (
            <TeacherStack names={teachers} max={4} />
          ) : leader ? (
            <MetaRow icon="user" text={leader} />
          ) : (
            <span className="text-[12.5px] lg:text-[14px] text-[var(--text-muted)] truncate">{target}</span>
          )}
          {when && (
            <span className={`edu-pill shrink-0 ${when.live ? 'is-live' : ''}`}>
              {when.live && <i className="edu-live-dot" aria-hidden="true" />}
              {when.big}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
