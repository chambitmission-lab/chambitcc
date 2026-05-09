import { useCallback, useEffect, useState } from 'react'
import {
  createThanks,
  deleteThanks,
  getThanksList,
  toggleThanksAmen,
} from '../../../../api/thanks'
import type { CreateThanksRequest, Thanks } from '../../../../types/thanks'

interface UseThanksOptions {
  limit?: number
  autoLoad?: boolean
}

export const useThanks = ({ limit = 10, autoLoad = true }: UseThanksOptions = {}) => {
  const [items, setItems] = useState<Thanks[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const load = useCallback(
    async (page = 1) => {
      setLoading(true)
      setError(null)
      try {
        const data = await getThanksList(page, limit)
        setItems(data.items)
        setTotal(data.total)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    },
    [limit]
  )

  useEffect(() => {
    if (autoLoad) load(1)
  }, [autoLoad, load])

  const add = useCallback(async (payload: CreateThanksRequest): Promise<void> => {
    const created = await createThanks(payload)
    // 낙관적: 맨 앞에 끼워넣기
    setItems((prev) => [created, ...prev].slice(0, limit))
    setTotal((t) => t + 1)
  }, [limit])

  const remove = useCallback(async (id: number) => {
    await deleteThanks(id)
    setItems((prev) => prev.filter((t) => t.id !== id))
    setTotal((t) => Math.max(0, t - 1))
  }, [])

  const amen = useCallback(async (id: number) => {
    // 낙관적 업데이트
    setItems((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              is_amened: !t.is_amened,
              amen_count: t.is_amened ? Math.max(0, t.amen_count - 1) : t.amen_count + 1,
            }
          : t
      )
    )
    try {
      const res = await toggleThanksAmen(id)
      setItems((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_amened: res.is_amened, amen_count: res.amen_count } : t
        )
      )
    } catch (e) {
      // 롤백
      setItems((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                is_amened: !t.is_amened,
                amen_count: t.is_amened ? Math.max(0, t.amen_count - 1) : t.amen_count + 1,
              }
            : t
        )
      )
      throw e
    }
  }, [])

  return { items, loading, error, total, load, add, remove, amen }
}
