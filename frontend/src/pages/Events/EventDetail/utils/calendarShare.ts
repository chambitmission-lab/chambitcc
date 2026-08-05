import type { Event } from '../../../../types/event'
import { parseKstDate } from '../../../../utils/kstTime'

/* 기기 캘린더 앱에 바로 등록되는 .ics 파일을 클라이언트에서 생성한다.
 * 서버 시각은 오프셋 없는 KST 벽시계이므로 parseKstDate 로 실제 시각을 잡아 UTC 로 내보낸다. */

const toIcsUtc = (d: Date): string =>
  d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const escapeIcsText = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export const downloadEventIcs = (event: Event): void => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chambit Church//Events//KO',
    'BEGIN:VEVENT',
    `UID:chambit-event-${event.id}@chambitcc`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(parseKstDate(event.start_datetime))}`,
    `DTEND:${toIcsUtc(parseKstDate(event.end_datetime))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : '',
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${event.title.replace(/[\\/:*?"<>|]/g, '')}.ics`
  anchor.click()
  URL.revokeObjectURL(url)
}

export const buildMapSearchUrl = (location: string): string =>
  `https://map.kakao.com/link/search/${encodeURIComponent(location)}`
