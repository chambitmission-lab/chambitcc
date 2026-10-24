// 주보 호수·계절 판 — 목록(BulletinShelf)과 뷰어가 같은 이름표를 쓴다.
// 호수는 날짜로 계산(제33권 43호 = 2026년 43번째 주일)이라 백엔드 무변경.
import type { Translation } from '../../../locales'
import type { Bulletin } from '../../../types/bulletin'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const SEASON_LABEL: Record<Season, keyof Translation> = {
  spring: 'newsBulletinSeasonSpring',
  summer: 'newsBulletinSeasonSummer',
  autumn: 'newsBulletinSeasonAutumn',
  winter: 'newsBulletinSeasonWinter',
}

/** 종이 주보 표지의 권 번호 — 2026년이 제33권 */
const VOLUME_BASE_YEAR = 1993

export interface Issue {
  bulletin: Bulletin
  y: number
  m: number
  d: number
  /** 그해 몇 번째 주일인지 = 종이 주보의 '호' */
  no: number
  vol: number
  season: Season
}

const seasonOf = (m: number): Season =>
  m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'

// bulletin_date 는 'YYYY-MM-DDT00:00:00+09:00' — 기기 시간대와 무관하게 앞 10자리로 읽는다
export const toIssue = (bulletin: Bulletin): Issue => {
  const [y, m, d] = bulletin.bulletin_date.slice(0, 10).split('-').map(Number)
  const jan1 = new Date(Date.UTC(y, 0, 1))
  const firstSunday = Date.UTC(y, 0, 1 + ((7 - jan1.getUTCDay()) % 7))
  const no = Math.floor((Date.UTC(y, m - 1, d) - firstSunday) / 864e5 / 7) + 1
  return { bulletin, y, m, d, no: Math.max(no, 1), vol: y - VOLUME_BASE_YEAR, season: seasonOf(m) }
}

/** '10월 25일' / 'October 25' */
export const issueDateText = (issue: Issue, language: string) =>
  new Date(Date.UTC(issue.y, issue.m - 1, issue.d)).toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

export const fill = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s)
