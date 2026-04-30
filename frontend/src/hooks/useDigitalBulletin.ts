// 디지털 주보 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDigitalBulletin, replaceDigitalBulletin } from '../api/digitalBulletin'
import type { BulletinData, DigitalBulletinResponse } from '../types/digitalBulletin'

export const DEFAULT_BULLETIN: BulletinData = {
  date: '2026. 3. 15.',
  title: '2026표어\n너의 마른 뼈들아,\n이제 살아나리라!',
  subtitle: '(에스겔 37:5, 10)',
  worship: {
    schedule: [
      { name: '1부 예배', time: '오전 7:30', preacher: '배닛시 목사' },
      { name: '2부 예배', time: '오전 9:30', preacher: '배닛시 목사' },
      { name: '3부 예배', time: '오전 11:20', preacher: '안수현 목사' },
      { name: '4부 예배', time: '오후 1:30', preacher: '안수현 목사' },
    ],
    offering: '456장 / 15장',
    prayer: '김정한 집사 / 김원만 장로 / 최우경 지배',
    sermon: {
      title: '하나님 나라의 비전과 사명으로 가득한 가정을 꿈꾸다',
      subtitle: 'Home centered Church',
    },
  },
  announcements: [
    {
      title: '1. 참빛교회에 오신 모든 분들 주님의 사랑으로 환영합니다.',
      content: '등록을 원하시는 성도님께서는 본당 입구 안내 위원에게 알려주시면 예배드리는 곳 등도록 하겠습니다.',
    },
  ],
  groups: [
    { name: '구역', leader: '김철수', members: 15, meeting: '매주 수요일' },
  ],
  weeklySchedule: [
    { day: '월', event: '새벽기도회', time: '오전 5:30', location: '본당' },
  ],
}

const bulletinKeys = {
  all: ['digital-bulletin'] as const,
}

const isEmptyData = (data?: BulletinData): boolean => {
  if (!data) return true
  return (
    !data.date &&
    !data.title &&
    !data.subtitle &&
    data.worship.schedule.length === 0 &&
    data.announcements.length === 0 &&
    data.groups.length === 0 &&
    data.weeklySchedule.length === 0
  )
}

export const useDigitalBulletin = () => {
  const query = useQuery({
    queryKey: bulletinKeys.all,
    queryFn: getDigitalBulletin,
    staleTime: 1000 * 60 * 5,
  })

  // DB가 비어있으면 기본 mock 데이터로 fallback
  const data: BulletinData = isEmptyData(query.data?.data)
    ? DEFAULT_BULLETIN
    : query.data!.data

  return {
    data,
    isLoading: query.isLoading,
    isFromDefault: isEmptyData(query.data?.data),
  }
}

export const useReplaceDigitalBulletin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulletinData) => replaceDigitalBulletin(data),
    onSuccess: (response) => {
      queryClient.setQueryData<DigitalBulletinResponse>(bulletinKeys.all, response)
    },
  })
}
