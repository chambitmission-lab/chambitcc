import type { EventAttendance } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import type { AttendanceStatus } from '../../../../types/event'
import { EventAvatar, SectionCard } from './EventAvatar'
import { RsvpGlyph } from './EventDetailIcons'

interface EventPeopleCardProps {
  attendances?: EventAttendance[]
  t: Translation
}

const MAX_VISIBLE = 24

const Group = ({
  status,
  title,
  tone,
  list,
  t,
}: {
  status: AttendanceStatus
  title: string
  tone: string
  list: EventAttendance[]
  t: Translation
}) => {
  const visible = list.slice(0, MAX_VISIBLE)
  const overflow = list.length - visible.length
  return (
    <div>
      <p className={`flex items-center gap-1.5 mb-2.5 text-[14px] lg:text-[15px] font-extrabold ${tone}`}>
        <RsvpGlyph status={status} size={17} />
        {title} {list.length}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-3">
        {visible.map(a => {
          const name = a.user_name?.trim() || t.anonymous
          return (
            <div key={a.id} className="flex flex-col items-center gap-1.5 w-[54px]">
              <EventAvatar name={name} className="w-11 h-11 text-[16px]" />
              <span className="w-full text-center truncate text-gray-600 dark:text-white/70 text-[12.5px] lg:text-[13.5px] font-bold">
                {name}
              </span>
            </div>
          )
        })}
        {overflow > 0 && (
          <div className="flex flex-col items-center gap-1.5 w-[54px]">
            <span className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/55 text-[13.5px] font-extrabold flex items-center justify-center">
              +{overflow}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/** 누가 와요 — 참석·고민 중은 얼굴로, 불참은 이름 없이 숫자만(옛 AttendeesCard 부터 같은 규칙) */
export const EventPeopleCard = ({ attendances, t }: EventPeopleCardProps) => {
  const attending = attendances?.filter(a => a.status === 'attending') ?? []
  const maybe = attendances?.filter(a => a.status === 'maybe') ?? []
  const notAttendingCount = attendances?.filter(a => a.status === 'not_attending').length ?? 0

  return (
    <SectionCard title={t.peopleTitle} count={attending.length}>
      {attending.length === 0 && maybe.length === 0 ? (
        <p className="py-4 text-center text-gray-400 dark:text-white/45 text-[14.5px] lg:text-[15.5px] leading-[1.65] whitespace-pre-line">
          {/* 불참만 있을 때 '아직 응답한 분이 없어요'는 거짓말이 된다 — 문구를 바꾼다 */}
          {notAttendingCount > 0 ? t.peopleNoneGoing : t.peopleEmpty}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {attending.length > 0 && <Group status="attending" title={t.faceAttending} tone="evd-tone-ok" list={attending} t={t} />}
          {maybe.length > 0 && <Group status="maybe" title={t.faceMaybe} tone="evd-tone-maybe" list={maybe} t={t} />}
        </div>
      )}
      {notAttendingCount > 0 && (
        <p className="mt-8 text-gray-400 dark:text-white/45 text-[13.5px] lg:text-[14.5px] font-medium">
          {t.attendeesNotAttendingCount.replace('{count}', String(notAttendingCount))}
        </p>
      )}
    </SectionCard>
  )
}
