// 캡슐함 목록의 편지 한 통 — 봉인 중(SealedRow) / 도착함(ArrivedRow)
// 도착 안내판의 한 줄 행: [작은 봉투] [날짜 · 여행 기간] [제목 · 보낸 분] [상태 알약] ›
// 스타일은 styles/mailbox.css 의 .capsule-row 계열. 색은 전부 테마 토큰이라
// 밤 안내판(station.css) 안에서는 토큰만 바뀌어 유리 행이 된다.
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CapsuleSummary } from '../../types/timeCapsule'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import { counterpartLabel, splitHighlight } from './capsuleGroups'
import { Icon, MicGlyph, PenGlyph, PhotoGlyph } from './capsuleIcons'

const capsuleInviteUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname}#/capsule/invite/${code}`

const shareInvite = async (capsule: CapsuleSummary) => {
  if (!capsule.invite_code) return
  const url = capsuleInviteUrl(capsule.invite_code)
  const toName = capsule.recipient_name ? `${capsule.recipient_name}님께` : '당신에게'
  const text = `🕰️ ${toName} 보내는 타임캡슐이 도착 예정이에요.\n${formatKoreanDate(
    capsule.open_at,
  )}${capsule.open_label ? ` (${capsule.open_label})` : ''}에 열려요.`
  if (navigator.share) {
    try {
      // text에 URL을 넣고 url도 함께 넘기면 공유 대상 앱이 링크를 두 번 붙임
      await navigator.share({ title: '타임캡슐 초대장', text, url })
      return
    } catch {
      return
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n\n${url}`)
    showToast('초대 링크를 복사했어요. 받는 분께 전해주세요', 'success')
  } catch {
    showToast('링크 복사에 실패했어요', 'error')
  }
}

/** 검색어가 걸린 자리에 형광펜 — keyword가 없으면 원문 그대로 */
const Mark = ({ text, keyword }: { text: string; keyword?: string }) => {
  if (!keyword) return <>{text}</>
  return (
    <>
      {splitHighlight(text, keyword).map((part, i) =>
        part.hit ? (
          <em key={i} className="capsule-mark">
            {part.text}
          </em>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}

/** 봉투마다 인장 색이 다르다 — 같은 편지는 언제나 같은 색 */
const SEAL_COLORS = ['#3182f6', '#e0a42e', '#8f86e6', '#4fae6a', '#e2675a']
const sealColor = (id: number) => SEAL_COLORS[Math.abs(id) % SEAL_COLORS.length]

/** 작은 실물 봉투 — tile이면 같은 색 옅은 바탕 위에 앉는다(낮 영역 목록) */
const MiniEnvelope = ({ color, tile }: { color: string; tile?: boolean }) => {
  const env = (
    <span className="capsule-row__env">
      <i />
    </span>
  )
  return (
    <span
      className={tile ? 'capsule-row__tile' : 'capsule-row__lead'}
      style={{ '--seal': color } as CSSProperties}
      aria-hidden
    >
      {env}
    </span>
  )
}

const Chevron = () => (
  <svg
    className="capsule-row__chev"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

/** 2025.11.23 */
const dotDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** 봉인부터 개봉까지 — 편지가 시간을 건너는 여행 길이 */
const travelLabel = (c: CapsuleSummary): string => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened)) return ''
  const days = Math.round((opened - sealed) / 86_400_000)
  if (days >= 365) return `${Math.floor(days / 365)}년 여행`
  if (days >= 28) return `${Math.round(days / 30)}개월 여행`
  if (days >= 1) return `${days}일 여행`
  return '당일 도착'
}

/** 동봉한 것 — 사진·음성·손글씨를 작은 라인 아이콘으로 */
const Enclosures = ({ capsule }: { capsule: CapsuleSummary }) => {
  const photos = capsule.photo_count ?? 0
  if (!photos && !capsule.has_audio && !capsule.has_handwriting) return null
  return (
    <span className="capsule-row__extras">
      {capsule.has_handwriting && (
        <i title="손글씨 편지">
          <Icon size={11}>
            <PenGlyph />
          </Icon>
        </i>
      )}
      {capsule.has_audio && (
        <i title="음성 편지">
          <Icon size={11}>
            <MicGlyph />
          </Icon>
        </i>
      )}
      {photos > 0 && (
        <i title={`사진 ${photos}장`}>
          <Icon size={11}>
            <PhotoGlyph />
          </Icon>
          {photos}
        </i>
      )}
    </span>
  )
}

/** 봉인부터 개봉까지 얼마나 왔는지 (0~1) — D-day 알약이 이만큼 차오른다 */
const waitProgress = (c: CapsuleSummary): number => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened) || opened <= sealed) return 1
  return Math.min(1, Math.max(0.02, (Date.now() - sealed) / (opened - sealed)))
}

// 이 안으로 들어오면 D-day 알약이 브랜드 색으로 떠오른다
const NEAR_DAYS = 30

export const SealedRow = ({
  capsule,
  keyword,
}: {
  capsule: CapsuleSummary
  keyword?: string
}) => {
  const navigate = useNavigate()
  const dday = daysUntil(capsule.open_at)
  const needsShare =
    capsule.role === 'sender' && capsule.capsule_type === 'invite' && !!capsule.invite_code
  const who = counterpartLabel(capsule)

  return (
    <article className="capsule-row-card">
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-row"
      >
        <MiniEnvelope color={sealColor(capsule.id)} tile />

        <span className="capsule-row__when">
          <b>{dotDate(capsule.open_at)}</b>
          <small>{capsule.open_label || travelLabel(capsule)}</small>
        </span>

        <span className="capsule-row__body">
          <b>
            <Mark text={capsule.title || who} keyword={keyword} />
          </b>
          <small>
            <span className="capsule-row__sub">
              {capsule.title ? <Mark text={who} keyword={keyword} /> : '아침에 열려요'}
            </span>
            <Enclosures capsule={capsule} />
          </small>
        </span>

        <span
          className={`capsule-row__pill ${
            dday === 0 ? 'is-today' : dday <= NEAR_DAYS ? 'is-near' : 'is-wait'
          }`}
          // 기다림의 진행 — 카드 바닥의 선 대신 D-day 알약 안이 봉인일부터 차오른다
          style={{ '--wait': `${Math.round(waitProgress(capsule) * 100)}%` } as CSSProperties}
          aria-label={dday > 0 ? `${dday}일 남음` : '오늘 열려요'}
        >
          {dday > 0 ? `D-${dday.toLocaleString()}` : '오늘'}
        </span>
        <Chevron />
      </button>

      {needsShare && (
        <div className="capsule-row__foot">
          <span className="capsule-row__foot-text">
            {capsule.claimed ? '받는 분이 초대를 확인했어요' : '아직 초대장을 전하지 않았어요'}
          </span>
          <button type="button" onClick={() => shareInvite(capsule)} className="capsule-row__share">
            {capsule.claimed ? '다시 전달' : '초대 전달'}
          </button>
        </div>
      )}
    </article>
  )
}

export const ArrivedRow = ({
  capsule,
  keyword,
}: {
  capsule: CapsuleSummary
  keyword?: string
}) => {
  const navigate = useNavigate()
  // opened_at은 '수신자가 열었는가'만 기록한다(발신자 재열람은 남지 않는다).
  // 그래서 내가 보낸 캡슐에는 미개봉 상태를 쓰면 안 된다 — 내가 아무리 읽어도 영영 '안 읽음'이 된다.
  const isSender = capsule.role === 'sender'
  const unopened = !isSender && !capsule.opened_at
  const who = counterpartLabel(capsule)
  // 본문 발췌는 검색 중일 때만, 그것도 서버가 내려준 경우만 (아직 안 연 편지엔 오지 않는다)
  const snippet = keyword ? capsule.match_snippet : null

  const pill = unopened
    ? { cls: 'is-new', text: '새 편지' }
    : isSender
      ? capsule.opened_at
        ? { cls: 'is-read', text: '읽었어요' }
        : { cls: 'is-wait', text: '읽기 전' }
      : { cls: 'is-read', text: '읽음' }

  return (
    <article className={`capsule-row-card${unopened ? ' is-new' : ''}`}>
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-row"
        aria-label={
          isSender
            ? `${capsule.title || who}, ${
                capsule.opened_at
                  ? `${capsule.recipient_name || '받는 분'}님이 읽었어요`
                  : '아직 안 읽었어요'
              }`
            : undefined
        }
      >
        <MiniEnvelope color={unopened ? 'var(--brand)' : sealColor(capsule.id)} />

        <span className="capsule-row__when">
          <b>{dotDate(capsule.sealed_at)}</b>
          <small>{travelLabel(capsule)}</small>
        </span>

        <span className="capsule-row__body">
          <b>
            <Mark text={capsule.title || who} keyword={keyword} />
          </b>
          <small>
            <span className="capsule-row__sub">
              {capsule.title ? (
                <Mark text={who} keyword={keyword} />
              ) : (
                `${formatKoreanDate(capsule.open_at)} 도착`
              )}
            </span>
            <Enclosures capsule={capsule} />
          </small>
          {snippet && (
            <span className="capsule-row__snippet">
              <Mark text={snippet} keyword={keyword} />
            </span>
          )}
        </span>

        <span className={`capsule-row__pill ${pill.cls}`}>{pill.text}</span>
        <Chevron />
      </button>
    </article>
  )
}
