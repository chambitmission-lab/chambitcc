// 공동 기도제목 작성·수정 모달 — 관리자 작성 모달 PC 2단 표준(AdminComposerShell)
//   좌: 주일 날짜·제목·공개 + 원문 붙여넣기(PPT·한글 문서 → 자동 정리)
//   우: 정리된 항목 편집(순서 ↑↓·삭제·직접 추가)
// 저장은 부모(WeeklyPrayerManagement / dev 미리보기)가 맡는다 — 여기선 폼 상태만 쥔다.
import { useState, type FormEvent } from 'react'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter, Toggle, inputCls } from './AdminFormBits'
import { FieldGroup, dateTriggerClass } from '../../../components/common/ComposerFields'
import DatePicker from '../../../components/common/DatePicker'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog } from '../../../utils/confirmDialog'
import { showToast } from '../../../utils/toast'
import type { WeeklyPrayerItem } from '../../../types/weeklyPrayer'

// 편집 중인 항목의 안정적인 key — index 를 key 로 쓰면 ↑↓·삭제 뒤 포커스와 한글 조합 중인
// 글자가 "그 자리의 input" 에 남아 엉뚱한 항목으로 들어간다. 저장 payload 에는 싣지 않는다.
type ComposerItem = WeeklyPrayerItem & { _id: string }
let itemSeq = 0
const withId = (item: WeeklyPrayerItem): ComposerItem => ({
  title: item.title,
  body: item.body ?? '',
  scripture: item.scripture ?? '',
  _id: `wp-${++itemSeq}`,
})

export interface WeeklyPrayerDraft {
  editingId: number | null
  weekDate: string
  title: string
  isPublished: boolean
  items: WeeklyPrayerItem[]
  /** 지난 주를 복사해 시작했으면 그 주 날짜 — 안내 띠에 쓴다 */
  copiedFrom?: string
}

export interface WeeklyPrayerSavePayload {
  week_date: string
  title: string
  is_published: boolean
  items: WeeklyPrayerItem[]
}

interface Props {
  draft: WeeklyPrayerDraft
  onClose: () => void
  /** 실패하면 throw — 모달은 열린 채로 남는다 */
  onSave: (payload: WeeklyPrayerSavePayload, editingId: number | null) => Promise<void>
  onParse: (text: string) => Promise<WeeklyPrayerItem[]>
}

const Icon = ({ d, size = 15 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

const WeeklyPrayerComposer = ({ draft, onClose, onSave, onParse }: Props) => {
  useModalBackButton(onClose)
  const isEdit = draft.editingId != null
  const [weekDate, setWeekDate] = useState(draft.weekDate)
  const [title, setTitle] = useState(draft.title)
  const [isPublished, setIsPublished] = useState(draft.isPublished)
  const [items, setItems] = useState<ComposerItem[]>(() => draft.items.map(withId))
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)

  const cleaned = items
    .map((i) => ({ title: i.title.trim(), body: i.body?.trim() || null, scripture: i.scripture?.trim() || null }))
    // 제목 없이 기도문만 있는 항목도 허용
    .filter((i) => i.title.length > 0 || (i.body ?? '').length > 0)

  const handleParse = async () => {
    if (!pasteText.trim()) {
      showToast('붙여넣은 내용이 없어요', 'error')
      return
    }
    if (
      items.length > 0 &&
      !(await confirmDialog({
        title: '항목 바꾸기',
        message: `지금 있는 ${items.length}개 항목을 붙여넣은 내용으로 바꿀까요?`,
        confirmText: '바꾸기',
        icon: 'swap_horiz',
      }))
    )
      return
    try {
      setParsing(true)
      const parsed = await onParse(pasteText)
      if (parsed.length === 0) {
        showToast('항목을 찾지 못했어요. 직접 추가해 주세요', 'error')
        return
      }
      setItems(parsed.map(withId))
      setPasteText('')
      showToast(`${parsed.length}개 항목으로 정리했어요`, 'success')
    } catch {
      showToast('정리에 실패했습니다', 'error')
    } finally {
      setParsing(false)
    }
  }

  const patch = (id: string, p: Partial<WeeklyPrayerItem>) =>
    setItems((list) => list.map((it) => (it._id === id ? { ...it, ...p } : it)))
  const move = (index: number, dir: -1 | 1) =>
    setItems((list) => {
      const j = index + dir
      if (j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  const remove = (id: string) => setItems((list) => list.filter((it) => it._id !== id))
  const add = () => setItems((list) => [...list, withId({ title: '', body: '', scripture: '' })])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (cleaned.length === 0) {
      showToast('기도제목 항목을 1개 이상 입력해 주세요', 'error')
      return
    }
    try {
      setSaving(true)
      await onSave({ week_date: weekDate, title: title.trim() || '기도제목', is_published: isPublished, items: cleaned }, draft.editingId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminComposerShell
      title={isEdit ? '기도제목 수정' : '새 주일 기도제목'}
      onClose={onClose}
      closeOnBackdrop={false}
      as="form"
      onSubmit={handleSubmit}
      gridCols="lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      footer={
        <ComposerFooter
          onClose={onClose}
          canSubmit={!saving && cleaned.length > 0}
          submitting={saving}
          submitLabel={isEdit ? '수정 저장' : isPublished ? '등록하고 공개' : '비공개로 저장'}
          cancelDisabled
        />
      }
      columns={[
        <>
          {draft.copiedFrom && (
            <p className="rounded-xl bg-[var(--brand-soft)] px-3.5 py-2.5 text-[13px] font-medium text-brand break-keep">
              {draft.copiedFrom.slice(5).replace('-', '월 ')}일 내용을 복사해 왔어요. 날짜와 바뀐 기도만 고쳐 주세요.
            </p>
          )}

          <FieldGroup label="주일 날짜" required>
            <DatePicker value={weekDate} onChange={setWeekDate} sundayMode className={dateTriggerClass} />
          </FieldGroup>

          <FieldGroup label="제목">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="기도제목" className={inputCls} />
          </FieldGroup>

          <Toggle
            checked={isPublished}
            onChange={setIsPublished}
            label="성도에게 공개"
            desc={isPublished ? '저장하면 바로 /prayer-topics 와 홈에 보여요' : '저장만 해 두고 나중에 공개해요'}
          />

          <FieldGroup label="원문 붙여넣기">
            <p className="-mt-1 mb-2 text-[12.5px] text-gray-500 dark:text-white/50 break-keep">
              PPT·한글 문서의 기도제목을 그대로 붙여넣으면 번호·인용부호를 읽어 항목으로 나눠 줘요.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={9}
              placeholder={'1. 첫 번째 기도제목\n "기도문 전문..."\n\n2. 두 번째 기도제목\n "기도문 전문..."'}
              className={`${inputCls} resize-y text-[13.5px] leading-[1.6]`}
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !pasteText.trim()}
              className="mt-2 w-full h-10 rounded-xl bg-[var(--brand-soft)] text-brand text-[13.5px] font-bold hover:bg-[var(--brand-soft-strong)] disabled:opacity-40 transition-colors"
            >
              {parsing ? '정리하는 중…' : '항목으로 나누기 →'}
            </button>
          </FieldGroup>
        </>,
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-bold text-ink-strong">
              기도 항목 <span className="text-brand tabular-nums">{items.length}</span>
            </p>
            <p className="text-[12px] text-gray-400 dark:text-white/40">제목을 비우면 기도문만 보여요</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-10 text-center">
              <p className="text-[14px] font-bold text-ink-strong">아직 항목이 없어요</p>
              <p className="mt-1 text-[13px] text-gray-500 dark:text-white/55 break-keep">
                <span className="hidden lg:inline">왼쪽에</span>
                <span className="lg:hidden">위에</span> 원문을 붙여넣거나 아래에서 하나씩 추가해 주세요
              </p>
            </div>
          ) : (
            <ol className="space-y-2.5">
              {items.map((item, i) => (
                <li key={item._id} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.08] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-extrabold flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => patch(item._id, { title: e.target.value })}
                      placeholder="기도제목 한 줄"
                      className="flex-1 min-w-0 h-9 px-2 rounded-lg bg-transparent text-[14.5px] font-bold text-ink-strong placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:bg-gray-50 dark:focus:bg-white/[0.05]"
                    />
                    <div className="shrink-0 flex text-gray-400 dark:text-white/40">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-ink-strong disabled:opacity-30 flex items-center justify-center" aria-label="위로">
                        <Icon d="M18 15l-6-6-6 6" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-ink-strong disabled:opacity-30 flex items-center justify-center" aria-label="아래로">
                        <Icon d="M6 9l6 6 6-6" />
                      </button>
                      <button type="button" onClick={() => remove(item._id)} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center" aria-label={`${i + 1}번 항목 삭제`}>
                        <Icon d="M18 6L6 18M6 6l12 12" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={item.body ?? ''}
                    onChange={(e) => patch(item._id, { body: e.target.value })}
                    rows={3}
                    placeholder="기도문 전문 (선택)"
                    className={`${inputCls} resize-y leading-[1.65]`}
                  />
                  <input
                    type="text"
                    value={item.scripture ?? ''}
                    onChange={(e) => patch(item._id, { scripture: e.target.value })}
                    placeholder="관련 성구 (선택, 예: 마 11:28)"
                    className={inputCls}
                  />
                </li>
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={add}
            className="w-full h-11 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-[13.5px] font-semibold text-gray-500 dark:text-white/55 hover:border-brand hover:text-brand transition-colors"
          >
            + 항목 직접 추가
          </button>
        </>,
      ]}
    />
  )
}

export default WeeklyPrayerComposer
