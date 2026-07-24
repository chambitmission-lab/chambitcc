import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createNewFamilyPost,
  syncNewFamilyPhotos,
  updateNewFamilyPost,
} from '../../../api/newFamily'
import { showToast } from '../../../utils/toast'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { NewFamilyPost } from '../../../types/newFamily'

interface NewFamilyComposerProps {
  /** 넘기면 수정 모드, 없으면 등록 모드 */
  post?: NewFamilyPost
  onClose: () => void
  onSuccess: () => void
}

/**
 * 사진 한 칸 — 기존(서버에 있는 것)과 새로 고른 파일을 한 배열에서 다루면
 * 추가·삭제·순서변경을 같은 코드로 처리할 수 있다.
 */
type PhotoSlot =
  | { kind: 'existing'; id: number; url: string }
  | { kind: 'new'; file: File; url: string }

const MAX_PHOTOS = 10
/** 업로드 전 클라이언트 리사이즈 — 피드는 정사각 1080px이면 충분 */
const UPLOAD_MAX_SIZE = 1080

const GROUP_PRESETS = [
  '영아부', '유치부', '유년부', '초등부', '중등부', '고등부',
  '청년1부', '청년2부', '장년부', '새가족부',
]

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 이번 주 일요일(오늘 포함, 지난 일요일) */
const getThisSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return toDateInput(d)
}

const getLastSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() - 7)
  return toDateInput(d)
}

/** 사진 구성이 처음과 같은지 비교할 서명 — 순서까지 포함 */
const slotSignature = (slots: PhotoSlot[]) =>
  slots.map(s => (s.kind === 'existing' ? `e${s.id}` : `n${s.url}`)).join('|')

const NewFamilyComposer = ({ post, onClose, onSuccess }: NewFamilyComposerProps) => {
  const isEdit = !!post

  const [memberName, setMemberName] = useState(post?.member_name ?? '')
  const [registeredAt, setRegisteredAt] = useState(post?.registered_at ?? getThisSunday())
  const [groupName, setGroupName] = useState(post?.group_name ?? '')
  const [greeting, setGreeting] = useState(post?.greeting ?? '')
  const [isPublished, setIsPublished] = useState(post?.is_published ?? true)
  // 수정 시에는 등록 때 이미 받은 동의라 다시 묻지 않는다
  const [consent, setConsent] = useState(isEdit)
  const [slots, setSlots] = useState<PhotoSlot[]>(
    () =>
      post?.photos.map(p => ({ kind: 'existing' as const, id: p.id, url: p.image_url })) ?? [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialSignature = useRef(slotSignature(slots))

  useModalBackButton(onClose)

  // 새로 고른 파일의 objectURL만 해제 (기존 사진 URL은 원격이라 해당 없음)
  useEffect(() => {
    return () => {
      slots.forEach(s => {
        if (s.kind === 'new') URL.revokeObjectURL(s.url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    const accepted: PhotoSlot[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다`, 'error')
        continue
      }
      if (slots.length + accepted.length >= MAX_PHOTOS) {
        showToast(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요`, 'error')
        break
      }
      accepted.push({ kind: 'new', file, url: URL.createObjectURL(file) })
    }

    setSlots(prev => [...prev, ...accepted])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (idx: number) => {
    const target = slots[idx]
    if (target.kind === 'new') URL.revokeObjectURL(target.url)
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= slots.length) return
    setSlots(prev => {
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const photosChanged = slotSignature(slots) !== initialSignature.current

  const canSubmit =
    memberName.trim().length > 0 && slots.length > 0 && consent && !submitting

  /** 새로 고른 파일만 리사이즈해 files 배열과 order 토큰을 만든다 */
  const buildPhotoPayload = async () => {
    const files: Blob[] = []
    const order: string[] = []
    for (const slot of slots) {
      if (slot.kind === 'existing') {
        order.push(String(slot.id))
      } else {
        order.push(`new:${files.length}`)
        // 원본(수 MB)을 그대로 올리지 않도록 업로드 전에 줄인다
        files.push(await resizeImageToBlob(slot.file, UPLOAD_MAX_SIZE, 0.85))
      }
    }
    return { files, order }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      if (isEdit && post) {
        await updateNewFamilyPost(post.id, {
          member_name: memberName.trim(),
          registered_at: registeredAt,
          group_name: groupName.trim() || null,
          greeting: greeting.trim() || null,
          is_published: isPublished,
        })
        // 사진은 바뀐 경우에만 — 불필요한 재업로드/재정렬을 피한다
        if (photosChanged) {
          const { files, order } = await buildPhotoPayload()
          await syncNewFamilyPhotos(post.id, order, files)
        }
        showToast('수정되었습니다', 'success')
      } else {
        const { files } = await buildPhotoPayload()
        await createNewFamilyPost({
          memberName: memberName.trim(),
          registeredAt,
          groupName: groupName.trim() || undefined,
          greeting: greeting.trim() || undefined,
          isPublished,
          consentConfirmed: consent,
          files,
        })
        showToast('새가족 소식이 등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : isEdit ? '수정에 실패했습니다' : '등록에 실패했습니다',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isThisSunday = registeredAt === getThisSunday()
  const isLastSunday = registeredAt === getLastSunday()

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {isEdit ? '새가족 수정' : '새가족 등록'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {/* 이름 */}
            <FieldGroup label="이름" required>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="예) 김OO 형제 / 이OO 집사님 가정"
                maxLength={50}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 등록 주일 */}
            <FieldGroup label="등록 주일" required>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <QuickChip active={isThisSunday} onClick={() => setRegisteredAt(getThisSunday())}>
                  이번 주일
                </QuickChip>
                <QuickChip active={isLastSunday} onClick={() => setRegisteredAt(getLastSunday())}>
                  지난 주일
                </QuickChip>
              </div>
              <input
                type="date"
                value={registeredAt}
                onChange={(e) => setRegisteredAt(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 부서 — pill grid (native select 금지) */}
            <FieldGroup label="소속 부서">
              <div className="flex gap-1.5 flex-wrap">
                {GROUP_PRESETS.map(g => (
                  <QuickChip
                    key={g}
                    active={groupName === g}
                    onClick={() => setGroupName(prev => (prev === g ? '' : g))}
                  >
                    {g}
                  </QuickChip>
                ))}
              </div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="직접 입력도 가능해요"
                maxLength={50}
                className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
              />
            </FieldGroup>

            {/* 인사말 */}
            <FieldGroup label="인사말 · 소개">
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value.slice(0, 1000))}
                placeholder="새가족의 한마디나 간단한 소개를 적어주세요."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {greeting.length}/1000
              </p>
            </FieldGroup>

            {/* 사진 */}
            <FieldGroup label="사진" required>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                첫 번째 사진이 대표 이미지가 돼요. 최대 {MAX_PHOTOS}장, 업로드 전 자동으로 줄여서 올립니다.
              </p>

              <label className="relative block rounded-2xl border-2 border-dashed border-purple-300/50 dark:border-purple-400/30 bg-purple-500/5 dark:bg-purple-500/8 hover:bg-purple-500/10 dark:hover:bg-purple-500/15 transition-colors cursor-pointer p-5 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={submitting}
                />
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 dark:text-purple-300">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-gray-800 dark:text-white">사진 추가</p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">여러 장 선택 가능</p>
              </label>

              {slots.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-white/80">
                      등록된 사진
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10.5px] font-bold">
                      {slots.length}장
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, idx) => (
                      <PhotoPreviewItem
                        key={slot.kind === 'existing' ? `e${slot.id}` : slot.url}
                        src={slot.url}
                        index={idx}
                        isNew={slot.kind === 'new'}
                        showNewBadge={isEdit}
                        canMoveLeft={idx > 0}
                        canMoveRight={idx < slots.length - 1}
                        onRemove={() => handleRemove(idx)}
                        onMoveLeft={() => handleMove(idx, -1)}
                        onMoveRight={() => handleMove(idx, 1)}
                      />
                    ))}
                  </div>
                  {isEdit && photosChanged && (
                    <p className="mt-2 text-[11px] font-semibold text-purple-600 dark:text-purple-300">
                      사진 변경사항은 저장할 때 반영돼요
                    </p>
                  )}
                </div>
              )}
            </FieldGroup>

            {/* 공개 토글 */}
            <FieldGroup label="공개 상태">
              <button
                type="button"
                onClick={() => setIsPublished(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-left"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">
                    {isPublished ? '성도에게 공개' : '비공개 (관리자만)'}
                  </p>
                  <p className="text-[11.5px] text-gray-500 dark:text-white/45 mt-0.5">
                    공개해도 로그인한 성도에게만 보여요
                  </p>
                </div>
                <span
                  className={[
                    'relative shrink-0 w-12 h-7 rounded-full transition-colors',
                    isPublished
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gray-300 dark:bg-white/15',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all',
                      isPublished ? 'left-6' : 'left-1',
                    ].join(' ')}
                  />
                </span>
              </button>
            </FieldGroup>

            {/* 초상권 동의 — 등록 시에만 필수 (수정은 이미 받은 동의) */}
            {!isEdit && (
            <label
              className={[
                'flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors',
                consent
                  ? 'border-purple-400/60 bg-purple-500/8 dark:bg-purple-500/12'
                  : 'border-amber-300/60 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 dark:border-gray-600 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/80">
                <span className="font-bold">본인에게 게시 동의를 받았습니다.</span>
                <br />
                <span className="text-gray-500 dark:text-white/50">
                  실명과 얼굴 사진이 성도들에게 공개됩니다. 동의 없이는 등록할 수 없어요.
                </span>
              </span>
            </label>
            )}

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {error}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {isEdit && !photosChanged ? '저장 중...' : '업로드 중...'}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isEdit ? '수정 저장' : '새가족 등록'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────
const FieldGroup = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const QuickChip = ({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center px-3 h-8 rounded-full text-[11.5px] font-bold border transition-colors',
      active
        ? 'bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300'
        : 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/15 dark:border-purple-500/20 text-purple-600 dark:text-purple-300/80 hover:bg-purple-500/12 dark:hover:bg-purple-500/18',
    ].join(' ')}
  >
    {children}
  </button>
)

interface PhotoPreviewItemProps {
  src: string
  index: number
  isNew?: boolean
  /** 수정 모드에서만 새로 추가한 사진을 구분해준다 */
  showNewBadge?: boolean
  canMoveLeft: boolean
  canMoveRight: boolean
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
}

const PhotoPreviewItem = ({
  src,
  index,
  isNew,
  showNewBadge,
  canMoveLeft,
  canMoveRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: PhotoPreviewItemProps) => (
  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
    <img src={src} alt={`사진 ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />

    {index === 0 && (
      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center px-2 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold tracking-wide">
        대표
      </span>
    )}

    {showNewBadge && isNew && (
      <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 h-5 rounded-full bg-emerald-500/85 text-white text-[9.5px] font-bold tracking-wide">
        NEW
      </span>
    )}

    <button
      type="button"
      onClick={onRemove}
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
      aria-label={`사진 ${index + 1} 제거`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    <div className="absolute bottom-1.5 right-1.5 flex gap-0.5">
      <button
        type="button"
        onClick={onMoveLeft}
        disabled={!canMoveLeft}
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-purple-500/80 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
        aria-label="앞으로"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveRight}
        disabled={!canMoveRight}
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-purple-500/80 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
        aria-label="뒤로"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
)

export default NewFamilyComposer
