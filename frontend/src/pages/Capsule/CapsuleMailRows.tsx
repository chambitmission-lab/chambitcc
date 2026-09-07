// 캡슐함 목록의 편지 한 통 — 봉인 중(SealedRow) / 도착함(ArrivedRow)
// 카드 스타일은 capsule.css 의 .capsule-mail 계열.
import { useNavigate } from 'react-router-dom'
import type { CapsuleSummary } from '../../types/timeCapsule'
import { showToast } from '../../utils/toast'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import { splitHighlight } from './capsuleGroups'

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

/** 상대 표시: 누구에게/누구로부터 */
const counterpartLabel = (c: CapsuleSummary): string => {
  if (c.role === 'self') return '미래의 나에게'
  if (c.role === 'sender') return `${c.recipient_name || '소중한 분'}에게 보냄`
  return `${c.sender_name}님이 보냄`
}

/** 밀랍 인장 — 누가 보냈는지는 옆 텍스트가 이미 말한다.
    그래서 인장에는 이름 대신 이 편지가 지금 어떤 상태인지를 새긴다. */
const WaxSeal = ({ state }: { state: 'sealed' | 'new' | 'read' }) => (
  <span className={`capsule-mail__seal capsule-mail__seal--${state}`} aria-hidden>
    <svg
      className="capsule-mail__sigil"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
    >
      <path d="M12 3.5v17M6.6 9.2h10.8" />
    </svg>
  </span>
)

/** 봉인 → 개봉까지 얼마나 왔는지 (0~1) — 기다림의 진행바 */
const waitProgress = (c: CapsuleSummary): number => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened) || opened <= sealed) return 1
  const now = Date.now()
  return Math.min(1, Math.max(0.02, (now - sealed) / (opened - sealed)))
}

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
  const photos = capsule.photo_count ?? 0
  const progress = waitProgress(capsule)

  return (
    <article className="capsule-mail capsule-mail--sealed">
      <span className="capsule-mail__flap" aria-hidden />
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-mail__hit"
      >
        <WaxSeal state="sealed" />

        <span className="flex-1 min-w-0">
          <span className="capsule-mail__title">
            <Mark text={capsule.title || counterpartLabel(capsule)} keyword={keyword} />
          </span>
          <span className="capsule-mail__from">
            {capsule.title ? <Mark text={`${counterpartLabel(capsule)} · `} keyword={keyword} /> : ''}
            <span className="capsule-mail__journey">
              {formatKoreanDate(capsule.open_at)} 아침에 열려요
            </span>
          </span>
          <span className="capsule-mail__chips">
            {capsule.open_label && <i className="capsule-mail__chip">✦ {capsule.open_label}</i>}
            {capsule.has_audio && <i className="capsule-mail__chip">🎙️ 음성편지</i>}
            {photos > 0 && <i className="capsule-mail__chip">📷 사진 {photos}장</i>}
          </span>
        </span>

        <span
          className="capsule-mail__dday"
          aria-label={dday > 0 ? `${dday}일 남음` : '오늘 열려요'}
        >
          {dday > 0 ? (
            <>
              <b>D-</b>
              <i>{dday}</i>
            </>
          ) : (
            <b className="capsule-mail__dday--today">오늘</b>
          )}
        </span>
      </button>

      {needsShare && (
        <div className="capsule-mail__foot">
          <span className="capsule-mail__foot-text">
            {capsule.claimed ? '받는 분이 초대를 확인했어요' : '아직 초대장을 전하지 않았어요'}
          </span>
          <button type="button" onClick={() => shareInvite(capsule)} className="capsule-mail__share">
            {capsule.claimed ? '다시 전달' : '초대 전달'}
          </button>
        </div>
      )}

      {/* 봉인부터 개봉까지 — 기다림이 얼마나 흘렀는지 */}
      <span className="capsule-mail__wait" aria-hidden>
        <i style={{ width: `${progress * 100}%` }} />
      </span>
    </article>
  )
}

/** 봉인부터 도착까지 건너온 시간 — 이 편지의 감정선 */
const journeyLabel = (c: CapsuleSummary): string | null => {
  const sealed = new Date(c.sealed_at).getTime()
  const opened = new Date(c.open_at).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(opened)) return null
  const days = Math.round((opened - sealed) / 86_400_000)
  if (days >= 365) return `${Math.floor(days / 365)}년을 건너온 마음`
  if (days >= 28) return `${Math.round(days / 30)}개월을 건너온 마음`
  if (days >= 1) return `${days}일을 건너온 마음`
  return '오늘 봉인해 오늘 도착한 마음'
}

/** 소인(우표)에 찍히는 봉인 날짜 */
const postmarkParts = (iso: string): { year: string; day: string } | null => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return { year: String(d.getFullYear()), day: `${mm}.${dd}` }
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
  const journey = journeyLabel(capsule)
  const stamp = postmarkParts(capsule.sealed_at)
  const photos = capsule.photo_count ?? 0
  // 본문 발췌는 검색 중일 때만, 그것도 서버가 내려준 경우만 (아직 안 연 편지엔 오지 않는다)
  const snippet = keyword ? capsule.match_snippet : null

  return (
    <article className={`capsule-mail ${unopened ? 'capsule-mail--new' : ''}`}>
      <span className="capsule-mail__flap" aria-hidden />
      <button
        type="button"
        onClick={() => navigate(`/capsule/${capsule.id}`)}
        className="capsule-mail__hit"
      >
        <WaxSeal state={unopened ? 'new' : 'read'} />

        <span className="flex-1 min-w-0">
          <span className="capsule-mail__title">
            <Mark text={capsule.title || counterpartLabel(capsule)} keyword={keyword} />
          </span>
          <span className="capsule-mail__from">
            {/* 제목이 없으면 제목 자리에 이미 쓰인 문구라 겹치지 않게 뺀다 */}
            {capsule.title ? (
              <Mark text={`${counterpartLabel(capsule)}${journey ? ' · ' : ''}`} keyword={keyword} />
            ) : (
              ''
            )}
            {journey && <span className="capsule-mail__journey">{journey}</span>}
          </span>
          {snippet && (
            <span className="capsule-mail__snippet">
              <Mark text={snippet} keyword={keyword} />
            </span>
          )}
          <span className="capsule-mail__chips">
            {capsule.has_audio && <i className="capsule-mail__chip">🎙️ 음성편지</i>}
            {photos > 0 && <i className="capsule-mail__chip">📷 사진 {photos}장</i>}
            {isSender ? (
              <i className="capsule-mail__chip">
                {capsule.opened_at
                  ? `${capsule.recipient_name || '받는 분'}님이 읽었어요`
                  : '아직 안 읽었어요'}
              </i>
            ) : (
              !unopened && <i className="capsule-mail__chip">읽음</i>
            )}
          </span>
        </span>

        {unopened ? (
          <span className="capsule-mail__cta">
            {/* 글자를 감싸야 빛 스침(::before) 아래로 깔려 씻겨 보이지 않는다 */}
            <span>열어보기</span>
          </span>
        ) : (
          stamp && (
            <span
              className="capsule-mail__postmark"
              aria-label={`${formatKoreanDate(capsule.sealed_at)} 봉인`}
            >
              <b>{stamp.year}</b>
              <i>{stamp.day}</i>
            </span>
          )
        )}
      </button>
    </article>
  )
}
