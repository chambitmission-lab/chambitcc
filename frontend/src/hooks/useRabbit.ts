import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyRabbit,
  equipTreasure,
  unequipSlot,
  setRabbitNickname,
  fetchRabbitCatalog,
  fetchRabbitEvents,
} from '../api/rabbit'

export const QK_RABBIT_ME = ['rabbit', 'me'] as const
export const QK_RABBIT_CATALOG = ['rabbit', 'catalog'] as const
export const QK_RABBIT_EVENTS = ['rabbit', 'events'] as const

export const useMyRabbit = (enabled = true) =>
  useQuery({
    queryKey: QK_RABBIT_ME,
    queryFn: fetchMyRabbit,
    enabled,
    staleTime: 30 * 1000,
  })

export const useRabbitCatalog = () =>
  useQuery({
    queryKey: QK_RABBIT_CATALOG,
    queryFn: fetchRabbitCatalog,
    staleTime: 60 * 60 * 1000, // 카탈로그는 거의 변하지 않음
  })

export const useRabbitEvents = (enabled = true, limit = 30) =>
  useQuery({
    queryKey: [...QK_RABBIT_EVENTS, limit],
    queryFn: () => fetchRabbitEvents(limit),
    enabled,
  })

export const useEquipTreasure = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemCode: string) => equipTreasure(itemCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_RABBIT_ME })
    },
  })
}

export const useUnequipSlot = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slot: string) => unequipSlot(slot),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_RABBIT_ME })
    },
  })
}

export const useSetRabbitNickname = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nickname: string) => setRabbitNickname(nickname),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_RABBIT_ME })
    },
  })
}
