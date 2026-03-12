// 응답의 전당 테스트용 Mock 데이터
import type { Prayer } from '../types/prayer'

export const mockAnsweredPrayers: Prayer[] = [
  {
    id: 99991,
    display_name: '은혜받은자',
    title: '취업을 위한 기도',
    content: '6개월간 구직 활동을 하며 힘들었습니다. 하나님의 인도하심을 구합니다.',
    prayer_count: 127,
    reply_count: 23,
    is_prayed: true,
    is_owner: false,
    is_answered: true,
    answered_at: '2024-03-10T10:30:00Z',
    testimony: '기도 올린 지 2주 만에 원하던 회사에서 연락이 왔습니다! 면접도 순조롭게 진행되어 합격 통보를 받았습니다. 하나님께서 정말 응답해주셨어요. 함께 기도해주신 모든 분들께 감사드립니다! 🙏',
    created_at: '2024-02-25T09:15:00Z',
    time_ago: '2주 전',
  },
  {
    id: 99992,
    display_name: '감사하는마음',
    title: '가족의 건강 회복',
    content: '어머니께서 갑자기 쓰러지셔서 병원에 입원하셨습니다. 빠른 회복을 위해 기도 부탁드립니다.',
    prayer_count: 234,
    reply_count: 45,
    is_prayed: true,
    is_owner: false,
    is_answered: true,
    answered_at: '2024-03-08T14:20:00Z',
    testimony: '어머니께서 완전히 회복되셨습니다! 의사 선생님도 놀랄 정도로 빠르게 건강을 되찾으셨어요. 하나님의 치유하심을 경험했습니다. 기도해주신 모든 분들께 진심으로 감사드립니다.',
    created_at: '2024-02-20T11:30:00Z',
    time_ago: '3주 전',
  },
  {
    id: 99993,
    display_name: '믿음의자녀',
    title: '시험 합격을 위한 기도',
    content: '중요한 자격증 시험을 앞두고 있습니다. 최선을 다했지만 하나님의 도우심이 필요합니다.',
    prayer_count: 89,
    reply_count: 18,
    is_prayed: true,
    is_owner: false,
    is_answered: true,
    answered_at: '2024-03-05T16:45:00Z',
    testimony: '합격했습니다! 시험 당일 평안한 마음으로 임할 수 있었고, 어려운 문제도 잘 풀 수 있었어요. 모든 영광을 하나님께 돌립니다! ✨',
    created_at: '2024-02-15T08:00:00Z',
    time_ago: '4주 전',
  },
  {
    id: 99994,
    display_name: '회복된영혼',
    title: '관계 회복을 위한 기도',
    content: '오랫동안 연락이 끊긴 친구와의 관계 회복을 위해 기도합니다. 용서와 화해가 필요합니다.',
    prayer_count: 156,
    reply_count: 31,
    is_prayed: true,
    is_owner: false,
    is_answered: true,
    answered_at: '2024-03-01T12:00:00Z',
    testimony: '우연히 친구를 만나게 되었고, 서로 진심으로 대화할 수 있었습니다. 오해가 풀리고 관계가 회복되었어요. 하나님께서 기회를 주셨습니다. 🎉',
    created_at: '2024-02-10T15:20:00Z',
    time_ago: '1개월 전',
  },
  {
    id: 99995,
    display_name: '주님의종',
    title: '사업의 어려움',
    content: '운영하던 사업이 어려워져 폐업 위기에 있습니다. 하나님의 지혜와 인도하심을 구합니다.',
    prayer_count: 198,
    reply_count: 52,
    is_prayed: true,
    is_owner: false,
    is_answered: true,
    answered_at: '2024-02-28T09:30:00Z',
    testimony: '새로운 거래처를 만나게 되었고, 사업이 다시 살아나기 시작했습니다. 포기하지 않고 기도한 것이 응답되었어요. 하나님의 때가 가장 완벽했습니다!',
    created_at: '2024-01-25T10:45:00Z',
    time_ago: '1개월 전',
  }
]

// 기존 기도 목록에 응답된 기도를 추가하는 헬퍼 함수
export const addMockAnsweredPrayers = (prayers: Prayer[]): Prayer[] => {
  // 이미 mock 데이터가 있는지 확인
  const hasMockData = prayers.some(p => p.id >= 99990)
  if (hasMockData) {
    return prayers
  }
  
  // mock 데이터를 맨 앞에 추가
  return [...mockAnsweredPrayers, ...prayers]
}
