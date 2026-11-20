// 지난 원고 — 자동 저장이 덮어쓰기 전 남겨 둔 모습을 보고 되돌린다.
//   원고는 입력이 멈출 때마다 저장되며 그대로 덮어쓴다. 문단을 잘못 지웠거나 넣은 초안을 물리고 싶을 때의 안전장치.
//   서버가 약 10분 간격으로, 글이 크게 줄 때는 바로 남긴다(개요마다 최근 30개). 되돌리면 지금 모습이 먼저 남는다.
//   개요 보드(PastorSermonOutline)와 설교 준비실(PastorStudioRoom)이 함께 쓴다.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchOutlineVersion,
  fetchOutlineVersions,
  restoreOutlineVersion,
  type OutlineVersion,
  type OutlineVersionSummary,
  type SermonOutline,
} from '../../../api/pastor'
import { pastorKeys } from '../../../hooks/queryKeys'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import { GhostButton, PastorModal, PrimaryButton } from './ui'

const REASON_LABEL: Record<OutlineVersionSummary['reason'], string> = {
  auto: '자동 보관',
  shrink: '많이 지우기 전',
  restore: '되돌리기 전',
}

const whenLabel = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
  return sameDay ? `오늘 ${time}` : `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`
}

export const OutlineVersionsButton = ({
  outlineId,
  flush,
  onRestored,
}: {
  outlineId: number
  /** 입력 중인 글을 먼저 저장 — 되돌리기 전 '지금 모습'에 마지막 입력까지 담기게 */
  flush: () => Promise<void>
  onRestored: (o: SermonOutline) => void
}) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 font-semibold text-gray-600 dark:text-white/60 hover:text-brand"
      >
        <span className="material-icons-outlined text-[17px]">history</span>지난 원고
      </button>
      {open && <VersionsModal outlineId={outlineId} flush={flush} onRestored={onRestored} onClose={() => setOpen(false)} />}
    </>
  )
}

const VersionsModal = ({
  outlineId,
  flush,
  onRestored,
  onClose,
}: {
  outlineId: number
  flush: () => Promise<void>
  onRestored: (o: SermonOutline) => void
  onClose: () => void
}) => {
  const qc = useQueryClient()
  const [picked, setPicked] = useState<number | null>(null)
  const { data: list, isPending } = useQuery<OutlineVersionSummary[]>({
    queryKey: pastorKeys.outlineVersions(outlineId),
    queryFn: () => fetchOutlineVersions(outlineId),
    staleTime: 0,
  })
  const { data: version, isFetching: versionLoading } = useQuery<OutlineVersion>({
    queryKey: pastorKeys.outlineVersion(outlineId, picked ?? 0),
    queryFn: () => fetchOutlineVersion(outlineId, picked as number),
    enabled: picked != null,
    staleTime: Infinity,
  })

  const restore = useMutation({
    mutationFn: async (versionId: number) => {
      await flush()
      return restoreOutlineVersion(outlineId, versionId)
    },
    onSuccess: o => {
      onRestored(o)
      void qc.invalidateQueries({ queryKey: pastorKeys.outlineVersions(outlineId) })
      showToast('지난 원고로 되돌렸어요 · 방금 전 모습도 ‘지난 원고’에 남겨 두었습니다', 'success')
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const askRestore = async () => {
    if (picked == null) return
    const ok = await confirmDialog({
      title: '지난 원고로 되돌리기',
      message: '개요와 원고를 이때의 모습으로 되돌릴까요?',
      description: '지금 모습은 ‘지난 원고’에 먼저 남겨 두니 다시 돌아올 수 있습니다.',
      confirmText: '되돌리기',
      tone: 'brand',
    })
    if (ok) restore.mutate(picked)
  }

  const shown = picked != null && version?.id === picked ? version : null

  return (
    <PastorModal
      title="지난 원고"
      onClose={onClose}
      wide
      footer={
        <>
          <GhostButton onClick={onClose}>닫기</GhostButton>
          <PrimaryButton disabled={!shown || restore.isPending} onClick={() => void askRestore()}>
            {restore.isPending ? '되돌리는 중...' : '이 모습으로 되돌리기'}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[12.5px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60">
        원고는 쓰는 대로 자동 저장되고, 고치기 전 모습을 10분쯤마다(많이 지울 때는 바로) 남겨 둡니다. 최근 30개까지 보관합니다.
      </p>
      {isPending ? (
        <p className="py-10 text-center text-[13px] text-gray-500 dark:text-white/50">불러오는 중...</p>
      ) : !list || list.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-gray-500 dark:text-white/50">
          아직 남겨 둔 지난 원고가 없습니다. 원고를 쓰기 시작하면 차곡차곡 쌓입니다.
        </p>
      ) : (
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 space-y-4 lg:space-y-0">
          <ul className="space-y-1.5 lg:max-h-[560px] lg:overflow-y-auto">
            {list.map(v => {
              const on = v.id === picked
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(v.id)}
                    aria-pressed={on}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                      on
                        ? 'border-brand bg-[var(--brand-soft)]'
                        : 'border-gray-200/80 dark:border-white/[0.08] hover:border-brand/50'
                    }`}
                  >
                    <span className={`block text-[13.5px] lg:text-[15px] font-bold ${on ? 'text-brand' : 'text-ink-strong'}`}>
                      {whenLabel(v.created_at)}
                    </span>
                    <span className="block text-[12px] lg:text-[13px] text-gray-600 dark:text-white/60">
                      {v.chars.toLocaleString()}자 · {REASON_LABEL[v.reason] ?? '자동 보관'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="min-w-0 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] p-3.5 lg:p-5 lg:max-h-[560px] lg:overflow-y-auto">
            {picked == null ? (
              <p className="py-8 text-center text-[13px] text-gray-500 dark:text-white/50">왼쪽에서 시각을 고르면 그때의 원고를 보여 드립니다.</p>
            ) : !shown ? (
              <p className="py-8 text-center text-[13px] text-gray-500 dark:text-white/50">{versionLoading ? '불러오는 중...' : '불러오지 못했습니다'}</p>
            ) : (
              <div className="space-y-4">
                {shown.sections.map(s => (
                  <section key={s.id}>
                    <h3 className="text-[13px] lg:text-[14.5px] font-bold text-brand">{s.label}</h3>
                    {s.text.trim() && (
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] lg:text-[14px] leading-relaxed text-gray-600 dark:text-white/60">{s.text}</p>
                    )}
                    {s.manuscript?.trim() ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] lg:text-[15.5px] leading-[1.75] text-ink-strong">{s.manuscript}</p>
                    ) : (
                      !s.text.trim() && <p className="mt-1 text-[12.5px] text-gray-400 dark:text-white/40">비어 있음</p>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PastorModal>
  )
}
