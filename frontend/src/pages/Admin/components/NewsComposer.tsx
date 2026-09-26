// 교회소식 등록·수정 모달 (관리자)
// Single Responsibility: 소식 폼 상태 + 이미지/첨부 슬롯 관리 후 저장
import { useEffect, useRef, useState } from 'react'
import { createNews, fetchNewsDetail, updateNews } from '../../../api/news'
import { createNotification } from '../../../api/notification'
import { showToast } from '../../../utils/toast'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { FieldGroup, QuickChip, dateTriggerClass } from '../../../components/common/ComposerFields'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter } from './AdminFormBits'
import DatePicker from '../../../components/common/DatePicker'
import type { NewsDetail, NewsItem } from '../../../types/news'

interface NewsComposerProps {
  /** 넘기면 수정 모드, 없으면 등록 모드 */
  news?: NewsItem
  onClose: () => void
  onSuccess: () => void
}

/** 이미지 한 칸 — 기존(서버)과 새로 고른 파일을 한 배열에서 다룬다 */
type ImageSlot =
  | { kind: 'existing'; id: number; url: string }
  | { kind: 'new'; file: File; url: string }

/** 문서 첨부 한 칸 */
type FileSlot =
  | { kind: 'existing'; id: number; name: string; size: number | null }
  | { kind: 'new'; file: File }

const MAX_IMAGES = 10
const MAX_FILES = 5
/** 업로드 전 클라이언트 리사이즈 — 포스터는 긴 변 1600px이면 충분 */
const UPLOAD_MAX_SIZE = 1600
const MAX_FILE_SIZE = 20 * 1024 * 1024
// '공지'는 빼 둔다 — 공지 팝업·알림(/admin/notifications)과 역할이 겹쳐 보여
// 관리자가 어느 화면에 올려야 하는지 헷갈리던 가장 직접적인 원인이었다.
const CATEGORY_PRESETS = ['안내', '행사', '모집', '보고', '감사']
const FILE_ACCEPT = '.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip'
/** 알림함·팝업에 실을 미리보기 길이 — 전문은 소식 원문에서 읽게 한다 */
const NOTICE_PREVIEW_LIMIT = 280

const pad = (n: number) => n.toString().padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = () => toDateInput(new Date())

const toDateOnly = (value: string | null): string => {
  if (!value) return today()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? today() : toDateInput(d)
}

/**
 * 소식 본문 → 알림 본문.
 * 알림은 "읽고 지나가는" 자리라 앞부분만 싣고, 전문은 link_url 로 원문에 맡긴다.
 */
const toNoticeBody = (content: string): string => {
  const body = content.trim()
  if (body.length <= NOTICE_PREVIEW_LIMIT) return body
  // 단어/문장 중간에서 끊기지 않게 마지막 줄바꿈·마침표 뒤에서 자른다
  const head = body.slice(0, NOTICE_PREVIEW_LIMIT)
  // 경계 문자를 포함한 위치에서 끊는다 — 인덱스 그대로 자르면 '…합니' 처럼 끝이 잘린다
  const cut = Math.max(
    head.lastIndexOf('\n') + 1,
    head.lastIndexOf('. ') + 2,
    head.lastIndexOf('요. ') + 3,
    head.lastIndexOf('다. ') + 3,
  )
  // 너무 앞에서 끊기면(경계가 앞머리에만 있으면) 차라리 글자 수대로 자른다
  return `${(cut > NOTICE_PREVIEW_LIMIT * 0.5 ? head.slice(0, cut) : head).trimEnd()}…`
}

/** 소식 원문 딥링크 — /news 의 '소식' 탭에서 해당 글 상세를 연다 */
const newsDeepLink = (newsId: number) => `/news?tab=news&post=${newsId}`

const formatSize = (bytes: number | null) => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

const NewsComposer = ({ news, onClose, onSuccess }: NewsComposerProps) => {
  const isEdit = !!news

  const [title, setTitle] = useState(news?.title ?? '')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(news?.category ?? '')
  const [author, setAuthor] = useState(news?.author ?? '관리자')
  const [publishedAt, setPublishedAt] = useState(toDateOnly(news?.published_at ?? null))
  const [isPublished, setIsPublished] = useState(news?.is_published ?? true)
  const [isPinned, setIsPinned] = useState(news?.is_pinned ?? false)
  // 등록할 때만 뜨는 옵션 — 켜면 소식 원문으로 가는 공지를 한 건 같이 만든다.
  // (같은 내용을 공지사항 화면에서 한 번 더 입력하지 않게 하는 게 목적)
  const [alsoNotify, setAlsoNotify] = useState(false)
  const [images, setImages] = useState<ImageSlot[]>([])
  const [files, setFiles] = useState<FileSlot[]>([])
  // 수정 모드는 본문·첨부를 상세 API로 채운다(목록에는 요약만 있다)
  const [loadingDetail, setLoadingDetail] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrls = useRef<string[]>([])

  useModalBackButton(onClose)

  useEffect(() => {
    if (!news) return
    let cancelled = false
    fetchNewsDetail(news.id)
      .then((detail: NewsDetail) => {
        if (cancelled) return
        setContent(detail.content)
        setImages(
          detail.attachments
            .filter((a) => a.kind === 'image')
            .map((a) => ({ kind: 'existing' as const, id: a.id, url: a.url })),
        )
        setFiles(
          detail.attachments
            .filter((a) => a.kind === 'file')
            .map((a) => ({
              kind: 'existing' as const,
              id: a.id,
              name: a.filename ?? '첨부파일',
              size: a.file_size,
            })),
        )
      })
      .catch((err) => {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : '내용을 불러오지 못했습니다', 'error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [news])

  // 미리보기용 objectURL 정리
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected?.length) return

    const accepted: ImageSlot[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name}은(는) 이미지 파일이 아닙니다`, 'error')
        continue
      }
      if (images.length + accepted.length >= MAX_IMAGES) {
        showToast(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`, 'error')
        break
      }
      const url = URL.createObjectURL(file)
      objectUrls.current.push(url)
      accepted.push({ kind: 'new', file, url })
    }

    setImages((prev) => [...prev, ...accepted])
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected?.length) return

    const accepted: FileSlot[] = []
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      if (file.size > MAX_FILE_SIZE) {
        showToast(`${file.name}은(는) 20MB를 넘어요`, 'error')
        continue
      }
      if (files.length + accepted.length >= MAX_FILES) {
        showToast(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있어요`, 'error')
        break
      }
      accepted.push({ kind: 'new', file })
    }

    setFiles((prev) => [...prev, ...accepted])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const moveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= images.length) return
    setImages((prev) => {
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !submitting && !loadingDetail

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      // 새 이미지는 업로드 전에 줄인다(원본 수 MB 그대로 올리지 않도록)
      const newImages: Blob[] = []
      for (const slot of images) {
        if (slot.kind === 'new') {
          newImages.push(await resizeImageToBlob(slot.file, UPLOAD_MAX_SIZE, 0.88))
        }
      }
      const newFiles = files.filter((f): f is Extract<FileSlot, { kind: 'new' }> => f.kind === 'new')
      // 유지할 기존 첨부 — 배열 순서가 곧 표시 순서(첫 이미지가 대표)
      const keepAttachmentIds = [
        ...images.filter((s) => s.kind === 'existing').map((s) => (s as { id: number }).id),
        ...files.filter((s) => s.kind === 'existing').map((s) => (s as { id: number }).id),
      ]

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
        author: author.trim() || undefined,
        isPublished,
        isPinned,
        publishedAt,
        images: newImages,
        files: newFiles.map((f) => f.file),
        keepAttachmentIds: isEdit ? keepAttachmentIds : undefined,
      }

      if (isEdit && news) {
        await updateNews(news.id, payload)
        showToast('수정되었습니다', 'success')
      } else {
        const created = await createNews(payload)
        showToast('소식이 등록되었습니다', 'success')

        // 알림 생성 실패는 소식 등록을 되돌리지 않는다 — 소식은 이미 올라갔으니
        // 알림만 공지 화면에서 다시 만들 수 있게 안내하고 넘어간다.
        if (alsoNotify && isPublished) {
          try {
            await createNotification({
              title: payload.title,
              content: toNoticeBody(payload.content),
              is_active: true,
              link_url: newsDeepLink(created.id),
            })
            showToast('알림함에도 공지로 올렸어요', 'success')
          } catch (notifyError) {
            showToast(
              notifyError instanceof Error
                ? `알림 생성 실패: ${notifyError.message}`
                : '소식은 올라갔지만 알림 생성에 실패했어요',
              'error',
            )
          }
        }
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

  // PC에선 좌(글) / 우(사진·첨부·옵션) 2단으로 펼친다
  return (
    <AdminComposerShell
      title={isEdit ? '소식 수정' : '소식 등록'}
      onClose={onClose}
      as="form"
      onSubmit={handleSubmit}
      gridCols="lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
      footer={
        <ComposerFooter
          onClose={onClose}
          canSubmit={canSubmit}
          submitting={submitting}
          submitLabel={isEdit ? '수정 저장' : '소식 등록'}
          cancelDisabled
        />
      }
      columns={[
        <>
            {loadingDetail && (
              <p className="text-[12.5px] font-semibold text-brand">내용을 불러오는 중...</p>
            )}

            {/* 제목 */}
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder="예) 주차 협조 안내"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 분류 */}
            <FieldGroup label="분류">
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORY_PRESETS.map((preset) => (
                  <QuickChip
                    key={preset}
                    active={category === preset}
                    onClick={() => setCategory((prev) => (prev === preset ? '' : preset))}
                  >
                    {preset}
                  </QuickChip>
                ))}
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value.slice(0, 50))}
                placeholder="직접 입력도 가능해요"
                className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 게시일 */}
            <FieldGroup label="게시일" required>
              <DatePicker
                value={publishedAt}
                onChange={setPublishedAt}
                className={dateTriggerClass}
              />
            </FieldGroup>

            {/* 본문 */}
            <FieldGroup label="내용" required>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                placeholder="성도들에게 전할 안내 내용을 적어주세요."
                rows={7}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none leading-[1.7] lg:min-h-[420px] lg:text-[15px]"
              />
              <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 mt-1 text-right tabular-nums">
                {content.length}/5000
              </p>
            </FieldGroup>
        </>,
        // 우 — 사진·첨부·게시 옵션
        <>

            {/* 이미지 */}
            <FieldGroup label="사진 · 포스터">
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                첫 번째 사진이 목록 썸네일이 돼요. 최대 {MAX_IMAGES}장, 업로드 전 자동으로 줄여서 올립니다.
              </p>
              <label className="relative block rounded-2xl border-2 border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors cursor-pointer p-4 text-center">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagePick}
                  className="hidden"
                  disabled={submitting}
                />
                <p className="text-[13px] font-bold text-ink-strong">사진 추가</p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">여러 장 선택 가능</p>
              </label>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 lg:grid-cols-4 gap-2">
                  {images.map((slot, idx) => (
                    <div
                      key={slot.kind === 'existing' ? `e${slot.id}` : slot.url}
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]"
                    >
                      <img
                        src={slot.url}
                        alt={`사진 ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center px-2 h-5 rounded-full bg-brand text-white text-[10px] font-bold">
                          대표
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                        aria-label={`사진 ${idx + 1} 제거`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1.5 right-1.5 flex gap-0.5">
                        <MoveButton
                          disabled={idx === 0}
                          onClick={() => moveImage(idx, -1)}
                          label="앞으로"
                          direction="left"
                        />
                        <MoveButton
                          disabled={idx === images.length - 1}
                          onClick={() => moveImage(idx, 1)}
                          label="뒤로"
                          direction="right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FieldGroup>

            {/* 첨부파일 */}
            <FieldGroup label="첨부파일">
              <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                PDF · HWP · 오피스 문서 등 최대 {MAX_FILES}개, 개당 20MB까지
              </p>
              <label className="relative block rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-brand transition-colors cursor-pointer px-4 py-3 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  multiple
                  onChange={handleFilePick}
                  className="hidden"
                  disabled={submitting}
                />
                <span className="text-[13px] font-bold text-ink-strong">파일 첨부</span>
              </label>

              {files.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {files.map((slot, idx) => (
                    <li
                      key={slot.kind === 'existing' ? `e${slot.id}` : `n${idx}-${slot.file.name}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-[12.5px] font-semibold text-ink-strong truncate">
                          {slot.kind === 'existing' ? slot.name : slot.file.name}
                        </span>
                        <span className="block text-[11px] text-gray-500 dark:text-white/45">
                          {formatSize(slot.kind === 'existing' ? slot.size : slot.file.size)}
                          {slot.kind === 'new' && <span className="ml-1 text-brand font-bold">새 파일</span>}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="shrink-0 w-7 h-7 rounded-full text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        aria-label="첨부 제거"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>

            {/* 작성자 */}
            <FieldGroup label="작성자 표시">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value.slice(0, 100))}
                placeholder="관리자"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
              />
            </FieldGroup>

            {/* 공개 / 고정 */}
            <FieldGroup label="게시 옵션">
              <ToggleRow
                title={isPublished ? '성도에게 공개' : '비공개 (관리자만)'}
                desc="공개하면 비로그인 방문자도 볼 수 있어요"
                active={isPublished}
                onClick={() => setIsPublished((v) => !v)}
              />
              <div className="h-2" />
              <ToggleRow
                title={isPinned ? '목록 상단 고정' : '고정하지 않음'}
                desc="중요한 안내를 목록 맨 위에 붙여둡니다"
                active={isPinned}
                onClick={() => setIsPinned((v) => !v)}
              />
            </FieldGroup>

            {/* 알림 동시 발행 — 등록할 때만. 수정에서 켜면 같은 알림이 또 생긴다 */}
            {!isEdit && (
              <FieldGroup label="알림으로도 알리기">
                <ToggleRow
                  title={alsoNotify ? '알림함·홈 배너에도 올림' : '소식 게시판에만 올림'}
                  desc={
                    isPublished
                      ? '앞부분만 알림으로 나가고, 탭하면 이 소식 원문이 열려요'
                      : '비공개 소식은 알림으로 보낼 수 없어요'
                  }
                  active={alsoNotify && isPublished}
                  onClick={() => {
                    if (!isPublished) {
                      showToast('먼저 성도에게 공개로 바꿔주세요', 'error')
                      return
                    }
                    setAlsoNotify((v) => !v)
                  }}
                />
                {alsoNotify && isPublished && (
                  <p className="text-[11px] text-gray-500 dark:text-white/45 mt-2 leading-[1.6]">
                    홈 전면 팝업으로 띄우려면 등록 뒤 <span className="font-bold text-brand">공지 팝업·알림</span> 화면에서 팝업을 켜주세요.
                  </p>
                )}
              </FieldGroup>
            )}

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {error}
              </div>
            )}
        </>,
      ]}
    />
  )
}

// ── Helpers ──────────────────────────────────────────────
const ToggleRow = ({
  title,
  desc,
  active,
  onClick,
}: {
  title: string
  desc: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-left"
  >
    <div className="min-w-0">
      <p className="text-[13.5px] font-bold text-ink-strong">{title}</p>
      <p className="text-[11.5px] text-gray-500 dark:text-white/45 mt-0.5">{desc}</p>
    </div>
    <span
      className={[
        'relative shrink-0 w-12 h-7 rounded-full transition-colors',
        active ? 'bg-brand shadow-[0_0_16px_var(--brand-glow)]' : 'bg-gray-300 dark:bg-white/15',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all',
          active ? 'left-6' : 'left-1',
        ].join(' ')}
      />
    </span>
  </button>
)

const MoveButton = ({
  disabled,
  onClick,
  label,
  direction,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  direction: 'left' | 'right'
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="w-6 h-6 rounded-full bg-black/55 hover:bg-brand text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/55"
  >
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left' ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  </button>
)

export default NewsComposer
