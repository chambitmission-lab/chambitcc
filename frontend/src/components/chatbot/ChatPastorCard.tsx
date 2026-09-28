import { useState } from 'react'
import { Briefcase, CaretDown, CaretRight, EnvelopeSimple, GraduationCap, Microphone, Quotes } from '../icons/phosphor'
import type { ChatAction, ChatPastorCard as PastorCard, ChatPastorLink } from '../../types/chatbot'

// 참비 담임목사 소개 카드 — 사진·별칭·소개 → 인사말 한 문장 → 최근 설교·목양칼럼 → 학력·경력(접힘).
// 데이터는 church_pastors(백엔드 church_ministry._reply_pastor). 링크 이동은 말풍선 액션과 같은 onAction.

// 별칭은 DB 에 따옴표째 들어 있기도 하다('"복있는 사람"') — 카드가 직접 따옴표를 두르므로 벗긴다
const bareNickname = (s: string) => s.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')

const RecentRow = ({
  icon,
  label,
  item,
  onAction,
}: {
  icon: React.ReactNode
  label: string
  item: ChatPastorLink
  onAction: (a: ChatAction) => void
}) => (
  <button
    type="button"
    className="cb-pc-row"
    onClick={() => onAction({ label, type: 'link', value: item.link })}
  >
    <span className="cb-pc-row-icon" aria-hidden>
      {icon}
    </span>
    <span className="cb-pc-row-body">
      <span className="cb-pc-row-label">{label}</span>
      <span className="cb-pc-row-title">{item.title}</span>
      {item.meta && <span className="cb-pc-row-meta">{item.meta}</span>}
    </span>
    <CaretRight className="cb-pc-row-caret" size={16} weight="bold" aria-hidden />
  </button>
)

const ChatPastorCard = ({ card, onAction }: { card: PastorCard; onAction: (a: ChatAction) => void }) => {
  const [photoFailed, setPhotoFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const nickname = card.nickname ? bareNickname(card.nickname) : ''
  const hasBio = card.education.length > 0 || card.career.length > 0

  return (
    <div className="cb-pc">
      <div className="cb-pc-head">
        <span className="cb-pc-photo">
          {card.photo_url && !photoFailed ? (
            <img src={card.photo_url} alt={`${card.name} ${card.role}`} onError={() => setPhotoFailed(true)} />
          ) : (
            <span className="cb-pc-initial" aria-hidden>
              {card.name.slice(0, 1)}
            </span>
          )}
        </span>
        <div className="cb-pc-id">
          <p className="cb-pc-name">
            {card.name} <span className="cb-pc-role">{card.role}</span>
          </p>
          {nickname && <p className="cb-pc-nick">“{nickname}”</p>}
          {card.years_label && <span className="cb-pc-years">{card.years_label}</span>}
        </div>
      </div>

      {(card.headline || card.intro) && (
        <div className="cb-pc-about">
          {card.headline && <p className="cb-pc-headline">{card.headline}</p>}
          {card.intro && <p className="cb-pc-intro">{card.intro}</p>}
        </div>
      )}

      {card.quote && (
        <figure className="cb-pc-quote">
          <Quotes className="cb-pc-quote-mark" size={18} weight="duotone" aria-hidden />
          <blockquote>{card.quote}</blockquote>
          <figcaption>인사말 중에서</figcaption>
        </figure>
      )}

      {(card.sermon || card.column) && (
        <div className="cb-pc-recent">
          {card.sermon && (
            <RecentRow icon={<Microphone size={18} weight="bold" />} label="최근 설교" item={card.sermon} onAction={onAction} />
          )}
          {card.column && (
            <RecentRow icon={<EnvelopeSimple size={18} weight="bold" />} label="목양칼럼" item={card.column} onAction={onAction} />
          )}
        </div>
      )}

      {hasBio && (
        <div className="cb-pc-bio">
          <button type="button" className="cb-pc-bio-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            학력·경력 {open ? '접기' : '더 보기'}
            <CaretDown size={14} weight="bold" className={open ? 'rotate-180' : ''} aria-hidden />
          </button>
          {open && (
            <div className="cb-pc-bio-body">
              {card.education.length > 0 && (
                <div className="cb-pc-bio-group">
                  <p className="cb-pc-bio-head">
                    <GraduationCap size={15} weight="bold" aria-hidden /> 학력
                  </p>
                  <ul>
                    {card.education.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {card.career.length > 0 && (
                <div className="cb-pc-bio-group">
                  <p className="cb-pc-bio-head">
                    <Briefcase size={15} weight="bold" aria-hidden /> 경력
                  </p>
                  <ul>
                    {card.career.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatPastorCard
