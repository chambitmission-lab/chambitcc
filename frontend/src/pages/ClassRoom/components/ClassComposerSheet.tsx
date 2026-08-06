// 알림 작성 바텀시트 (교사 전용) — 공지/암송요절/일정/사진/투표 5가지 유형
// + 예약 발행, 자주 쓰는 템플릿(localStorage)
import { useMemo, useRef, useState } from 'react'
import { useBibleBooks, useBibleChapter } from '../../../hooks/useBible'
import { useCreateClassPost } from '../../../hooks/useClassRoom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ClassPostCreateRequest, ClassPostType } from '../../../types/classRoom'
import { resizeImageToBlob } from '../../../utils/imageResize'
import { showToast } from '../../../utils/toast'

const MAX_PHOTOS = 10
const MAX_POLL_OPTIONS = 8
const TEMPLATE_KEY = 'class_post_templates_v1'
const MAX_TEMPLATES = 10

// 자주 쓰는 글 템플릿 — 텍스트 성격의 필드만 저장한다 (사진/날짜 제외)
interface PostTemplate {
  id: number
  name: string
  postType: ClassPostType
  title: string
  content: string
  weekLabel: string
  pollOptions: string[]
  pollMultiple: boolean
}

const loadTemplates = (): PostTemplate[] => {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveTemplates = (templates: PostTemplate[]) => {
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates))
  } catch {
    /* 저장 실패는 조용히 무시 */
  }
}

const TYPE_TABS: { value: ClassPostType; label: string }[] = [
  { value: 'notice', label: '📢 공지' },
  { value: 'verse', label: '📖 암송요절' },
  { value: 'event', label: '📅 일정' },
  { value: 'photo', label: '📷 사진' },
  { value: 'poll', label: '🗳 투표' },
]

interface ClassComposerSheetProps {
  classId: number
  onClose: () => void
}

const ClassComposerSheet = ({ classId, onClose }: ClassComposerSheetProps) => {
  const createPost = useCreateClassPost(classId)
  const [postType, setPostType] = useState<ClassPostType>('notice')

  // 공통
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  // 암송요절
  const { data: books } = useBibleBooks()
  const [bookNumber, setBookNumber] = useState(49) // 에베소서부터 — 교회학교 암송 단골
  const [chapter, setChapter] = useState(1)
  const [verseStart, setVerseStart] = useState(1)
  const [verseEnd, setVerseEnd] = useState(1)
  const [weekLabel, setWeekLabel] = useState('')
  const book = useMemo(
    () => books?.find((b) => b.book_number === bookNumber),
    [books, bookNumber],
  )
  const { data: chapterData } = useBibleChapter(bookNumber, chapter, postType === 'verse')
  const verseCount = chapterData?.verses.length ?? 0
  const previewText = useMemo(() => {
    if (!chapterData) return ''
    const end = Math.max(verseStart, verseEnd)
    return chapterData.verses
      .filter((v) => v.verse >= verseStart && v.verse <= end)
      .map((v) => v.text)
      .join(' ')
  }, [chapterData, verseStart, verseEnd])

  // 일정
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [location, setLocation] = useState('')
  const [deadline, setDeadline] = useState('')

  // 사진
  const [photos, setPhotos] = useState<{ file: File; previewUrl: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 투표
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollMultiple, setPollMultiple] = useState(false)

  // 예약 발행
  const [publishAt, setPublishAt] = useState('')

  // 템플릿
  const [templates, setTemplates] = useState<PostTemplate[]>(loadTemplates)

  useModalBackButton(onClose)

  const applyTemplate = (t: PostTemplate) => {
    setPostType(t.postType)
    setTitle(t.title)
    setContent(t.content)
    setWeekLabel(t.weekLabel)
    if (t.pollOptions.length >= 2) setPollOptions(t.pollOptions)
    setPollMultiple(t.pollMultiple)
    showToast(`'${t.name}' 템플릿을 불러왔어요`, 'success')
  }

  const handleSaveTemplate = () => {
    const name = (title.trim() || content.trim().slice(0, 20) || '').trim()
    if (!name) {
      showToast('제목이나 내용을 먼저 적어야 템플릿으로 저장할 수 있어요', 'error')
      return
    }
    const next: PostTemplate[] = [
      {
        id: Date.now(),
        name,
        postType,
        title: title.trim(),
        content,
        weekLabel,
        pollOptions: postType === 'poll' ? pollOptions.filter((o) => o.trim()) : [],
        pollMultiple,
      },
      ...templates,
    ].slice(0, MAX_TEMPLATES)
    setTemplates(next)
    saveTemplates(next)
    showToast('템플릿으로 저장했어요. 다음부터 한 번에 불러올 수 있어요!', 'success')
  }

  const handleDeleteTemplate = (id: number) => {
    const next = templates.filter((t) => t.id !== id)
    setTemplates(next)
    saveTemplates(next)
  }

  const handlePickPhotos = async (list: FileList | null) => {
    if (!list) return
    const room = MAX_PHOTOS - photos.length
    const picked = Array.from(list).slice(0, room)
    if (Array.from(list).length > room) {
      showToast(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`, 'error')
    }
    try {
      const resized = await Promise.all(
        picked.map(async (file) => {
          // 업로드 전 리사이즈 — 원본 수 MB를 그대로 올리지 않는다
          const blob = await resizeImageToBlob(file, 1600, 0.85)
          const jpeg = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
            type: 'image/jpeg',
          })
          return { file: jpeg, previewUrl: URL.createObjectURL(blob) }
        }),
      )
      setPhotos((prev) => [...prev, ...resized])
    } catch {
      showToast('이미지 처리에 실패했어요', 'error')
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = (): string | null => {
    if (postType === 'notice' && !content.trim()) return '공지 내용을 입력해주세요'
    if (postType === 'verse' && !previewText) return '암송할 말씀을 선택해주세요'
    if (postType === 'event') {
      if (!title.trim()) return '일정 이름을 입력해주세요'
      if (!startAt) return '일정 시작 시간을 선택해주세요'
      if (deadline && startAt && deadline > startAt)
        return '응답 마감은 일정 시작 전이어야 해요'
    }
    if (postType === 'photo' && photos.length === 0) return '사진을 한 장 이상 골라주세요'
    if (postType === 'poll') {
      if (!title.trim() && !content.trim()) return '무엇을 묻는 투표인지 적어주세요'
      if (pollOptions.filter((o) => o.trim()).length < 2)
        return '투표 선택지를 2개 이상 적어주세요'
    }
    if (publishAt && new Date(publishAt).getTime() <= Date.now())
      return '예약 시각은 지금보다 뒤여야 해요'
    return null
  }

  const handleSubmit = async () => {
    const problem = validate()
    if (problem) {
      showToast(problem, 'error')
      return
    }
    const payload: ClassPostCreateRequest = {
      post_type: postType,
      title: title.trim() || null,
      content: content.trim(),
      is_pinned: postType === 'notice' ? isPinned : false,
      publish_at: publishAt || null,
    }
    if (postType === 'verse') {
      payload.verse = {
        book_number: bookNumber,
        chapter,
        verse_start: verseStart,
        verse_end: Math.max(verseStart, verseEnd),
        week_label: weekLabel.trim() || null,
      }
    }
    if (postType === 'event') {
      payload.event = {
        start_at: startAt,
        end_at: endAt || null,
        location: location.trim() || null,
        rsvp_deadline: deadline || null,
      }
    }
    if (postType === 'poll') {
      payload.poll = {
        options: pollOptions.map((o) => o.trim()).filter(Boolean),
        multiple: pollMultiple,
      }
    }
    try {
      await createPost.mutateAsync({
        payload,
        files: postType === 'photo' ? photos.map((p) => p.file) : [],
      })
      showToast(
        publishAt
          ? '예약했어요! 발행 시각에 맞춰 자동으로 알림이 가요 ⏰'
          : '알림을 보냈어요! 반 멤버들에게 알림이 가요 📮',
        'success',
      )
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '알림 작성에 실패했습니다', 'error')
    }
  }

  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[14px] focus:outline-none focus:border-brand'
  const labelCls = 'block text-[12px] font-bold text-gray-500 dark:text-white/55 mb-1.5'
  const selectCls =
    'px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] text-[13px] font-semibold focus:outline-none focus:border-brand'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white dark:bg-[#15151d] p-5 pb-8 shadow-2xl"
        style={{ maxHeight: 'calc(var(--vvh, 100dvh) * 0.92)' }}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15 mx-auto mb-4" />
        <h3 className="text-[17px] font-bold text-ink-strong mb-4">알림 쓰기</h3>

        {/* 유형 탭 */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPostType(tab.value)}
              className={`px-3 py-2 rounded-full text-[12.5px] font-bold transition-all ${
                postType === tab.value
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 자주 쓰는 템플릿 */}
        {templates.length > 0 && (
          <div className="mb-5">
            <p className="text-[11.5px] font-bold text-gray-400 dark:text-white/40 mb-1.5">
              자주 쓰는 템플릿
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {templates.map((t) => (
                <span
                  key={t.id}
                  className="shrink-0 inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-[12px] font-semibold text-brand"
                >
                  <button type="button" onClick={() => applyTemplate(t)} className="max-w-[140px] truncate">
                    {t.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.id)}
                    aria-label="템플릿 삭제"
                    className="w-4 h-4 rounded-full flex items-center justify-center text-brand/60 hover:text-red-500 text-[11px]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── 공지 ── */}
        {postType === 'notice' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>제목 (선택)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="예: 여름성경학교 안내"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                maxLength={2000}
                placeholder={'학부모님들께 전할 내용을 적어주세요.\n일정·준비물·회비 안내 등'}
                className={`${inputCls} resize-none leading-[1.7]`}
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13px] font-semibold text-gray-700 dark:text-white/75">
                📌 알림장 맨 위에 고정하기
              </span>
            </label>
          </div>
        )}

        {/* ── 암송요절 ── */}
        {postType === 'verse' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>이번 주 (선택)</label>
              <input
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                maxLength={50}
                placeholder="예: 8월 1주"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>말씀 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={bookNumber}
                  onChange={(e) => {
                    setBookNumber(Number(e.target.value))
                    setChapter(1)
                    setVerseStart(1)
                    setVerseEnd(1)
                  }}
                  className={selectCls}
                >
                  {(books ?? []).map((b) => (
                    <option key={b.book_number} value={b.book_number}>
                      {b.book_name_ko}
                    </option>
                  ))}
                </select>
                <select
                  value={chapter}
                  onChange={(e) => {
                    setChapter(Number(e.target.value))
                    setVerseStart(1)
                    setVerseEnd(1)
                  }}
                  className={selectCls}
                >
                  {Array.from({ length: book?.chapter_count ?? 1 }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>{c}장</option>
                  ))}
                </select>
                <select
                  value={verseStart}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setVerseStart(v)
                    if (verseEnd < v) setVerseEnd(v)
                  }}
                  className={selectCls}
                >
                  {Array.from({ length: Math.max(1, verseCount) }, (_, i) => i + 1).map((v) => (
                    <option key={v} value={v}>{v}절부터</option>
                  ))}
                </select>
                <select
                  value={Math.max(verseStart, verseEnd)}
                  onChange={(e) => setVerseEnd(Number(e.target.value))}
                  className={selectCls}
                >
                  {Array.from(
                    { length: Math.max(1, verseCount - verseStart + 1) },
                    (_, i) => verseStart + i,
                  ).map((v) => (
                    <option key={v} value={v}>{v}절까지</option>
                  ))}
                </select>
              </div>
            </div>
            {previewText && (
              <div className="px-4 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-400/[0.08] border border-amber-200/60 dark:border-amber-300/20">
                <p className="text-[13.5px] leading-[1.75] text-gray-800 dark:text-white/90 break-keep">
                  “{previewText}”
                </p>
                <p className="text-[11.5px] font-bold text-amber-700 dark:text-amber-300 mt-1.5 text-right">
                  — {book?.book_name_ko} {chapter}:{verseStart}
                  {Math.max(verseStart, verseEnd) > verseStart &&
                    `-${Math.max(verseStart, verseEnd)}`}
                </p>
              </div>
            )}
            <div>
              <label className={labelCls}>선생님 한마디 (선택)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="예: 이번 주도 아이들과 함께 외워주세요!"
                className={`${inputCls} resize-none leading-[1.7]`}
              />
            </div>
          </div>
        )}

        {/* ── 일정 ── */}
        {postType === 'event' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>일정 이름</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="예: 여름성경학교"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelCls}>시작</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>종료 (선택)</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>장소 (선택)</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                placeholder="예: 교회 1층 로비"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>참석 응답 마감 (선택)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputCls}
              />
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
                마감 후에는 새 응답은 안 되고, 이미 응답한 분만 변경할 수 있어요
              </p>
            </div>
            <div>
              <label className={labelCls}>안내 내용 (선택)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="준비물, 회비, 유의사항 등을 적어주세요"
                className={`${inputCls} resize-none leading-[1.7]`}
              />
            </div>
          </div>
        )}

        {/* ── 사진 ── */}
        {postType === 'photo' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void handlePickPhotos(e.target.files)
                e.target.value = ''
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={p.previewUrl} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.05]">
                  <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="사진 빼기"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-white/15 flex flex-col items-center justify-center text-gray-400 dark:text-white/40 hover:border-brand hover:text-brand transition-colors"
                >
                  <span className="text-[22px] leading-none">+</span>
                  <span className="text-[10.5px] font-semibold mt-1">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </button>
              )}
            </div>
            <div>
              <label className={labelCls}>설명 (선택)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="예: 오늘 여름성경학교 활동 사진이에요 ☀️"
                className={`${inputCls} resize-none leading-[1.7]`}
              />
            </div>
          </div>
        )}

        {/* ── 투표 ── */}
        {postType === 'poll' && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>무엇을 물어볼까요?</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="예: 여름 소풍, 어느 주가 좋으세요?"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>선택지</label>
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={(e) =>
                        setPollOptions((prev) =>
                          prev.map((o, j) => (j === i ? e.target.value : o)),
                        )
                      }
                      maxLength={100}
                      placeholder={`선택지 ${i + 1}`}
                      className={inputCls}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPollOptions((prev) => prev.filter((_, j) => j !== i))
                        }
                        aria-label="선택지 빼기"
                        className="shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.07] text-gray-400 dark:text-white/40 hover:text-red-500 text-[15px]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < MAX_POLL_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ''])}
                  className="mt-2 text-[12.5px] font-bold text-brand"
                >
                  + 선택지 추가
                </button>
              )}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pollMultiple}
                onChange={(e) => setPollMultiple(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13px] font-semibold text-gray-700 dark:text-white/75">
                복수 선택 허용하기
              </span>
            </label>
            <div>
              <label className={labelCls}>설명 (선택)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="투표에 대한 안내를 적어주세요"
                className={`${inputCls} resize-none leading-[1.7]`}
              />
            </div>
          </div>
        )}

        {/* ── 예약 발행 (공통) ── */}
        <div className="mt-5 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06]">
          <label className={labelCls}>⏰ 예약 발행 (선택)</label>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className={inputCls}
          />
          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1.5 leading-[1.6]">
            {publishAt
              ? '그 시각까지 멤버에게 보이지 않다가, 시간이 되면 자동으로 올라가고 푸시도 그때 가요'
              : '비워두면 지금 바로 보내요. 주일 아침 공지를 토요일 밤에 미리 써두기 좋아요'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={createPost.isPending}
          className="w-full mt-5 py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_var(--brand-glow)] disabled:opacity-50"
        >
          {createPost.isPending
            ? '보내는 중...'
            : publishAt
              ? '⏰ 이 시각에 예약하기'
              : '알림 보내기'}
        </button>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11.5px] text-gray-400 dark:text-white/40">
            {publishAt ? '발행 시각에 푸시가 전송돼요' : '반 멤버 모두에게 푸시가 함께 가요'}
          </p>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="text-[11.5px] font-bold text-brand"
          >
            📋 템플릿으로 저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClassComposerSheet
