// /capsule/:id PC(lg+) 우측 위젯 레일 — 표준 312px 규격.
// 편지지 세계(크림 종이·소인·손글씨)는 본문 카드 안에서 끝난다. 여기는 카드 바깥,
// 즉 '앱의 목소리'가 허락된 자리라 편지 정보와 다음 걸음만 담담하게 둔다.
// 모바일에는 렌더되지 않는다(hidden lg:flex).
import { useNavigate } from 'react-router-dom'
import type { CapsuleDetail } from '../../types/timeCapsule'
import { daysUntil, formatKoreanDate } from './capsuleDates'

const cardClass =
  'rounded-2xl p-4 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.07] shadow-sm dark:shadow-none'
const eyebrowClass = 'text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50'

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="shrink-0 text-[12px] font-semibold text-gray-500 dark:text-white/55">
      {label}
    </span>
    <span className="text-[12.5px] font-bold text-ink-strong text-right break-keep">{value}</span>
  </div>
)

/** 봉인부터 도착까지 건너온 시간 — 목록 카드와 같은 문법 */
const journeySpan = (sealedAt: string, openAt: string): string | null => {
  const sealed = new Date(sealedAt).getTime()
  const open = new Date(openAt).getTime()
  if (Number.isNaN(sealed) || Number.isNaN(open)) return null
  const days = Math.round((open - sealed) / 86_400_000)
  if (days >= 365) return `${Math.floor(days / 365)}년 (${days.toLocaleString()}일)`
  if (days >= 28) return `${Math.round(days / 30)}개월 (${days}일)`
  if (days >= 1) return `${days}일`
  return '하루 안'
}

const CapsuleOpenRail = ({
  capsule,
  reading,
  senderLine,
  onSlideshow,
  onShare,
}: {
  capsule: CapsuleDetail
  /** 편지를 펼친 상태 — 이때만 '이어서' 액션이 의미가 있다 */
  reading: boolean
  senderLine: string
  /** 사진과 음성이 모두 있을 때만 넘어온다 */
  onSlideshow?: () => void
  /** 아직 전하지 않은 초대 캡슐일 때만 넘어온다 */
  onShare?: () => void
}) => {
  const navigate = useNavigate()
  const span = journeySpan(capsule.sealed_at, capsule.open_at)
  const dday = daysUntil(capsule.open_at)
  const photos = capsule.photo_count ?? 0
  const attachments = [photos > 0 ? `사진 ${photos}장` : null, capsule.has_audio ? '음성 편지' : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
      <section className={cardClass}>
        <p className={eyebrowClass}>{senderLine}</p>
        <p className="mt-1.5 text-[14.5px] font-extrabold text-ink-strong break-keep leading-[1.45]">
          {capsule.content?.title || capsule.title || '봉인된 타임캡슐'}
        </p>

        <div className="mt-3.5 pt-3.5 border-t border-[var(--card-border)] flex flex-col gap-2">
          <InfoRow label="봉인한 날" value={formatKoreanDate(capsule.sealed_at)} />
          <InfoRow
            label={capsule.openable ? '열린 날' : '열리는 날'}
            value={
              capsule.open_label
                ? `${formatKoreanDate(capsule.open_at)} · ${capsule.open_label}`
                : formatKoreanDate(capsule.open_at)
            }
          />
          {span && <InfoRow label="건너온 시간" value={span} />}
          {attachments && <InfoRow label="동봉된 것" value={attachments} />}
        </div>

        {!capsule.openable && (
          <p className="mt-3 text-[11.5px] leading-[1.7] text-gray-500 dark:text-white/50 break-keep">
            {dday > 0
              ? `개봉까지 ${dday}일 남았어요. 그날까지는 누구도 — 쓴 사람도 — 열어볼 수 없어요.`
              : '오늘 아침 열 수 있어요.'}
          </p>
        )}
      </section>

      {(reading || onShare || (capsule.openable && !reading)) && (
        <section className={cardClass}>
          <p className={`mb-2.5 ${eyebrowClass}`}>이어서</p>

          {capsule.openable && !reading && (
            <p className="text-[12px] leading-[1.7] text-gray-500 dark:text-white/50 break-keep">
              봉투의 밀랍 인장을 꾹 누르면 열려요.
            </p>
          )}

          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
            >
              초대 링크 전달하기
            </button>
          )}

          {reading && (
            <div className="flex flex-col gap-2">
              {onSlideshow && (
                <button
                  type="button"
                  onClick={onSlideshow}
                  className="w-full py-2.5 rounded-xl bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
                >
                  목소리 들으며 사진 보기
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/capsule/new')}
                className="relative w-full py-3 rounded-2xl bg-brand text-white text-[13.5px] font-bold hover:-translate-y-0.5 transition-all seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)]"
              >
                다음 캡슐 이어서 봉인하기
              </button>
              <button
                type="button"
                onClick={() => navigate('/capsule')}
                className="w-full py-2 text-[12.5px] font-bold text-gray-500 dark:text-white/55"
              >
                캡슐함으로
              </button>
            </div>
          )}
        </section>
      )}
    </aside>
  )
}

export default CapsuleOpenRail
