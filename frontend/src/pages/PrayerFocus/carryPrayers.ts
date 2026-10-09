// '오늘 품을 기도제목' — 집중 기도를 앱의 기도제목과 잇는다.
// 후보 출처 셋(내 기도 · 함께 기도 중 · 들어온 기도방)을 한 쿼리로 모으고,
// 하나가 실패해도 나머지는 보여준다(allSettled).
import { useQuery } from '@tanstack/react-query'
import { getMyPrayers, getPrayingFor } from '../../api/profile'
import { fetchPrayers } from '../../api/prayer'
import { prayerFocusKeys } from '../../hooks/queryKeys'

export type CarrySource = 'group' | 'praying' | 'mine'

export interface CarryItem {
  id: number
  source: CarrySource
  /** 카드에 보일 한 줄 — 제목, 없으면 본문 */
  text: string
  /** 'group'·'praying' 의 작성자 표시 이름 */
  who?: string
  /** 이미 '기도했어요'를 누른 기도 — 마칠 때 다시 기록하지 않는다 */
  alreadyPrayed: boolean
}

export interface CarryCandidates {
  group: CarryItem[]
  groupName: string | null
  praying: CarryItem[]
  mine: CarryItem[]
}

/** 한 세션에 품을 수 있는 최대 개수 — 시간을 나눠 한 장씩 머물기 때문에 너무 많으면 스쳐 지나간다 */
export const CARRY_MAX = 5

const PER_SOURCE = 10

const lineOf = (title: string | null | undefined, content: string) =>
  (title?.trim() || content.trim()).replace(/\s+/g, ' ')

const settled = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null)

const loadCandidates = async (groupId: number | null): Promise<CarryCandidates> => {
  const [mineRes, prayingRes, groupRes] = await Promise.allSettled([
    getMyPrayers({ limit: PER_SOURCE }),
    getPrayingFor({ limit: PER_SOURCE }),
    groupId ? fetchPrayers(1, PER_SOURCE, 'latest', groupId, null, false) : Promise.resolve(null),
  ])

  const mine = (settled(mineRes) ?? [])
    .filter((p) => p.is_active !== false)
    .map<CarryItem>((p) => ({ id: p.id, source: 'mine', text: lineOf(p.title, p.content), alreadyPrayed: true }))

  const praying = (settled(prayingRes) ?? []).map<CarryItem>((p) => ({
    id: p.id,
    source: 'praying',
    text: lineOf(p.title, p.content),
    who: p.display_name,
    alreadyPrayed: true,
  }))

  const groupItems = settled(groupRes)?.data.items ?? []
  const group = groupItems.map<CarryItem>((p) => ({
    id: p.id,
    // 기도방 안의 내 기도는 '내 기도'로 — 내 글에 기도했어요를 남기지 않게
    source: p.is_owner ? 'mine' : 'group',
    text: lineOf(p.title, p.content),
    who: p.is_owner ? undefined : p.display_name,
    alreadyPrayed: p.is_prayed || !!p.is_owner,
  }))

  // 같은 기도가 여러 출처에 걸치면 기도방 > 함께 기도 중 > 내 기도 순으로 한 번만
  const others = group.filter((g) => g.source === 'group')
  const seen = new Set(others.map((g) => g.id))
  const dedupe = (list: CarryItem[]) =>
    list.filter((it) => {
      if (seen.has(it.id)) return false
      seen.add(it.id)
      return true
    })

  return {
    group: others,
    groupName: groupItems[0]?.group?.name ?? null,
    praying: dedupe(praying),
    mine: dedupe([...group.filter((g) => g.source === 'mine'), ...mine]),
  }
}

export const useCarryCandidates = (groupId: number | null, enabled: boolean) =>
  useQuery({
    queryKey: prayerFocusKeys.carry(groupId),
    queryFn: () => loadCandidates(groupId),
    enabled,
    staleTime: 60_000,
  })
