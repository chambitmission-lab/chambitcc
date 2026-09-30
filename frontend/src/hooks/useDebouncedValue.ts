import { useEffect, useState } from 'react'

/** 값이 ms 동안 바뀌지 않았을 때만 따라오는 값 — 입력이 멈춘 뒤에만 서버에 묻는 용도 */
export const useDebouncedValue = <T,>(value: T, ms: number): T => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}
