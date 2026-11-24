// 주보 원문 보기 — 글자는 원문 그대로 두고, 줄 모양만 읽기 좋게 정리한다.
// Single Responsibility: 원문 텍스트를 줄 단위로 분류(번호 꼭지·1) 하위·① 안건·* 참고)해서 그린다.
//   "1. 제목"   → 번호 동그라미 + 굵은 제목, 꼭지마다 구분선
//   "1) 내용"   → 내어쓰기(번호 아래로 줄이 맞게)
//   "① 내용"    → 한 단계 더 들여쓰기
//   "* / ※ 내용" → 작은 참고 줄(옅은 바탕)
// 꼭지 번호가 하나도 없으면 문단만 나눠서 보여 준다.
import type { ReactNode } from 'react'
import { renderKeepTogether } from '../../../../utils/keepTogether'

type Line =
  | { t: 'sub'; mark: string; text: string }
  | { t: 'circled'; mark: string; text: string }
  | { t: 'note'; text: string }
  | { t: 'bullet'; text: string }
  | { t: 'text'; text: string }
  | { t: 'gap' }

interface Section {
  no: string | null
  title: string
  lines: Line[]
}

const HEAD_RE = /^(\d{1,2})\.\s+(\S.*)$/
const SUB_RE = /^(\d{1,2}\))\s*(.*)$/
const CIRCLED_RE = /^([①-⑳])\s*(.*)$/
const NOTE_RE = /^[*※]\s*(.*)$/
const BULLET_RE = /^[-·•]\s+(.*)$/

const classify = (raw: string): Line => {
  const s = raw.trim()
  if (!s) return { t: 'gap' }
  let m = SUB_RE.exec(s)
  if (m) return { t: 'sub', mark: m[1], text: m[2] }
  m = CIRCLED_RE.exec(s)
  if (m) return { t: 'circled', mark: m[1], text: m[2] }
  m = NOTE_RE.exec(s)
  if (m) return { t: 'note', text: m[1] }
  m = BULLET_RE.exec(s)
  if (m) return { t: 'bullet', text: m[1] }
  return { t: 'text', text: s }
}

const parseRawSections = (content: string): Section[] => {
  const sections: Section[] = [{ no: null, title: '', lines: [] }]
  for (const raw of content.replace(/\r\n?/g, '\n').split('\n')) {
    const head = HEAD_RE.exec(raw.trim())
    if (head) {
      sections.push({ no: head[1], title: head[2], lines: [] })
      continue
    }
    sections[sections.length - 1].lines.push(classify(raw))
  }
  // 앞뒤·연속 빈 줄 정리
  for (const sec of sections) {
    const out: Line[] = []
    for (const l of sec.lines) {
      if (l.t === 'gap' && (out.length === 0 || out[out.length - 1].t === 'gap')) continue
      out.push(l)
    }
    while (out.length && out[out.length - 1].t === 'gap') out.pop()
    sec.lines = out
  }
  return sections.filter((s) => s.no !== null || s.lines.length > 0)
}

const renderLine = (l: Line, i: number): ReactNode => {
  switch (l.t) {
    case 'gap':
      return <div key={i} className="ndr-gap" aria-hidden="true" />
    case 'sub':
      return (
        <p key={i} className="ndr-sub">
          <span className="ndr-mark">{l.mark}</span>
          <span>{renderKeepTogether(l.text)}</span>
        </p>
      )
    case 'circled':
      return (
        <p key={i} className="ndr-circled">
          <span className="ndr-mark">{l.mark}</span>
          <span>{renderKeepTogether(l.text)}</span>
        </p>
      )
    case 'note':
      return (
        <p key={i} className="ndr-note">
          <span className="ndr-mark" aria-hidden="true">※</span>
          <span>{renderKeepTogether(l.text)}</span>
        </p>
      )
    case 'bullet':
      return (
        <p key={i} className="ndr-bullet">
          <span className="ndr-mark" aria-hidden="true">·</span>
          <span>{renderKeepTogether(l.text)}</span>
        </p>
      )
    default:
      return (
        <p key={i} className="ndr-text">
          {renderKeepTogether(l.text)}
        </p>
      )
  }
}

const NewsRawText = ({ content }: { content: string }) => {
  const sections = parseRawSections(content)
  return (
    <div className="ndr">
      {sections.map((sec, si) => (
        <section key={si} className={`ndr-sec${sec.no ? '' : ' is-lead'}`}>
          {sec.no && (
            <h5 className="ndr-head">
              <span className="ndr-no">{sec.no}</span>
              <span className="ndr-title">{renderKeepTogether(sec.title)}</span>
            </h5>
          )}
          {sec.lines.length > 0 && <div className="ndr-body">{sec.lines.map(renderLine)}</div>}
        </section>
      ))}
    </div>
  )
}

export default NewsRawText
