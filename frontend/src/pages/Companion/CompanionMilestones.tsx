// 동행 상세 — 마일스톤 + 우정 카드(이미지 저장·공유)
import { useEffect, useState } from 'react'
import type { CompanionDetail } from '../../types/companion'
import { sessionStore } from '../../utils/tokenStore'
import { showToast } from '../../utils/toast'
import { Sheet } from './CompanionParts'
import { drawFriendshipCard, friendshipCardFile, type FriendshipCardInput } from './friendshipCard'
import { MILESTONES, metricValue, type Milestone } from './milestones'

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

const CompanionMilestones = ({ c }: { c: CompanionDetail }) => {
  const [open, setOpen] = useState<Milestone | null>(null)

  return (
    <section className="px-4 lg:px-0 pt-8">
      <h3 className="text-[15px] font-extrabold text-ink-strong tracking-[-0.02em] mb-1 px-0.5">함께 쌓은 순간</h3>
      <p className="text-[12px] text-gray-500 dark:text-white/50 mb-3 px-0.5">닿은 순간을 누르면 우정 카드를 만들 수 있어요</p>
      {/* 모바일은 가로 스크롤, lg 는 넓은 폭에 한 줄로 다 펼친다 */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar lg:mx-0 lg:px-0 lg:grid lg:grid-cols-7 lg:overflow-visible">
        {MILESTONES.map((m) => {
          const value = metricValue(c, m)
          const reached = value >= m.need
          return (
            <button
              key={m.key}
              type="button"
              disabled={!reached}
              onClick={() => setOpen(m)}
              className={`shrink-0 w-[120px] lg:w-auto text-left rounded-2xl px-3.5 py-3 border transition-transform ${
                reached
                  ? 'bg-white dark:bg-card-dark border-[var(--cp-flame)] active:scale-[0.98]'
                  : 'bg-gray-50 dark:bg-white/[0.03] border-border-light dark:border-border-dark'
              }`}
            >
              <div className={`text-[13.5px] font-bold leading-snug ${reached ? 'text-ink-strong' : 'text-gray-400 dark:text-white/40'}`}>
                {m.label}
              </div>
              <div className="mt-1.5 text-[11.5px] tabular-nums text-gray-400 dark:text-white/40">
                {reached ? '카드 만들기' : `${Math.min(value, m.need)} / ${m.need}`}
              </div>
            </button>
          )
        })}
      </div>
      {open && <CardSheet c={c} milestone={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

const CardSheet = ({ c, milestone, onClose }: { c: CompanionDetail; milestone: Milestone; onClose: () => void }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [input] = useState<FriendshipCardInput>(() => ({
    milestone,
    myName: sessionStore.get('fullName') || '나',
    partnerName: c.partner.name,
    togetherWeeks: c.together_weeks,
    litWeeks: c.lit_weeks,
    cheers: c.cheer?.total ?? 0,
    colors: {
      me: cssVar('--brand', '#3182f6'),
      you: cssVar('--cp-you', '#f0a23b'),
      flame: cssVar('--cp-flame', '#ffb547'),
    },
  }))

  useEffect(() => {
    let alive = true
    let url: string | null = null
    void drawFriendshipCard(input).then((canvas) =>
      canvas.toBlob((blob) => {
        if (!alive || !blob) return
        url = URL.createObjectURL(blob)
        setPreview(url)
      }, 'image/png'),
    )
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [input])

  const [canShareFile] = useState(() => {
    try {
      return !!navigator.canShare?.({ files: [new File([], 'card.png', { type: 'image/png' })] })
    } catch {
      return false
    }
  })

  const handleShare = async () => {
    setBusy(true)
    try {
      const file = await friendshipCardFile(input)
      if (!file) throw new Error('export failed')
      await navigator.share({ files: [file] })
    } catch (err) {
      // 공유 시트를 닫은 건 실패가 아니다
      if ((err as DOMException)?.name !== 'AbortError') showToast('카드를 공유하지 못했어요', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      const file = await friendshipCardFile(input)
      if (!file) throw new Error('export failed')
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch {
      showToast('카드를 저장하지 못했어요', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h3 className="text-[17px] font-bold text-ink-strong">{milestone.label}</h3>
      <p className="text-[12.5px] text-gray-500 dark:text-white/55 mt-1 mb-4">{c.partner.name}님과 함께 만든 카드예요</p>
      <div className="mx-auto w-full max-w-[300px] aspect-[4/5] rounded-2xl overflow-hidden bg-[#f7f2e8] ring-1 ring-black/[0.06]">
        {preview ? (
          <img src={preview} alt={`${milestone.label} 우정 카드`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full animate-pulse" />
        )}
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !preview}
          className={`${canShareFile ? 'flex-1' : 'w-full'} py-3.5 rounded-2xl bg-gray-100 dark:bg-white/[0.06] text-[14.5px] font-bold text-ink-strong disabled:opacity-40`}
        >
          저장
        </button>
        {canShareFile && (
          <button
            type="button"
            onClick={handleShare}
            disabled={busy || !preview}
            className="flex-[2] py-3.5 rounded-2xl bg-brand text-white text-[14.5px] font-bold disabled:opacity-40"
          >
            공유하기
          </button>
        )}
      </div>
    </Sheet>
  )
}

export default CompanionMilestones
