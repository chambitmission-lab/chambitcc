// 디지털 주보 훅 - React Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  discardDigitalBulletinDraft,
  getBulletinNotify,
  getBulletinReminders,
  getDigitalBulletin,
  getDigitalBulletinDraft,
  getDigitalBulletinIssue,
  getDigitalBulletinIssues,
  replaceBulletinReminders,
  replaceDigitalBulletin,
  updateBulletinNotify,
} from '../api/digitalBulletin'
import type {
  BulletinData,
  BulletinNotifySettings,
  BulletinReminder,
  DigitalBulletinDraftResponse,
  DigitalBulletinResponse,
} from '../types/digitalBulletin'

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

export const bulletinKeys = {
  all: ['digital-bulletin'] as const,
  draft: ['digital-bulletin', 'draft'] as const,
  issues: ['digital-bulletin', 'issues'] as const,
  issue: (id: number) => ['digital-bulletin', 'issues', id] as const,
  notify: ['digital-bulletin', 'notify'] as const,
  reminders: ['digital-bulletin', 'reminders'] as const,
}

const NO_DRAFT: DigitalBulletinDraftResponse = { data: null, bulletin_id: null }

const isEmptyData = (data?: BulletinData): boolean => {
  if (!data) return true
  return (
    !data.date &&
    !data.title &&
    !data.subtitle &&
    data.worship.schedule.length === 0 &&
    data.announcements.length === 0 &&
    (data.extras ?? []).length === 0 &&
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
    bulletinId: query.data?.bulletin_id ?? null,
    isLoading: query.isLoading,
    isFromDefault: isEmptyData(query.data?.data),
  }
}

export interface ReplaceBulletinVars {
  data: BulletinData
  /** AI 초안을 검토해 적용한 저장 — 서버가 초안을 지우므로 초안 캐시도 비운다 */
  discardDraft?: boolean
  /** 새 주보 도착 알림 본문 — 서버가 date 로 새 주보임을 알아내면 쓴다(초안 적용이든 손으로 쓴 새 주든) */
  announce?: string
}

export const useReplaceDigitalBulletin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, discardDraft, announce }: ReplaceBulletinVars) =>
      replaceDigitalBulletin(data, discardDraft, announce),
    onSuccess: (response, { discardDraft }) => {
      queryClient.setQueryData<DigitalBulletinResponse>(bulletinKeys.all, response)
      if (discardDraft) queryClient.setQueryData<DigitalBulletinDraftResponse>(bulletinKeys.draft, NO_DRAFT)
      // 보관본 목록·해당 주보도 바뀌었다 — refetchOnMount:false 라 비활성 캐시도 직접 무효화
      queryClient.invalidateQueries({ queryKey: bulletinKeys.issues, refetchType: 'all' })
    },
  })
}

/** 종이 주보를 AI 가 읽어 만든 초안 — 관리자일 때만 묻는다(enabled) */
export const useDigitalBulletinDraft = (enabled: boolean) => {
  const query = useQuery({
    queryKey: bulletinKeys.draft,
    queryFn: getDigitalBulletinDraft,
    enabled,
    staleTime: 1000 * 60,
  })
  return { draft: query.data?.data ?? null, createdAt: query.data?.created_at ?? null }
}

export const useDiscardDigitalBulletinDraft = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: discardDigitalBulletinDraft,
    onSuccess: () => {
      queryClient.setQueryData<DigitalBulletinDraftResponse>(bulletinKeys.draft, NO_DRAFT)
    },
  })
}

/* ── 지난 주보 ─────────────────────────────────────── */

export const useDigitalBulletinIssues = () =>
  useQuery({
    queryKey: bulletinKeys.issues,
    queryFn: getDigitalBulletinIssues,
    staleTime: 1000 * 60 * 5,
  })

/** 지난 주보 하나 — id 가 null 이면 묻지 않는다(최신은 useDigitalBulletin) */
export const useDigitalBulletinIssue = (bulletinId: number | null) =>
  useQuery({
    queryKey: bulletinKeys.issue(bulletinId ?? 0),
    queryFn: () => getDigitalBulletinIssue(bulletinId!),
    enabled: bulletinId != null,
    staleTime: 1000 * 60 * 30,
  })

/* ── 내 주보 알림 ──────────────────────────────────── */

export const DEFAULT_NOTIFY: BulletinNotifySettings = {
  new_bulletin: false,
  item_reminders: true,
  service: false,
  services: [],
  dawn: false,
  dawn_days: '0000000',
}

export const useBulletinNotify = (enabled: boolean) =>
  useQuery({
    queryKey: bulletinKeys.notify,
    queryFn: getBulletinNotify,
    enabled,
    staleTime: 1000 * 60 * 5,
  })

export const useUpdateBulletinNotify = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<BulletinNotifySettings>) => updateBulletinNotify(patch),
    onMutate: async patch => {
      await queryClient.cancelQueries({ queryKey: bulletinKeys.notify })
      const prev = queryClient.getQueryData<BulletinNotifySettings>(bulletinKeys.notify)
      queryClient.setQueryData<BulletinNotifySettings>(bulletinKeys.notify, { ...(prev ?? DEFAULT_NOTIFY), ...patch })
      return { prev }
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(bulletinKeys.notify, ctx.prev)
    },
    onSuccess: res => queryClient.setQueryData(bulletinKeys.notify, res),
  })
}

export const useBulletinReminders = (enabled: boolean) =>
  useQuery({
    queryKey: bulletinKeys.reminders,
    queryFn: getBulletinReminders,
    enabled,
    staleTime: 1000 * 60,
  })

export const useReplaceBulletinReminders = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: BulletinReminder[]) => replaceBulletinReminders(items),
    onSuccess: res => queryClient.setQueryData<BulletinReminder[]>(bulletinKeys.reminders, res),
  })
}
