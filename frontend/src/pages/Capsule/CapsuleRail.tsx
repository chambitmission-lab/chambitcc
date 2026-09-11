// /capsule PC(lg+) 우측 위젯 레일 — 표준 312px 규격.
// 모바일에는 아예 렌더되지 않는다(부모 aside가 hidden lg:flex).
// 본문 목록은 스크롤하면 사라지므로, 여기엔 '지금 무엇을 할 수 있는지'와
// '다음에 열릴 편지가 언제인지'만 남긴다.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CapsuleSummary } from '../../types/timeCapsule'
import type { CapsuleMailboxData } from '../../hooks/useTimeCapsule'
import { daysUntil, formatKoreanDate } from './capsuleDates'
import { counterpartLabel } from './capsuleGroups'
import { BellGlyph, Icon, LinkGlyph, MicGlyph } from './capsuleIcons'

const cardClass =
  'rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none'
// 레일 섹션 제목 — 회색 eyebrow는 카드 안에서 거의 안 읽혀서 본문색 소제목으로 올린다
const eyebrowClass = 'text-[12.5px] font-extrabold tracking-[0.01em] text-ink-strong'

/** 한눈에 — 한 줄에 이름·수 */
const StatLine = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{label}</span>
    <span
      className={`text-[16px] font-bold tabular-nums ${accent ? 'text-brand' : 'text-ink-strong'}`}
    >
      {value}
    </span>
  </div>
)

/** 안내 한 줄 — 레일 바닥의 회색 문단은 눈에 안 들어와서, 글리프를 앞세워 읽히게 만든다 */
const GuideRow = ({ glyph, children }: { glyph: ReactNode; children: ReactNode }) => (
  <li className="flex items-start gap-2.5">
    <span className="shrink-0 mt-[1px] w-[22px] h-[22px] rounded-lg bg-[var(--brand-soft)] text-brand flex items-center justify-center">
      <Icon size={13}>{glyph}</Icon>
    </span>
    <span className="flex-1 text-[12.5px] leading-[1.65] text-[var(--text-body)] break-keep">
      {children}
    </span>
  </li>
)

/** 다가올 개봉 한 줄 — D-day가 앞, 제목이 뒤 */
const UpcomingRow = ({ capsule }: { capsule: CapsuleSummary }) => {
  const navigate = useNavigate()
  const dday = daysUntil(capsule.open_at)
  const name = capsule.title || counterpartLabel(capsule)

  return (
    <button
      type="button"
      onClick={() => navigate(`/capsule/${capsule.id}`)}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[var(--card-border)] text-left hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
    >
      <span className="shrink-0 w-11 text-center text-[12px] font-extrabold text-brand tabular-nums">
        {dday > 0 ? `D-${dday}` : '오늘'}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[12.5px] font-bold text-ink-strong">{name}</span>
        <span className="block truncate text-[11px] text-gray-400 dark:text-white/40">
          {formatKoreanDate(capsule.open_at)}
          {capsule.open_label ? ` · ${capsule.open_label}` : ''}
        </span>
      </span>
    </button>
  )
}

const CapsuleRail = ({ data }: { data: CapsuleMailboxData }) => {
  const navigate = useNavigate()
  const { sealed, arrivedTotal, unreadTotal } = data
  // 개봉이 가까운 순 — 본문은 '봉인한 달'로 묶이므로 여기서만 시간순으로 보여준다
  const upcoming = [...sealed]
    .sort((a, b) => daysUntil(a.open_at) - daysUntil(b.open_at))
    .slice(0, 4)
  const hasAny = sealed.length + arrivedTotal > 0
  const waitingShare = sealed.filter(
    (c) => c.role === 'sender' && c.capsule_type === 'invite' && !!c.invite_code && !c.claimed,
  ).length

  return (
    <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
      <section className={cardClass}>
        {/* relative 필수 — seal-chip 점선은 absolute ::after 라,
            빠뜨리면 sticky가 걸린 레일(aside) 전체를 감싼다 */}
        <button
          type="button"
          onClick={() => navigate('/capsule/new')}
          className="relative w-full py-3 rounded-2xl bg-brand text-white text-[14px] font-bold hover:-translate-y-0.5 transition-all seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
        >
          새 캡슐 봉인하기
        </button>
        <p className="mt-3 rounded-xl bg-[var(--brand-soft)] px-3 py-2.5 text-[12.5px] leading-[1.7] text-[var(--text-body)] break-keep">
          오늘의 마음을 봉인하면 <b className="font-bold text-ink-strong">정해진 날 아침</b>에 도착해요.
          개봉 전엔 <b className="font-bold text-ink-strong">나도 열어볼 수 없어요.</b>
        </p>
      </section>

      {hasAny && (
        <section className={cardClass}>
          <p className={`mb-2.5 ${eyebrowClass}`}>한눈에</p>
          <div className="flex flex-col gap-1.5">
            <StatLine label="도착한 캡슐" value={arrivedTotal} />
            {unreadTotal > 0 && <StatLine label="아직 안 읽은 편지" value={unreadTotal} accent />}
            {sealed.length > 0 && <StatLine label="봉인 중인 캡슐" value={sealed.length} />}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={cardClass}>
          <p className={`mb-2.5 ${eyebrowClass}`}>다가올 개봉</p>
          <div className="flex flex-col gap-1.5">
            {upcoming.map((c) => (
              <UpcomingRow key={c.id} capsule={c} />
            ))}
          </div>
          {sealed.length > upcoming.length && (
            <p className="mt-2.5 text-[11.5px] text-[var(--text-muted)]">
              그 밖에 {sealed.length - upcoming.length}통이 더 기다리고 있어요
            </p>
          )}
          {waitingShare > 0 && (
            <p className="mt-2.5 text-[12px] leading-[1.65] text-[var(--text-body)] break-keep">
              아직 초대장을 전하지 않은 선물 캡슐이 {waitingShare}통 있어요. 목록의 [초대 전달]로
              링크를 보내주세요.
            </p>
          )}
        </section>
      )}

      <section className={cardClass}>
        <p className={`mb-2.5 ${eyebrowClass}`}>캡슐함 안내</p>
        <ul className="flex flex-col gap-2.5">
          <GuideRow glyph={<BellGlyph />}>
            개봉일 <b className="font-bold text-ink-strong">아침</b>이 되면 알림으로 도착을 알려드려요.
          </GuideRow>
          <GuideRow glyph={<MicGlyph />}>
            편지에는 <b className="font-bold text-ink-strong">음성과 사진</b>을 함께 봉인할 수 있어요.
          </GuideRow>
          <GuideRow glyph={<LinkGlyph />}>
            선물 캡슐은 <b className="font-bold text-ink-strong">[초대 전달]</b>로 받는 분께 링크를 보내주세요.
          </GuideRow>
        </ul>
      </section>
    </aside>
  )
}

export default CapsuleRail
