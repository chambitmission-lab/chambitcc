// 약력 타임라인 — 자유 텍스트 약력(줄 단위)을 "걸어오신 길" 여정 문법으로 그린다.
// 데이터는 손대지 않고 렌더 시점에 "전)/현)" 접두와 꼬리 괄호(학위·연도)만 분리하므로
// 관리자가 어떤 형식으로 적어도 깨지지 않는다. /greeting 본문과 역대 목사 시트가 공유한다.
import type { ReactNode } from 'react'
import { AwardIcon, BriefcaseIcon, GraduationCapIcon } from '../icons'

export type CredentialField = 'education' | 'career' | 'awards'

/** 섹션 라벨 옆 아이콘 타일 — 학사모·서류가방·메달 */
export const CREDENTIAL_ICONS: Record<CredentialField, ReactNode> = {
  education: <GraduationCapIcon size={15} />,
  career: <BriefcaseIcon size={15} />,
  awards: <AwardIcon size={15} />,
}

interface CredLine {
  text: string
  tag?: string // 꼬리 괄호 내용 — 학위(B.A.)·연도(2014년) 칩
  current?: boolean // 현) — 지금 섬기는 자리
}

const parseCredLine = (raw: string): CredLine => {
  let text = raw
  let current: boolean | undefined
  const status = text.match(/^(전|현)\)\s*/)
  if (status) {
    current = status[1] === '현'
    text = text.slice(status[0].length)
  }
  let tag: string | undefined
  const tail = text.match(/\(([^()]{1,40})\)\s*(등)?$/)
  if (tail) {
    tag = tail[1]
    text = text.slice(0, tail.index).trim() + (tail[2] ? ' 등' : '')
  }
  return { text, tag, current }
}

const CredentialTimeline = ({ value, ko }: { value: string; ko: boolean }) => {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return (
    <ul className="gr-cred-list">
      {lines.map((line, i) => {
        const item = parseCredLine(line)
        return (
          <li
            key={i}
            className={item.current ? 'gr-cred-item gr-cred-item--current' : 'gr-cred-item'}
          >
            <span className="gr-cred-dot" aria-hidden="true" />
            <span className="gr-cred-text">
              {item.text}
              {item.current && <span className="gr-cred-now">{ko ? '현재' : 'Now'}</span>}
              {item.tag && <span className="gr-cred-tag">{item.tag}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default CredentialTimeline
