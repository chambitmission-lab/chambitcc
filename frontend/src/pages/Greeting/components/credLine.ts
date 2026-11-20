// 약력 한 줄 파서 — "전)/현)"(영어 "Former)/Current)") 접두와 꼬리 괄호(학위·연도)만 떼어 낸다.
// 데이터는 손대지 않으므로 관리자가 어떤 형식으로 적어도 깨지지 않는다.
// CredentialTimeline(역대 목사 시트)과 ProfileSeasons(담임목사 소개 "철을 따라")가 공유한다.
export interface CredLine {
  text: string
  tag?: string // 꼬리 괄호 내용 — 학위(B.A.)·연도(2014년) 칩
  current?: boolean // 현) — 지금 섬기는 자리
}

export const parseCredLine = (raw: string): CredLine => {
  let text = raw
  let current: boolean | undefined
  const status = text.match(/^(전|현|Former|Current)\)\s*/i)
  if (status) {
    current = /^(현|current)$/i.test(status[1])
    text = text.slice(status[0].length)
  }
  let tag: string | undefined
  // 꼬리 "등"(영어는 ", etc.")은 괄호 뒤에 붙어 있어도 본문 쪽으로 되돌린다
  const tail = text.match(/\(([^()]{1,40})\)\s*(등|,?\s*etc\.?)?$/i)
  if (tail) {
    tag = tail[1]
    const rest = tail[2] ? (tail[2] === '등' ? ' 등' : ', etc.') : ''
    text = text.slice(0, tail.index).trim() + rest
  }
  return { text, tag, current }
}
