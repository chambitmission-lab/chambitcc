// 'YYYY-MM-DDTHH:mm' (서울 벽시계 그대로 서버에 저장되는 형식) 조작 헬퍼.
// EventComposer와 그룹 모임 모달이 같은 규칙으로 시작·종료·마감을 굴리도록 한곳에 모은다.
// 실제 시각 비교가 필요하면 utils/kstTime 의 parseKstDate 를 쓸 것.

const pad = (n: number) => n.toString().padStart(2, '0')

/** Date → 'YYYY-MM-DDTHH:mm' (로컬 필드 그대로) */
export const toLocalDatetimeInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

/** 분 단위 이동 (음수면 앞으로) */
export const addMinutes = (input: string, minutes: number): string => {
  if (!input) return ''
  const d = new Date(input)
  d.setMinutes(d.getMinutes() + minutes)
  return toLocalDatetimeInput(d)
}

/** a - b (분) */
export const diffMinutes = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60000)

/** 'YYYY-MM-DDTHH:mm' → { date, time } 조각 */
export const splitDT = (v: string) => {
  const [date = '', time = ''] = v.split('T')
  return { date, time }
}

/** 조각 → 'YYYY-MM-DDTHH:mm' (둘 다 있어야 값이 생긴다) */
export const joinDT = (date: string, time: string) => (date && time ? `${date}T${time}` : '')
