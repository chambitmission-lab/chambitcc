// 표 편집기(RowTable·ExtraTableEditor) 공용 — 다음 칸으로 포커스 이동
export const focusCell = (tableId: string, row: number, col: number) =>
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLInputElement>(`[data-cell="${tableId}:${row}:${col}"]`)
    el?.focus()
    el?.select()
  })
