import type { Event } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { CATEGORY_VISUAL } from '../../utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel, isAllDayEvent } from '../../utils/dateGrouping'
import { eventDateParts, isSameKstDay, splitLocation } from '../utils/eventDisplay'
import { EventAvatar } from './EventAvatar'
import { LockGlyph, SparkleGlyph } from './EventDetailIcons'

interface EventInvitationProps {
  event: Pick<Event, 'title' | 'category' | 'start_datetime' | 'end_datetime' | 'location' | 'group' | 'attendances'>
  t: Translation
}

/** 티켓처럼 생긴 초대장 — 큰 날짜 숫자 · 제목 · 절취선 · 시간/장소 · 함께 가는 사람 */
export const EventInvitation = ({ event, t }: EventInvitationProps) => {
  const { language } = useLanguage()
  const { big, weekday } = eventDateParts(event.start_datetime, language)
  const dday = formatDDay(event.start_datetime)
  const sameDay = isSameKstDay(event.start_datetime, event.end_datetime)
  const startTime = formatEventTime(event.start_datetime)
  const endTime = formatEventTime(event.end_datetime)
  const allDay = isAllDayEvent(event)
  const place = event.location ? splitLocation(event.location) : null
  const going = event.attendances?.filter(a => a.status === 'attending') ?? []

  return (
    <div className="evd-inv">
      <div className="evd-inv-art" style={{ backgroundImage: `url(${CATEGORY_VISUAL[event.category].bg})` }} />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] font-extrabold tracking-[0.06em] text-white/80">
        <span>{t.invitationKick}</span>
        <span aria-hidden="true">·</span>
        <span>{t.categories[event.category]}</span>
        <span className="ml-1 inline-flex items-center h-6 px-2.5 rounded-full bg-white text-[#1b64da] tracking-normal">
          {dday}
        </span>
        {event.group && (
          <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-white/20 text-white tracking-normal font-bold">
            <LockGlyph size={13} />
            {event.group.name}
          </span>
        )}
      </div>

      <div className="evd-inv-big mt-6">
        {big}
        <small>{weekday}</small>
      </div>

      <h1 className="mt-8 text-[25px] lg:text-[29px] font-extrabold leading-[1.3] tracking-[-0.035em] break-keep">
        {event.title}
      </h1>

      <div className="evd-perf" />

      <dl className="grid grid-cols-2 gap-4">
        <div className={place ? '' : 'col-span-2'}>
          <dt className="text-[12.5px] font-bold text-white/70">{t.inviteTime}</dt>
          <dd className="mt-2 text-[16.5px] lg:text-[17.5px] font-extrabold leading-[1.4]">
            {allDay ? (
              sameDay ? (
                '종일'
              ) : (
                <>
                  종일
                  <br />– {formatEventDateLabel(event.end_datetime)}
                </>
              )
            ) : sameDay ? (
              <>
                {startTime}
                <br />– {endTime}
              </>
            ) : (
              <>
                {startTime}
                <br />– {formatEventDateLabel(event.end_datetime)} {endTime}
              </>
            )}
          </dd>
        </div>
        {place && (
          <div className="min-w-0">
            <dt className="text-[12.5px] font-bold text-white/70">{t.location}</dt>
            <dd className="mt-2 text-[16.5px] lg:text-[17.5px] font-extrabold leading-[1.4] break-keep">
              {place.name}
              {place.sub && (
                <span className="block text-[14px] font-semibold text-white/75">{place.sub}</span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex items-center gap-2.5 mt-5 text-[14px] font-bold">
        {going.length > 0 ? (
          <>
            <span className="flex">
              {going.slice(0, 4).map((a, i) => (
                <EventAvatar
                  key={a.id}
                  name={a.user_name?.trim() || t.anonymous}
                  className={`w-8 h-8 text-[13px] border-2 border-[#2a64e0] ${i > 0 ? '-ml-2' : ''}`}
                />
              ))}
            </span>
            {t.inviteGoingCount.replace('{count}', String(going.length))}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-white/85">
            <SparkleGlyph size={17} />
            {t.inviteBeFirst}
          </span>
        )}
      </div>
    </div>
  )
}
