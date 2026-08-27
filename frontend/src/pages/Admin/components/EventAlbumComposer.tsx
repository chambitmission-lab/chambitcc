// 행사 앨범 등록/수정 composer (NewFamilyComposer 미러링)
// slide-up 모달 + pill grid 태그 + 사진 슬롯 + 일정 연결(검색 선택)
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createEventAlbumPost,
  syncEventAlbumPhotos,
  updateEventAlbumPost,
} from '../../../api/eventAlbum'
import { fetchAllEvents } from '../../../api/event'
import { showToast } from '../../../utils/toast'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import DatePicker from '../../../components/common/DatePicker'
import { EVENT_ALBUM_TAGS } from '../../../types/eventAlbum'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import type { Event } from '../../../types/event'
import { EventTagIcon } from '../../News/components/NewsIcons'

interface EventAlbumComposerProps {
  /** 넘기면 수정 모드, 없으면 등록 모드 */
  post?: EventAlbumPost
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

const MAX_PHOTOS = 20
/** 업로드 전 클라이언트 리사이즈 — 피드는 1080px이면 충분 */
const UPLOAD_MAX_SIZE = 1080

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getToday = (): string => toDateInput(new Date())

/** 이번 주 일요일(오늘 포함, 지난 일요일) — 행사도 주일에 몰린다 */
const getThisSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return toDateInput(d)
}

/** 사진 구성이 처음과 같은지 비교할 서명 — 순서까지 포함 */
const slotSignature = (slots: PhotoSlot[]) =>
  slots.map(s => (s.kind === 'existing' ? `e${s.id}` : `n${s.url}`)).join('|')

/** 일정 날짜 요약 (start_datetime → M/D) */
const eventDateLabel = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const EventAlbumComposer = ({ post, onClose, onSuccess }: EventAlbumComposerProps) => {
  const isEdit = !!post

  const [title, setTitle] = useState(post?.title ?? '')
  const [eventDate, setEventDate] = useState(post?.event_date ?? getThisSunday())
  const [tag, setTag] = useState(post?.tag ?? '')
  const [caption, setCaption] = useState(post?.caption ?? '')
  const [eventId, setEventId] = useState<number | null>(post?.event_id ?? null)
  const [slots, setSlots] = useState<PhotoSlot[]>(
    () => post?.photos.map(p => ({ kind: 'existing' as const, id: p.id, url: p.url })) ?? [],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialSignature = useRef(slotSignature(slots))

  // ── 연결할 일정 목록 (관리자 전체 일정, 최근 50개) ──
  const [events, setEvents] = useState<Event[]>([])
  const [eventSearch, setEventSearch] = useState('')

  useModalBackButton(onClose)

  useEffect(() => {
    let cancelled = false
    fetchAllEvents(0, 50)
      .then(res => {
        if (!cancelled) setEvents(res.data.items)
      })
      .catch(() => {
        /* 일정 연결은 옵션이라 실패해도 등록은 막지 않는다 */
      })
    return () => {
      cancelled = true
    }
  }, [])

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
    title.trim().length > 0 &&
    eventDate.length > 0 &&
    tag.length > 0 &&
    slots.length > 0 &&
    !submitting

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
        await updateEventAlbumPost(post.id, {
          title: title.trim(),
          event_date: eventDate,
          tag,
          caption: caption.trim() || null,
          event_id: eventId,
        })
        // 사진은 바뀐 경우에만 — 불필요한 재업로드/재정렬을 피한다
        if (photosChanged) {
          const { files, order } = await buildPhotoPayload()
          await syncEventAlbumPhotos(post.id, order, files)
        }
        showToast('수정되었습니다', 'success')
      } else {
        const { files } = await buildPhotoPayload()
        await createEventAlbumPost({
          title: title.trim(),
          caption: caption.trim() || undefined,
          eventDate,
          tag,
          eventId: eventId ?? undefined,
          files,
        })
        showToast('행사 앨범이 등록되었습니다', 'success')
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

  const isToday = eventDate === getToday()
  const isThisSunday = eventDate === getThisSunday()

  const selectedEvent = eventId != null ? events.find(ev => ev.id === eventId) : undefined
  const searchTerm = eventSearch.trim().toLowerCase()
  const matchedEvents = searchTerm
    ? events.filter(ev => ev.title.toLowerCase().includes(searchTerm)).slice(0, 8)
    : events.slice(0, 5)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {isEdit ? '행사 앨범 수정' : '행사 앨범 등록'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
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
            {/* 제목 */}
            <FieldGroup label="행사 제목" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 2026 여름 수련회 / 부활절 연합 예배"
                maxLength={100}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 행사 날짜 */}
            <FieldGroup label="행사 날짜" required>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <QuickChip active={isToday} onClick={() => setEventDate(getToday())}>
                  오늘
                </QuickChip>
                <QuickChip active={isThisSunday} onClick={() => setEventDate(getThisSunday())}>
                  이번 주일
                </QuickChip>
              </div>
              {/* 네이티브 date 입력은 mm/dd/yyyy·OS 달력이라 앱 공통 DatePicker로 */}
              <DatePicker
                value={eventDate}
                onChange={setEventDate}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-left text-ink-strong hover:border-brand focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 태그 — pill grid (native select 금지) */}
            <FieldGroup label="행사 태그" required>
              <div className="flex gap-1.5 flex-wrap">
                {EVENT_ALBUM_TAGS.map(t => (
                  <QuickChip key={t} active={tag === t} onClick={() => setTag(t)}>
                    <EventTagIcon tag={t} width={13} height={13} className="mr-1 shrink-0" />
                    {t}
                  </QuickChip>
                ))}
              </div>
            </FieldGroup>

            {/* 캡션 */}
            <FieldGroup label="캡션 · 소개">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 1000))}
                placeholder="행사의 은혜와 추억을 짧게 적어주세요."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {caption.length}/1000
              </p>
            </FieldGroup>

            {/* 연결할 일정 (옵션) */}
            <FieldGroup label="연결할 일정 (선택)">
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                일정과 연결하면 피드 카드와 일정 상세 화면이 서로 이어져요.
              </p>

              {selectedEvent || eventId != null ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--brand-glow)] bg-[var(--brand-soft)]">
                  <span className="text-[15px]" aria-hidden="true">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink-strong truncate">
                      {selectedEvent?.title ?? `일정 #${eventId}`}
                    </p>
                    {selectedEvent && (
                      <p className="text-[11px] text-gray-500 dark:text-white/50">
                        {eventDateLabel(selectedEvent.start_datetime)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventId(null)}
                    aria-label="일정 연결 해제"
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-white/60 dark:hover:bg-white/[0.08] hover:text-red-500 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="일정 제목으로 검색"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
                  />
                  {matchedEvents.length > 0 && (
                    <div className="mt-2 rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {matchedEvents.map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => {
                            setEventId(ev.id)
                            setEventSearch('')
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left bg-white dark:bg-white/[0.02] hover:bg-[var(--brand-soft)] transition-colors"
                        >
                          <span className="shrink-0 inline-flex items-center px-2 h-5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 text-[10.5px] font-bold tabular-nums">
                            {eventDateLabel(ev.start_datetime)}
                          </span>
                          <span className="flex-1 min-w-0 text-[13px] font-semibold text-ink-strong truncate">
                            {ev.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {events.length === 0 && (
                    <p className="mt-2 text-[11.5px] text-gray-400 dark:text-white/35">
                      불러올 일정이 없어요. 연결 없이 등록해도 됩니다.
                    </p>
                  )}
                </>
              )}
            </FieldGroup>

            {/* 사진 */}
            <FieldGroup label="사진" required>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                첫 번째 사진이 대표 이미지가 돼요. 최대 {MAX_PHOTOS}장, 업로드 전 자동으로 줄여서 올립니다.
              </p>

              <label className="relative block rounded-2xl border-2 border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors cursor-pointer p-5 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={submitting}
                />
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand-soft-strong)] mb-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-ink-strong">사진 추가</p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">여러 장 선택 가능</p>
              </label>

              {slots.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-white/80">
                      등록된 사진
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[10.5px] font-bold">
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
                    <p className="mt-2 text-[11px] font-semibold text-brand">
                      사진 변경사항은 저장할 때 반영돼요
                    </p>
                  )}
                </div>
              )}
            </FieldGroup>

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
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
                  {isEdit ? '수정 저장' : '앨범 등록'}
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
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
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
        ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
        : 'bg-transparent border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] hover:text-brand',
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
      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center px-2 h-5 rounded-full bg-brand text-white text-[10px] font-bold tracking-wide">
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
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-brand text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
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
        className="w-6 h-6 rounded-full bg-black/55 hover:bg-brand text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
        aria-label="뒤로"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
)

export default EventAlbumComposer
