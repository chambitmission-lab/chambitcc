// 통계 정보 컴포넌트 — "몇 명이 함께하는지" 한 줄 + 함께 기도한 사람 얼굴(최근 5명).
// 댓글 수는 바로 아래 댓글 섹션 헤더와 중복이라 제거 (화면 복잡도 다이어트).
// 얼굴은 이름 없이 사진/첫 글자만(서버 prayed_by). 내가 막 기도하면 서버 응답을 기다리지 않고
// 내 얼굴을 맨 앞에 붙이고, 취소하면 뺀다.
import { useMemo } from 'react'
import type { PrayedByUser } from '../../../../types/prayer'
import { useMyIdentity } from '../../../../hooks/useProfile'

interface PrayerStatsProps {
  prayerCount: number
  prayedBy?: PrayedByUser[]
  isPrayed?: boolean
}

const MAX_FACES = 5
// 이니셜 얼굴 바탕 — 같은 색이 줄줄이 반복되지 않게 자리마다 다른 파스텔
const TONES = [
  'linear-gradient(135deg,#7fb4ff,#3182f6)',
  'linear-gradient(135deg,#7fd8b4,#34c38f)',
  'linear-gradient(135deg,#ffc9a1,#f59e6b)',
  'linear-gradient(135deg,#d4c6ff,#a78bfa)',
  'linear-gradient(135deg,#a8e1f0,#3fb2d6)',
]

const PrayerStats = ({ prayerCount, prayedBy, isPrayed = false }: PrayerStatsProps) => {
  const { avatarUrl, displayName } = useMyIdentity()

  const faces = useMemo(() => {
    // 서버가 얼굴 목록을 안 준 경우(구버전 백엔드·목록 카드 데이터) — 내 얼굴만 덩그러니 + "+12" 로
    // 보이지 않게 얼굴 줄 자체를 그리지 않는다(아이콘 + 숫자 폴백)
    if (!prayedBy) return []
    const others = prayedBy.filter((f) => !f.is_me)
    if (!isPrayed) return others.slice(0, MAX_FACES)
    const me = prayedBy.find((f) => f.is_me) ?? {
      avatar_url: avatarUrl,
      initial: (displayName || '').trim().charAt(0),
      is_me: true,
    }
    return [me, ...others].slice(0, MAX_FACES)
  }, [prayedBy, isPrayed, avatarUrl, displayName])

  const rest = Math.max(0, prayerCount - faces.length)

  return (
    <div className="pd-stats flex items-center gap-2.5 text-xs lg:text-[length:calc(14.5px*var(--fs,1))] text-gray-500 dark:text-gray-400 lg:text-gray-600 dark:lg:text-gray-300 mb-3 px-1">
      {faces.length > 0 ? (
        <span className="flex shrink-0 items-center" aria-hidden>
          {faces.map((f, i) => (
            <span
              key={i}
              className={`pd-face relative w-7 h-7 lg:w-[calc(30px*var(--fs,1))] lg:h-[calc(30px*var(--fs,1))] rounded-full overflow-hidden flex items-center justify-center text-[11px] lg:text-[length:calc(12px*var(--fs,1))] font-bold text-white ${
                i > 0 ? '-ml-2' : ''
              } ${f.is_me ? 'pd-face-me' : ''}`}
              style={{ zIndex: MAX_FACES - i, background: f.avatar_url ? undefined : TONES[i % TONES.length] }}
            >
              {f.avatar_url ? (
                <img src={f.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : f.initial ? (
                f.initial
              ) : (
                <span className="material-icons-outlined text-[15px] leading-none">person</span>
              )}
            </span>
          ))}
          {rest > 0 && (
            <span
              className="pd-face pd-face-more relative -ml-2 h-7 lg:h-[calc(30px*var(--fs,1))] min-w-[2.25rem] px-2 rounded-full flex items-center justify-center text-[11px] lg:text-[length:calc(12px*var(--fs,1))] font-bold tabular-nums"
            >
              +{rest}
            </span>
          )}
        </span>
      ) : (
        <span className="material-icons-outlined text-[14px] lg:text-[length:calc(17px*var(--fs,1))] leading-none text-[var(--brand)]">
          groups
        </span>
      )}
      {prayerCount > 0 ? (
        // 얼굴이 앞에 서면 "성도가"는 군더더기 — 한 줄에 들어가게 짧게
        <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
          <span className="font-semibold text-ink-strong">{prayerCount}명</span>
          {faces.length > 0 ? '이 함께 기도하고 있어요' : '의 성도가 함께 기도하고 있어요'}
        </span>
      ) : (
        <span>가장 먼저 함께 기도해 보세요</span>
      )}
    </div>
  )
}

export default PrayerStats
