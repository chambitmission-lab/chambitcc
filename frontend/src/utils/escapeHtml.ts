const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** HTML 텍스트 노드·속성값에 안전하게 끼워 넣기 위한 이스케이프(& < > " '). */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (ch) => MAP[ch])
