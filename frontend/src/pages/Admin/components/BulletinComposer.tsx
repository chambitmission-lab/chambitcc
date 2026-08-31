import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  addBulletinPage,
  createBulletin,
  deleteBulletinPage,
  getBulletinDetail,
  reorderBulletinPages,
  updateBulletin,
} from '../../../api/bulletin'
import type { Bulletin } from '../../../types/bulletin'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import DatePicker from '../../../components/common/DatePicker'

interface BulletinComposerProps {
  onClose: () => void
  onSuccess: () => void
  /** 주면 수정 모드 — 제목·날짜·설명과 페이지(추가·삭제·순서)를 함께 고친다 */
  bulletin?: Bulletin | null
}

/**
 * 페이지 한 장 — 이미 올라가 있는 페이지(existing)와 이번에 고른 파일(new)을
 * 한 배열에 섞어 다룬다. 그래야 순서 이동·삭제 UI가 둘을 구분하지 않아도 된다.
 * 저장할 때 existing 은 id 로, new 는 업로드 후 받은 id 로 최종 순서를 만든다.
 */
type PageItem =
  | { kind: 'existing'; id: number; src: string }
  | { kind: 'new'; file: File; src: string }

/* DatePicker 트리거 — 이 폼의 다른 입력과 같은 테두리·높이·글자 크기로 맞춘다.
   brand는 CSS 변수 색이라 border-brand/60 같은 투명도 수식자를 쓸 수 없다 */
const datePickerTriggerClass =
  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-left text-ink-strong hover:border-brand focus:outline-none focus:border-brand transition-colors'

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// 주보는 "다가오는 주일"에 발행한다. 이번 주 일요일 = 오늘 이후 가장 가까운 일요일
// (오늘이 일요일이면 오늘), 다음 주 일요일 = 그로부터 7일 뒤.
// (예전엔 '오늘 - 요일'로 이미 지난 일요일을 "이번 주"라 불러, 토요일에 열면
//  이번 주=지난 주일·다음 주=내일 로 한 주씩 밀려 보였다)
const getThisSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return toDateInput(d)
}

const getNextSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7) + 7)
  return toDateInput(d)
}

const BulletinComposer = ({ onClose, onSuccess, bulletin = null }: BulletinComposerProps) => {
  const isEdit = !!bulletin
  const [title, setTitle] = useState(bulletin?.title ?? '')
  const [description, setDescription] = useState(bulletin?.description ?? '')
  // 저장된 주보 날짜는 'YYYY-MM-DDTHH:mm:ss' — 앞 10자가 곧 DatePicker 값이다
  const [bulletinDate, setBulletinDate] = useState(
    bulletin ? bulletin.bulletin_date.slice(0, 10) : getThisSunday(),
  )
  const [items, setItems] = useState<PageItem[]>([])
  /** 수정 모드에서 지운 기존 페이지 — 저장할 때 한꺼번에 삭제한다 */
  const [removedPageIds, setRemovedPageIds] = useState<number[]>([])
  const [loadingPages, setLoadingPages] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 언마운트 시 해제할 objectURL — items 를 클로저로 잡으면 옛 배열이 남아 못 지운다
  const objectUrlsRef = useRef<string[]>([])
  /** 불러온 시점의 페이지 순서 — 순서를 안 건드렸으면 재정렬 요청을 아낀다 */
  const loadedOrderRef = useRef<number[]>([])

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  // 미리보기 URL은 unmount 시 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  // 수정 모드 — 기존 페이지를 불러와 목록에 채운다 (조회수는 올리지 않는다)
  useEffect(() => {
    if (!bulletin) return
    let alive = true
    void (async () => {
      try {
        const detail = await getBulletinDetail(bulletin.id, false)
        if (!alive) return
        const pages = [...(detail.pages ?? [])].sort((a, b) => a.page_number - b.page_number)
        loadedOrderRef.current = pages.map(page => page.id)
        setItems(pages.map(page => ({ kind: 'existing', id: page.id, src: page.image_url })))
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : '주보 페이지를 불러오지 못했습니다')
      } finally {
        if (alive) setLoadingPages(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [bulletin])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    const accepted: PageItem[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다`, 'error')
        continue
      }
      const src = URL.createObjectURL(file)
      objectUrlsRef.current.push(src)
      accepted.push({ kind: 'new', file, src })
    }

    setItems(prev => [...prev, ...accepted])
    if (accepted.length > 0) {
      showToast(`${accepted.length}개의 페이지가 추가되었습니다`, 'success')
    }
    // 같은 파일 재선택 가능하도록 input 리셋
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemove = (idx: number) => {
    const target = items[idx]
    if (!target) return
    if (target.kind === 'existing') {
      // 서버에서 지우는 건 저장할 때 — 취소하고 닫으면 그대로 남아 있어야 한다
      setRemovedPageIds(prev => [...prev, target.id])
    } else {
      URL.revokeObjectURL(target.src)
      objectUrlsRef.current = objectUrlsRef.current.filter(url => url !== target.src)
    }
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= items.length) return
    setItems(prev => {
      const next = [...prev]
      const tmp = next[idx]
      next[idx] = next[target]
      next[target] = tmp
      return next
    })
  }

  // 날짜는 DatePicker로 옮기며 네이티브 required가 없어졌으니 여기서 직접 확인한다
  const canSubmit =
    title.trim().length > 0 &&
    bulletinDate.length > 0 &&
    items.length > 0 &&
    !submitting &&
    !loadingPages

  /** 수정 저장 — 정보 → 페이지 삭제 → 새 페이지 업로드 → 최종 순서 반영 */
  const saveEdit = async (isoDate: string) => {
    if (!bulletin) return
    await updateBulletin(bulletin.id, {
      title: title.trim(),
      description: description.trim(),
      bulletin_date: isoDate,
    })

    for (const pageId of removedPageIds) {
      await deleteBulletinPage(pageId)
    }

    // 새 페이지는 일단 뒤에 붙이고(page_number 생략), 순서는 아래에서 한 번에 맞춘다
    const orderedIds: number[] = []
    const newIds: number[] = []
    for (const item of items) {
      if (item.kind === 'existing') {
        orderedIds.push(item.id)
      } else {
        const pageId = await addBulletinPage(bulletin.id, item.file)
        orderedIds.push(pageId)
        newIds.push(pageId)
      }
    }

    // 서버는 [남아 있는 기존 페이지(원래 순서), 새로 올린 페이지] 순으로 갖고 있다.
    // 원하는 순서가 그것과 같으면 재정렬은 불필요하다.
    const keptIds = loadedOrderRef.current.filter(id => orderedIds.includes(id))
    const serverOrder = [...keptIds, ...newIds]
    const sameOrder =
      serverOrder.length === orderedIds.length &&
      serverOrder.every((id, i) => id === orderedIds[i])
    if (!sameOrder) {
      await reorderBulletinPages(bulletin.id, orderedIds)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const isoDate = new Date(bulletinDate).toISOString()
      if (isEdit) {
        await saveEdit(isoDate)
        showToast('주보가 수정되었습니다', 'success')
      } else {
        const files = items.flatMap(item => (item.kind === 'new' ? [item.file] : []))
        await createBulletin(title.trim(), isoDate, description.trim(), files)
        showToast('주보가 등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? '주보 수정에 실패했습니다'
            : '주보 등록에 실패했습니다',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickDate = (which: 'thisWeek' | 'nextWeek') => {
    setBulletinDate(which === 'thisWeek' ? getThisSunday() : getNextSunday())
  }

  const isThisWeek = bulletinDate === getThisSunday()
  const isNextWeek = bulletinDate === getNextSunday()

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
              {isEdit ? '주보 수정' : '새 주보 등록'}
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

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {/* 제목 */}
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 2026년 5월 셋째 주 주보"
                maxLength={120}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 주보 날짜 */}
            <FieldGroup label="주보 날짜" required>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                <QuickChip active={isThisWeek} onClick={() => handleQuickDate('thisWeek')}>
                  이번 주 일요일
                </QuickChip>
                <QuickChip active={isNextWeek} onClick={() => handleQuickDate('nextWeek')}>
                  다음 주 일요일
                </QuickChip>
              </div>
              {/* 네이티브 date 입력은 mm/dd/yyyy·OS 달력이라 앱 공통 DatePicker로.
                  주보는 주일 발행이라 sundayMode로 일요일을 도드라지게 한다 */}
              <DatePicker
                value={bulletinDate}
                onChange={setBulletinDate}
                sundayMode
                className={datePickerTriggerClass}
              />
            </FieldGroup>

            {/* 설명 */}
            <FieldGroup label="설명">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이번 주 주보의 핵심 메시지나 안내사항을 적어주세요."
                rows={3}
                maxLength={400}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.6]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {description.length}/400
              </p>
            </FieldGroup>

            {/* 페이지 업로드 */}
            <FieldGroup label="주보 페이지" required>
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                {isEdit
                  ? '이미 올라간 페이지도 순서 변경·제거할 수 있어요. 변경은 저장할 때 한 번에 반영됩니다.'
                  : '선택한 순서대로 페이지가 구성됩니다. 화살표로 순서 변경, ✕ 로 제거할 수 있어요.'}
              </p>

              {/* 드롭존 */}
              <label
                className="relative block rounded-2xl border-2 border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors cursor-pointer p-5 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={submitting || loadingPages}
                />
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand-soft-strong)] mb-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-bold text-ink-strong">
                  이미지 페이지 추가
                </p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  여러 장 선택 가능
                </p>
              </label>

              {/* 페이지 미리보기 grid — 기존 페이지와 새로 고른 파일을 한 줄에 섞어 보여준다 */}
              {loadingPages ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
                    />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-gray-700 dark:text-white/80">
                      등록된 페이지
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand text-[10.5px] font-bold">
                      {items.length}장
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item, idx) => (
                      <PagePreviewItem
                        key={item.kind === 'existing' ? `page-${item.id}` : item.src}
                        src={item.src}
                        index={idx}
                        isNew={item.kind === 'new'}
                        showNewBadge={isEdit}
                        canMoveLeft={idx > 0}
                        canMoveRight={idx < items.length - 1}
                        onRemove={() => handleRemove(idx)}
                        onMoveLeft={() => handleMove(idx, -1)}
                        onMoveRight={() => handleMove(idx, 1)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
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
                  {isEdit ? '저장 중...' : '업로드 중...'}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isEdit ? '수정 저장' : '주보 등록'}
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

interface PagePreviewItemProps {
  src: string
  index: number
  /** 이번에 고른 파일(아직 업로드 전) */
  isNew?: boolean
  /** 수정 모드에서만 '새로 추가' 배지를 띄운다 — 등록 화면에선 전부 새 파일이라 소음 */
  showNewBadge?: boolean
  canMoveLeft: boolean
  canMoveRight: boolean
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
}

const PagePreviewItem = ({
  src,
  index,
  isNew,
  showNewBadge,
  canMoveLeft,
  canMoveRight,
  onRemove,
  onMoveLeft,
  onMoveRight,
}: PagePreviewItemProps) => (
  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] group">
    <img src={src} alt={`페이지 ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
    {/* 그라데이션 오버레이 */}
    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/65 to-transparent pointer-events-none" />

    {/* 페이지 번호 */}
    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center px-2 h-5 rounded-full bg-brand text-white text-[10.5px] font-bold tracking-wide">
      P.{index + 1}
    </span>

    {isNew && showNewBadge && (
      <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 h-5 rounded-full bg-white/90 dark:bg-black/70 text-brand text-[9.5px] font-bold tracking-wide">
        NEW
      </span>
    )}

    {/* 제거 버튼 */}
    <button
      type="button"
      onClick={onRemove}
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
      aria-label={`페이지 ${index + 1} 제거`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>

    {/* 순서 이동 버튼 */}
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

export default BulletinComposer
