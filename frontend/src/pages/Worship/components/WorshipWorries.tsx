// 솔직히, 걱정되는 것들 — 계절 편지지 한 장. 문구는 랜딩(첫 화면)과 같은 키라 관리자가 고치면 두 곳이 함께 바뀐다.
// 답의 첫 문장은 굵게("안 시킵니다."), 끝에 "— 참빛교회에서".

import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAboutContent } from '../../../hooks/useAboutContent'

// 랜딩 걱정 다섯 가지 중 예배 화면에 맞는 넷(자기소개 · 옷 · 아는 사람 · 늦잠)
const KEYS = [
  ['landingFaq1Q', 'landingFaq1A'],
  ['landingFaq2Q', 'landingFaq2A'],
  ['landingFaq4Q', 'landingFaq4A'],
  ['landingFaq5Q', 'landingFaq5A'],
] as const

const splitLead = (text: string): [string, string] => {
  const cut = text.search(/[.!?](\s|$)/)
  if (cut < 0) return [text, '']
  return [text.slice(0, cut + 1), text.slice(cut + 1).trim()]
}

export default function WorshipWorries() {
  const { t } = useLanguage()
  const { tx } = useAboutContent()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="worship-fq">
      {KEYS.map(([q, a], i) => {
        const on = open === i
        const [lead, rest] = splitLead(tx(a))
        return (
          <div key={q} className={`worship-fq-item${on ? ' is-open' : ''}`}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)}>
              <span className="worship-fq-q" aria-hidden="true">Q</span>
              <span className="worship-fq-text">{tx(q)}</span>
              <span className="material-icons-round worship-fq-toggle" aria-hidden="true">{on ? 'remove' : 'add'}</span>
            </button>
            {on && (
              <div className="worship-fq-answer">
                <p className="whitespace-pre-line">
                  <b>{lead}</b>
                  {rest && ` ${rest}`}
                </p>
                <p className="worship-fq-sign">{t('worshipWorrySign')}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
