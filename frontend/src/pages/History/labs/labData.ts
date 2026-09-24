// 새 발자취(시범) 화면 데이터 — /history/new
// 이정표는 기존 historyThemes 의 MILESTONES(icon+title 있는 원문 기록)를 그대로 쓴다.
// 여기에는 시범 화면에만 필요한 파생값과 신문·퀴즈용 문구만 둔다.

import { MILESTONES } from '../historyThemes'

export const FOUNDED_YEAR = 1994
export const CURRENT_YEAR = new Date().getFullYear()

export interface LabMilestone {
  index: number // INDEXED_EVENTS 기준 인덱스 (기존 화면의 hrec-{index}와 같은 값)
  year: number
  month: number
  day: number
  icon: string
  title: string
  text: string
}

export const LAB_MILESTONES: LabMilestone[] = MILESTONES.map(({ event, index, year }) => ({
  index,
  year,
  month: Number(event.d.slice(5, 7)),
  day: Number(event.d.slice(8, 10)),
  icon: event.icon ?? '',
  title: event.title ?? '',
  text: event.text,
}))

/** 이정표가 있는 해 (신문 연도 칩) */
export const MILESTONE_YEARS = [...new Set(LAB_MILESTONES.map((m) => m.year))]

/** 창립 몇 년째인지 — 1994년 = 1년째 */
export const churchYearOf = (year: number) => year - FOUNDED_YEAR + 1

/**
 * 참빛신보 "그 해 세상은" 칸.
 * ★ 교회 기록이 아니라 일반 상식 수준의 세상 소식이다. 시범 운영 중 문구 검수 대상.
 */
export const WORLD_NOTES: Record<number, string[]> = {
  1994: ['10월, 성수대교가 무너지는 아픈 사고가 있었습니다.', '그 해 여름은 기록적인 폭염이었지요.'],
  1995: ['6월, 삼풍백화점 붕괴 사고가 있었습니다.', '첫 지방자치 동시선거가 치러졌습니다.'],
  1996: ['대한민국이 OECD에 가입했습니다.'],
  1999: ['새 천년을 앞두고 "밀레니엄 버그" 걱정이 한창이었습니다.'],
  2001: ['인천국제공항이 문을 열었습니다.'],
  2002: ['한일 월드컵, 대한민국 4강! 온 나라가 "대~한민국"을 외쳤습니다.'],
  2003: ['2월, 대구 지하철 참사가 있었습니다.'],
  2006: ['독일 월드컵이 열렸습니다.'],
  2008: ['베이징 올림픽에서 야구 대표팀이 금메달을 땄습니다.'],
  2014: ['4월, 세월호 참사로 온 나라가 슬픔에 잠겼습니다.'],
  2016: ['알파고와 이세돌 9단의 바둑 대결이 화제였습니다.'],
  2019: ['연말, 코로나19 소식이 처음 들려오기 시작했습니다.'],
  2020: ['코로나19로 모임과 예배가 멈췄습니다.', '마스크가 일상이 되었지요.'],
  2021: ['도쿄 올림픽이 1년 늦게 열렸습니다.'],
  2022: ['카타르 월드컵에서 16강에 올랐습니다.'],
  2023: ['실내 마스크 의무가 풀리며 일상이 돌아왔습니다.'],
  2024: ['파리 올림픽이 열렸습니다.'],
}

export interface QuizItem {
  q: string
  options: string[]
  answer: number
  explain: string
}

// 해설은 모두 원문 기록(data/events*.ts)에 근거한다.
export const QUIZ: QuizItem[] = [
  {
    q: '1994년 6월 첫 주일예배, 약속도 없이 모인 성도는 몇 명이었을까요?',
    options: ['12명', '40명', '63명', '120명'],
    answer: 2,
    explain:
      '1994년 6월 26일, 심곡동 22평을 빌려 드린 첫 예배에 성도 63명이 사전 연락 없이 스스로 모였습니다.',
  },
  {
    q: '"참빛교회"라는 이름은 어떻게 정해졌을까요?',
    options: ['목사님이 지으셨다', '성경을 펴서 나온 말씀', '성도들의 투표로', '교단에서 정해 주었다'],
    answer: 2,
    explain: "1994년 7월 10일, 성도들이 저마다 지어 온 이름을 놓고 투표해서 '참빛교회'로 정했습니다.",
  },
  {
    q: '교회 개척을 처음 결의한 곳은 어디였을까요?',
    options: ['기도원', '한 장로님 댁 거실', '학교 강당', '상가 지하'],
    answer: 1,
    explain: '1994년 6월 19일, 신앙의 동지 네 분이 은하마을 구하서 장로 댁에 모여 교회 개척을 결의했습니다.',
  },
  {
    q: '상동 새 성전을 위해 마련한 땅은 몇 평이었을까요?',
    options: ['150평', '300평', '440평', '1,000평'],
    answer: 2,
    explain: '2001년 6월 10일, 교회당 건축을 위해 상동지구 440평 대지를 매입했습니다.',
  },
  {
    q: '참빛교회 제1호 파송선교사가 간 나라는 어디일까요?',
    options: ['캄보디아', '미얀마', '태국', '몽골'],
    answer: 1,
    explain:
      '2014년 1월, 김인 선교사를 미얀마로 파송했습니다. (첫 단기선교지는 태국·캄보디아였어요!)',
  },
]

export const quizTitleOf = (score: number, total: number) => {
  if (score === total) return '참빛 산증인'
  if (score >= Math.ceil(total / 2)) return '참빛 이야기꾼'
  return '참빛 새내기'
}
