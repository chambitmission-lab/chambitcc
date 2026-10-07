// 공휴일 API — 법정 공휴일(임시·대체공휴일 포함). 백엔드가 공공데이터포털 특일 정보를
// 월 1회 받아 DB 에 두고, 여기서는 그 DB 만 읽는다. 이름은 화면용(기독탄신일 → 성탄절).
import { request } from './utils/request'

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
}

interface HolidayYearResponse {
  year: number
  holidays: Holiday[]
}

export const fetchHolidays = async (year: number): Promise<Holiday[]> => {
  const data = await request<HolidayYearResponse>('/holidays', {
    query: { year },
    auth: false,
    errorMessage: '공휴일을 불러오지 못했습니다',
  })
  return data.holidays
}
