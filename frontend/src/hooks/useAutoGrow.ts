// textarea 높이를 글 길이에 맞춘다 — 설교 준비실 입력칸·원고 칸·AI 동역자 입력이 함께 쓴다.
//   max 를 주면 그 높이부터는 안쪽 스크롤, min 은 글이 짧아도 유지할 최소 높이.
import { useLayoutEffect, type RefObject } from 'react'

export const useAutoGrow = (
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  { min, max }: { min?: number; max?: number } = {},
) => {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    let h = el.scrollHeight
    if (min != null) h = Math.max(h, min)
    if (max != null) h = Math.min(h, max)
    el.style.height = `${h}px`
  }, [ref, value, min, max])
}
