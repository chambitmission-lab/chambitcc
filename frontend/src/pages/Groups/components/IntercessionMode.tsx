// 오늘의 중보 — 기도제목을 스토리처럼 한 장씩 넘기며 기도하는 가이드 모드
// "기도했어요"(개별 반응)와 "체크인"(오늘의 기도)이 여기서 하나의 행위로 합쳐진다:
// 카드마다 기도하고 넘기면, 마지막 장에서 오늘 체크인이 자동으로 기록된다.
// 데이터는 기도 탭과 같은 무한쿼리 캐시를 공유 — 별도 API 없음(백엔드 무변경).
import { useEffect, useRef, useState } from 'react'
import { usePrayersInfinite } from '../../../hooks/usePrayersQuery'
import { useGroupDigest, useGroupCheckin } from '../../../hooks/useGroups'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { CheckIcon, PrayIcon } from '../GroupIcons'
import type { Prayer } from '../../../types/prayer'
import { toastFeedback } from '../../../utils/toast'
import { prayerToastFeedback } from '../../../components/prayer/prayerFeedback'

const MAX_CARDS = 10

interface IntercessionModeProps {
  groupId: number
  groupName: string
  onClose: () => void
}

const IntercessionMode = ({ groupId, groupName, onClose }: IntercessionModeProps) => {
  const prayerHook = usePrayersInfinite('latest', groupId, 'all', undefined, prayerToastFeedback)
  const { data: digestData } = useGroupDigest(groupId)
  const checkin = useGroupCheckin(toastFeedback({ error: '체크인에 실패했습니다' }))
  const digest = digestData?.data

  // 세션 시작 시점의 카드 구성을 고정한다 — 기도 반응으로 목록이 재정렬돼도
  // 진행 중인 장 순서가 흔들리지 않게 id만 얼려두고, 상태(is_prayed)는 라이브로 읽는다
  const [cardIds, setCardIds] = useState<number[] | null>(null)
  useEffect(() => {
    if (cardIds !== null || prayerHook.loading) return
    const ids = prayerHook.prayers
      .filter((p) => !p.is_answered)
      .slice(0, MAX_CARDS)
      .map((p) => p.id)
    setCardIds(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prayerHook.loading, cardIds])

  const cards: Prayer[] = (cardIds ?? []).flatMap((id) => {
    const p = prayerHook.prayers.find((x) => x.id === id)
    return p ? [p as Prayer] : []
  })

  const [step, setStep] = useState(0)
  const done = cardIds !== null && step >= cards.length

  // 마지막 장을 넘기는 순간 오늘 체크인을 자동 기록 (이미 했으면 멱등하게 생략)
  const checkedRef = useRef(false)
  const advance = (pray: boolean) => {
    const current = cards[step]
    if (pray && current && !current.is_prayed) {
      void prayerHook.handlePrayerToggle(current.id).catch(() => {})
    }
    const next = step + 1
    if (next >= cards.length && !checkedRef.current) {
      checkedRef.current = true
      if (!digest?.my_checked_in) checkin.mutate(groupId)
    }
    setStep(next)
  }

  useModalBackButton(onClose)

  const current = cards[step]

  return (
    <div className="gd-im" role="dialog" aria-modal="true" aria-label="오늘의 중보">
      {/* ── 상단: 진행 세그먼트 + 방 이름 + 닫기 ── */}
      <div className="shrink-0 px-4 pt-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        {cards.length > 0 && !done && (
          <div className="flex gap-1 mb-3">
            {cards.map((c, i) => (
              <div key={c.id} className="gd-im-seg flex-1">
                <span style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }} />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] font-bold text-white/70 truncate">
            🙏 오늘의 중보 · {groupName}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 본문 ── */}
      {cardIds === null ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-white/60">기도제목을 모으는 중…</p>
        </div>
      ) : cards.length === 0 ? (
        // 진입 CTA에서 걸러지지만, 직접 열렸을 때의 안전망
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <span className="text-white/80 mb-4"><PrayIcon size={44} /></span>
          <p className="text-[16px] font-bold mb-1.5">아직 품을 기도제목이 없어요</p>
          <p className="text-[13px] text-white/60 leading-[1.6] mb-6">
            첫 기도제목이 올라오면
            <br />
            여기서 한 장씩 넘기며 함께 기도할 수 있어요
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-full bg-white text-[#1d2a5e] text-[13.5px] font-bold"
          >
            돌아가기
          </button>
        </div>
      ) : done ? (
        /* ── 완료 화면 ── */
        <div key="done" className="gd-im-card flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/[0.12] border border-white/20 flex items-center justify-center mb-5">
            <PrayIcon size={38} className="text-white" />
          </div>
          <p className="text-[20px] font-bold tracking-[-0.02em] mb-2">오늘의 중보를 마쳤어요</p>
          <p className="text-[13.5px] text-white/70 leading-[1.7]">
            {cards.length}개의 기도제목을 품고 기도했어요
            {digest && (
              <>
                <br />
                오늘 {Math.max(digest.checkins_today, digest.my_checked_in ? 1 : 0, 1)}명이 우리 방을 위해 기도했어요
              </>
            )}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-5 px-4 h-9 rounded-full bg-white/[0.12] border border-white/20 text-[12.5px] font-bold">
            <CheckIcon size={14} />
            오늘의 기도 완료
          </span>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 h-12 px-10 rounded-full bg-white text-[#1d2a5e] text-[14px] font-bold shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)]"
          >
            마치기
          </button>
        </div>
      ) : current ? (
        /* ── 기도 카드 (한 장) ── */
        <div key={current.id} className="gd-im-card flex-1 min-h-0 flex flex-col px-4 pb-4 pt-4 sm:px-6">
          <div className="flex-1 min-h-0 w-full max-w-md mx-auto flex flex-col rounded-3xl bg-white/[0.97] text-gray-900 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* 작성자 */}
            <div className="shrink-0 flex items-center gap-2.5 px-5 pt-5 pb-3">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--brand-soft-strong)] flex items-center justify-center text-[13px] font-bold text-brand">
                  {(current.display_name || '?').charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900 truncate">{current.display_name}</p>
                <p className="text-[11px] text-gray-400">{current.time_ago}</p>
              </div>
              {current.is_prayed && (
                <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[10.5px] font-bold">
                  <CheckIcon size={11} /> 함께 기도함
                </span>
              )}
            </div>

            {/* 기도 내용 — 길면 카드 안에서만 스크롤 */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
              {current.title && (
                <p className="text-[17px] font-bold text-gray-900 tracking-[-0.015em] leading-[1.5] mb-2 break-keep">
                  {current.title}
                </p>
              )}
              <p className="text-[15px] text-gray-700 leading-[1.8] whitespace-pre-wrap break-keep">
                {current.content}
              </p>
            </div>

            {current.prayer_count > 0 && (
              <p className="shrink-0 px-5 pb-4 text-[11.5px] text-gray-400">
                지금까지 <b className="text-brand">{current.prayer_count}명</b>이 함께 기도했어요
              </p>
            )}
          </div>

          {/* 하단 액션 */}
          <div className="shrink-0 w-full max-w-md mx-auto pt-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <button
              type="button"
              onClick={() => advance(true)}
              className="w-full h-[52px] rounded-2xl bg-white text-[#1d2a5e] text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(0,0,0,0.5)] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
            >
              <PrayIcon size={19} />
              기도했어요
            </button>
            <div className="flex items-center justify-between mt-2.5 px-1">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="h-9 px-2 text-[12.5px] font-semibold text-white/55 disabled:opacity-0 transition-opacity"
              >
                ← 이전
              </button>
              <p className="text-[12px] text-white/50 tabular-nums">
                {step + 1} / {cards.length}
              </p>
              <button
                type="button"
                onClick={() => advance(false)}
                className="h-9 px-2 text-[12.5px] font-semibold text-white/55"
              >
                건너뛰기 →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default IntercessionMode
