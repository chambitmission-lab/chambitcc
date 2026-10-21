/** 첨부 파일 크기 — "512B" / "48KB" / "1.3MB". 없거나 0 이하면 빈 문자열(표시 자체를 생략) */
export const formatBytes = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
