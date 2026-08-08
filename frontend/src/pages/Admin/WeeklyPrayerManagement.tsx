// 공동 기도제목 관리 — 붙여넣기 파싱으로 주차별 기도제목을 등록/수정한다
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import DatePicker from '../../components/common/DatePicker'
import {
  getAllWeeklyPrayers,
  getWeeklyPrayer,
  createWeeklyPrayer,
  updateWeeklyPrayer,
  deleteWeeklyPrayer,
  parseWeeklyPrayerText,
} from '../../api/weeklyPrayer'
import type { WeeklyPrayerItem, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import { confirmDialog } from '../../utils/confirmDialog'

// 다가오는 주일(일요일) 날짜 — 오늘이 일요일이면 오늘
const upcomingSunday = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const formatWeekLabel = (weekDate: string): string => {
  const d = new Date(`${weekDate}T00:00:00`)
  if (isNaN(d.getTime())) return weekDate
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
}

interface ComposerState {
  editingId: number | null
  weekDate: string
  title: string
  isPublished: boolean
  items: WeeklyPrayerItem[]
}

const emptyComposer = (): ComposerState => ({
  editingId: null,
  weekDate: upcomingSunday(),
  title: '기도제목',
  isPublished: true,
  items: [],
})

const WeeklyPrayerManagement = () => {
  const navigate = useNavigate()
  const [list, setList] = useState<WeeklyPrayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [composer, setComposer] = useState<ComposerState>(emptyComposer())
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자만 접근할 수 있습니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const loadList = useCallback(async () => {
    try {
      setLoading(true)
      setList(await getAllWeeklyPrayers())
    } catch {
      showToast('목록을 불러오지 못했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const openNew = () => {
    setComposer(emptyComposer())
    setPasteText('')
    setShowComposer(true)
  }

  const openEdit = async (id: number) => {
    try {
      const p = await getWeeklyPrayer(id)
      setComposer({
        editingId: p.id,
        weekDate: p.week_date,
        title: p.title,
        isPublished: p.is_published,
        items: p.items.map(({ title, body, scripture }) => ({ title, body, scripture })),
      })
      setPasteText('')
      setShowComposer(true)
    } catch {
      showToast('기도제목을 불러오지 못했습니다', 'error')
    }
  }

  // 가장 최근 주차를 복사해 새 주차로
  const copyLatest = async () => {
    if (list.length === 0) return
    try {
      const p = await getWeeklyPrayer(list[0].id)
      setComposer({
        ...emptyComposer(),
        title: p.title,
        items: p.items.map(({ title, body, scripture }) => ({ title, body, scripture })),
      })
      setPasteText('')
      setShowComposer(true)
      showToast('지난 주 내용을 복사했습니다. 날짜와 내용을 수정하세요', 'success')
    } catch {
      showToast('복사에 실패했습니다', 'error')
    }
  }

  const handleParse = async () => {
    if (!pasteText.trim()) {
      showToast('붙여넣은 내용이 없습니다', 'error')
      return
    }
    try {
      setParsing(true)
      const items = await parseWeeklyPrayerText(pasteText)
      if (items.length === 0) {
        showToast('항목을 찾지 못했습니다. 직접 추가해 주세요', 'error')
        return
      }
      setComposer((c) => ({ ...c, items }))
      showToast(`${items.length}개 항목으로 정리했습니다`, 'success')
    } catch {
      showToast('파싱에 실패했습니다', 'error')
    } finally {
      setParsing(false)
    }
  }

  const setItem = (index: number, patch: Partial<WeeklyPrayerItem>) => {
    setComposer((c) => ({
      ...c,
      items: c.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    setComposer((c) => {
      const next = [...c.items]
      const target = index + dir
      if (target < 0 || target >= next.length) return c
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...c, items: next }
    })
  }

  const removeItem = (index: number) => {
    setComposer((c) => ({ ...c, items: c.items.filter((_, i) => i !== index) }))
  }

  const addItem = () => {
    setComposer((c) => ({ ...c, items: [...c.items, { title: '', body: '', scripture: '' }] }))
  }

  const handleSave = async () => {
    const items = composer.items
      .map((i) => ({
        title: i.title.trim(),
        body: i.body?.trim() || null,
        scripture: i.scripture?.trim() || null,
      }))
      // 제목 없이 기도문만 있는 항목도 허용
      .filter((i) => i.title.length > 0 || (i.body ?? '').length > 0)
    if (items.length === 0) {
      showToast('기도제목 항목을 1개 이상 입력해 주세요', 'error')
      return
    }
    try {
      setSaving(true)
      if (composer.editingId) {
        await updateWeeklyPrayer(composer.editingId, {
          week_date: composer.weekDate,
          title: composer.title,
          is_published: composer.isPublished,
          items,
        })
        showToast('수정했습니다', 'success')
      } else {
        await createWeeklyPrayer({
          week_date: composer.weekDate,
          title: composer.title,
          is_published: composer.isPublished,
          items,
        })
        showToast('등록했습니다', 'success')
      }
      setShowComposer(false)
      void loadList()
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE_WEEK') {
        showToast('해당 주일에 이미 등록된 기도제목이 있습니다', 'error')
      } else {
        showToast('저장에 실패했습니다', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, weekDate: string) => {
    if (
      !(await confirmDialog({
        title: '주간 기도제목 삭제',
        message: `${formatWeekLabel(weekDate)} 기도제목을 삭제할까요?`,
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteWeeklyPrayer(id)
      showToast('삭제했습니다', 'success')
      void loadList()
    } catch {
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  const togglePublish = async (item: WeeklyPrayerListItem) => {
    try {
      await updateWeeklyPrayer(item.id, { is_published: !item.is_published })
      void loadList()
    } catch {
      showToast('변경에 실패했습니다', 'error')
    }
  }

  const openScreen = (id?: number) => {
    const hash = id ? `#/prayer-topics/screen?id=${id}` : '#/prayer-topics/screen'
    window.open(`${window.location.origin}${window.location.pathname}${hash}`, '_blank')
  }

  // brand 계열은 CSS 변수 색이라 투명도 수식자(border-brand/60 등)가 생성되지
  // 않는다 — 옅은 톤이 필요하면 --brand-soft / --brand-glow 토큰을 쓴다
  const inputCls =
    'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">공동 기도제목</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 액션 버튼 */}
        <div className="px-4 pt-4 flex gap-2">
          <button
            onClick={openNew}
            className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-sm font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors active:scale-[0.98]"
          >
            + 새 기도제목
          </button>
          <button
            onClick={copyLatest}
            disabled={list.length === 0}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
          >
            지난 주 복사
          </button>
          <button
            onClick={() => openScreen()}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.1] text-sm font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            title="예배 스크린용 전체화면 보기"
          >
            🖥️
          </button>
        </div>

        {/* 등록/수정 폼 */}
        {showComposer && (
          <div className="px-4 py-3">
            <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink-strong">
                  {composer.editingId ? '기도제목 수정' : '새 기도제목 등록'}
                </h2>
                <button
                  onClick={() => setShowComposer(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
                >
                  닫기 ✕
                </button>
              </div>

              {/* 날짜는 "2026년 8월 2일 (일)"까지 다 보여야 해 한 줄을 통째로 쓴다
                  (반폭이면 좁은 화면에서 요일이 잘린다) */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">주일 날짜</label>
                <DatePicker
                  value={composer.weekDate}
                  onChange={(weekDate) => setComposer((c) => ({ ...c, weekDate }))}
                  sundayMode
                  className={`${inputCls} flex items-center justify-between gap-2 text-left`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">제목</label>
                <input
                  type="text"
                  value={composer.title}
                  onChange={(e) => setComposer((c) => ({ ...c, title: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* 붙여넣기 파싱 */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">
                  원문 붙여넣기 — PPT·한글 문서의 기도제목을 그대로 붙여넣으세요
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  placeholder={'1. 첫 번째 기도제목\n "기도문 전문..."\n\n2. 두 번째 기도제목\n "기도문 전문..."'}
                  className={`${inputCls} resize-y font-mono text-[13px]`}
                />
                <button
                  onClick={handleParse}
                  disabled={parsing}
                  className="mt-1.5 w-full py-2 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-glow)] text-brand text-sm font-bold hover:bg-[var(--brand-soft-strong)] disabled:opacity-50 transition-colors"
                >
                  {parsing ? '정리 중...' : '✨ 항목으로 자동 정리'}
                </button>
              </div>

              {/* 항목 편집 */}
              {composer.items.length > 0 && (
                <div className="space-y-2.5">
                  {composer.items.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 dark:border-white/[0.08] p-3 space-y-2 bg-gray-50/60 dark:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand">{i + 1}번</span>
                        <div className="flex gap-1 text-gray-400">
                          <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="px-1.5 disabled:opacity-30 hover:text-gray-700 dark:hover:text-white">↑</button>
                          <button onClick={() => moveItem(i, 1)} disabled={i === composer.items.length - 1} className="px-1.5 disabled:opacity-30 hover:text-gray-700 dark:hover:text-white">↓</button>
                          <button onClick={() => removeItem(i)} className="px-1.5 text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => setItem(i, { title: e.target.value })}
                        placeholder="기도제목 (한 줄) — 비우면 기도문만 표시됩니다"
                        className={inputCls}
                      />
                      <textarea
                        value={item.body ?? ''}
                        onChange={(e) => setItem(i, { body: e.target.value })}
                        rows={3}
                        placeholder="기도문 전문 (선택)"
                        className={`${inputCls} resize-y`}
                      />
                      <input
                        type="text"
                        value={item.scripture ?? ''}
                        onChange={(e) => setItem(i, { scripture: e.target.value })}
                        placeholder="관련 성구 (선택, 예: 마 11:28)"
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addItem}
                className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-sm text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand transition-colors"
              >
                + 항목 직접 추가
              </button>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                <input
                  type="checkbox"
                  checked={composer.isPublished}
                  onChange={(e) => setComposer((c) => ({ ...c, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--brand)]"
                />
                바로 공개 (해제하면 임시저장 상태)
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dim text-white text-sm font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] disabled:opacity-50 transition-colors active:scale-[0.99]"
              >
                {saving ? '저장 중...' : composer.editingId ? '수정 저장' : '등록하기'}
              </button>
            </div>
          </div>
        )}

        {/* 주차 목록 */}
        <div className="px-4 py-3 space-y-2">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-8">불러오는 중...</p>
          ) : list.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              아직 등록된 기도제목이 없습니다.
              <br />첫 기도제목을 등록해 보세요.
            </p>
          ) : (
            list.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-strong">{formatWeekLabel(p.week_date)}</p>
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                    {p.title} · {p.item_count}개 항목
                    {!p.is_published && (
                      <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
                        미공개
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 text-xs">
                  <button
                    onClick={() => openScreen(p.id)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.1] hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    title="스크린 보기"
                  >
                    🖥️
                  </button>
                  <button
                    onClick={() => togglePublish(p)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.1] hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    title={p.is_published ? '비공개로 전환' : '공개로 전환'}
                  >
                    {p.is_published ? '👁️' : '🔒'}
                  </button>
                  <button
                    onClick={() => void openEdit(p.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.1] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => void handleDelete(p.id, p.week_date)}
                    className="px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default WeeklyPrayerManagement
