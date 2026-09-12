// 연대(10년) 단위 메타 — 발자취 화면의 장(章) 구분.

import type { DecadeMeta } from './types'

export const DECADES: DecadeMeta[] = [
  {
    key: '1990s',
    label: "1990's",
    period: '1994 – 1999',
    title: '거실에서 시작된 교회',
    copy: '네 명의 장로가 한 가정집 거실에 모여 드린 기도가, 예순세 명의 첫 예배가 되고 한 교회가 되었습니다.',
  },
  {
    key: '2000s',
    label: "2000's",
    period: '2000 – 2009',
    title: '성전을 세우다',
    copy: '상동 들판에 주춧돌이 놓이고, 지하 문화관의 첫 찬양이 새 성전의 입당과 헌당으로 이어진 시간입니다.',
  },
  {
    key: '2010s',
    label: "2010's",
    period: '2010 – 2019',
    title: '빛을 나누다',
    copy: '첫 파송 선교사를 보내고, 스무 해의 감사를 지나 다음 세대를 향해 눈을 든 시간입니다.',
  },
  {
    key: '2020s',
    label: "2020's",
    period: '2020 – 현재',
    title: '다시, 제자리',
    copy: '멈춤의 시간을 지나 예배의 자리로 돌아와, 서른 해의 이야기를 이어 쓰고 있습니다.',
  },
]

// 연도 → 연대 키
export const decadeOf = (year: number): string => {
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020s'
}
