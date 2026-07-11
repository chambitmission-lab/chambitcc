import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  getAllCultureClasses,
  createCultureClass,
  updateCultureClass,
  deleteCultureClass,
  getCultureApplications,
  updateCultureApplicationStatus,
  getAllCultureNotices,
  createCultureNotice,
  updateCultureNotice,
  deleteCultureNotice,
} from '../../api/culture'
import type {
  CultureClassAdmin,
  CultureApplication,
  CultureApplicationStatus,
  CultureNotice,
} from '../../types/culture'

type TabKey = 'classes' | 'applications' | 'notices'

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors'

const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

const cardClass =
  'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

const STATUS_LABEL: Record<CultureApplicationStatus, string> = {
  pending: '접수 대기',
  confirmed: '등록 완료',
  cancelled: '취소됨',
}

const STATUS_BADGE: Record<CultureApplicationStatus, string> = {
  pending:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  confirmed:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25',
  cancelled:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-white/40 dark:border-white/[0.08]',
}

// ── 강좌 폼 패널 ──────────────────────────────────────────────────────

const EMPTY_CLASS_FORM = {
  title: '',
  description: '',
  instructor: '',
  schedule: '',
  fee: '',
  capacity: '',
  location: '',
  quarter: '',
  is_open: true,
  is_active: true,
  display_order: 0,
}

type ClassForm = typeof EMPTY_CLASS_FORM

const ClassFormPanel = ({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: ClassForm
  onSave: (v: ClassForm) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState(initial)
  const set = (patch: Partial<ClassForm>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">
            {initial.title ? '강좌 수정' : '새 강좌'}
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>강좌명 *</label>
            <input
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="예: 수채화 교실"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>강좌 소개</label>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              placeholder="강좌에 대한 간단한 소개"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>강사명</label>
              <input
                value={form.instructor}
                onChange={(e) => set({ instructor: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>모집 분기</label>
              <input
                value={form.quarter}
                onChange={(e) => set({ quarter: e.target.value })}
                placeholder="예: 2026년 3분기"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>요일 / 시간</label>
            <input
              value={form.schedule}
              onChange={(e) => set({ schedule: e.target.value })}
              placeholder="예: 매주 화 10:00~12:00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>수강료</label>
            <input
              value={form.fee}
              onChange={(e) => set({ fee: e.target.value })}
              placeholder="예: 12회 120,000원"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>장소</label>
              <input
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="예: 2층 교육관"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>정원 (비우면 무제한)</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => set({ capacity: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div>
              <label className={labelClass}>노출 순서</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => set({ display_order: +e.target.value })}
                className={`${inputClass} w-24`}
              />
            </div>
            {(
              [
                { key: 'is_open', label: '모집중' },
                { key: 'is_active', label: '노출' },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer mt-5">
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${form[key] ? 'bg-purple-500' : 'bg-gray-200 dark:bg-white/10'}`}
                  onClick={() => set({ [key]: !form[key] } as Partial<ClassForm>)}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form[key] ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-white/70">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSave(form)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 공지 폼 패널 ──────────────────────────────────────────────────────

const EMPTY_NOTICE_FORM = { title: '', content: '', is_active: true }
type NoticeForm = typeof EMPTY_NOTICE_FORM

const NoticeFormPanel = ({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: NoticeForm
  onSave: (v: NoticeForm) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState(initial)
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">
            {initial.title ? '공지 수정' : '새 공지'}
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className={labelClass}>제목 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>내용 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className={`${inputClass} resize-none`}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-purple-500' : 'bg-gray-200 dark:bg-white/10'}`}
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-white/70">공개</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSave(form)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────

const CultureManagement = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('classes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [classes, setClasses] = useState<CultureClassAdmin[]>([])
  const [applications, setApplications] = useState<CultureApplication[]>([])
  const [notices, setNotices] = useState<CultureNotice[]>([])

  const [classFilter, setClassFilter] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<CultureApplicationStatus | ''>('')

  const [showClassForm, setShowClassForm] = useState(false)
  const [classTarget, setClassTarget] = useState<CultureClassAdmin | null>(null)
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [noticeTarget, setNoticeTarget] = useState<CultureNotice | null>(null)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const loadClasses = useCallback(async () => {
    const data = await getAllCultureClasses()
    setClasses(data)
  }, [])

  const loadApplications = useCallback(async () => {
    const data = await getCultureApplications({
      class_id: classFilter || undefined,
      status: statusFilter || undefined,
    })
    setApplications(data)
  }, [classFilter, statusFilter])

  const loadNotices = useCallback(async () => {
    const data = await getAllCultureNotices()
    setNotices(data)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        if (tab === 'classes') await loadClasses()
        else if (tab === 'applications') await Promise.all([loadClasses(), loadApplications()])
        else await loadNotices()
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : '데이터를 불러오지 못했습니다',
          'error'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab, loadClasses, loadApplications, loadNotices])

  // ── 강좌 저장/삭제 ──

  const handleSaveClass = async (form: ClassForm) => {
    if (!form.title.trim()) return showToast('강좌명을 입력하세요', 'error')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instructor: form.instructor.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      fee: form.fee.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      location: form.location.trim() || undefined,
      quarter: form.quarter.trim() || undefined,
      is_open: form.is_open,
      is_active: form.is_active,
      display_order: form.display_order,
    }
    try {
      setSaving(true)
      if (classTarget) {
        await updateCultureClass(classTarget.id, payload)
        showToast('강좌가 수정되었습니다', 'success')
      } else {
        await createCultureClass(payload)
        showToast('강좌가 생성되었습니다', 'success')
      }
      setShowClassForm(false)
      setClassTarget(null)
      await loadClasses()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (cultureClass: CultureClassAdmin) => {
    if (
      !confirm(
        `"${cultureClass.title}" 강좌를 삭제할까요?\n신청 내역 ${cultureClass.application_count}건도 함께 삭제됩니다.`
      )
    )
      return
    try {
      await deleteCultureClass(cultureClass.id)
      showToast('삭제되었습니다', 'success')
      await loadClasses()
    } catch {
      showToast('삭제 실패', 'error')
    }
  }

  // ── 신청 상태 변경 ──

  const handleStatusChange = async (
    application: CultureApplication,
    status: CultureApplicationStatus
  ) => {
    try {
      const updated = await updateCultureApplicationStatus(application.id, status)
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      showToast(`"${STATUS_LABEL[status]}" 상태로 변경되었습니다`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상태 변경 실패', 'error')
    }
  }

  // ── 공지 저장/삭제 ──

  const handleSaveNotice = async (form: NoticeForm) => {
    if (!form.title.trim() || !form.content.trim()) {
      return showToast('제목과 내용을 입력하세요', 'error')
    }
    try {
      setSaving(true)
      if (noticeTarget) {
        await updateCultureNotice(noticeTarget.id, form)
        showToast('공지가 수정되었습니다', 'success')
      } else {
        await createCultureNotice(form)
        showToast('공지가 생성되었습니다', 'success')
      }
      setShowNoticeForm(false)
      setNoticeTarget(null)
      await loadNotices()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNotice = async (notice: CultureNotice) => {
    if (!confirm(`"${notice.title}" 공지를 삭제할까요?`)) return
    try {
      await deleteCultureNotice(notice.id)
      showToast('삭제되었습니다', 'success')
      await loadNotices()
    } catch {
      showToast('삭제 실패', 'error')
    }
  }

  const spinner = (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-purple-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 스티키 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
            문화교실 관리
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 탭 */}
        <div className="px-4 pt-3 flex gap-1.5">
          {(
            [
              { key: 'classes', label: '강좌' },
              { key: 'applications', label: '신청자' },
              { key: 'notices', label: '공지' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-xl border transition-colors ${
                tab === t.key
                  ? 'border-purple-400/60 dark:border-purple-400/40 bg-purple-50/80 dark:bg-purple-500/[0.12] text-purple-700 dark:text-purple-300'
                  : 'border-gray-200/70 dark:border-white/[0.06] text-gray-500 dark:text-white/50 hover:border-purple-300/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 강좌 탭 ── */}
        {tab === 'classes' &&
          (loading ? (
            spinner
          ) : (
            <div className="px-4 pt-4 space-y-2">
              {classes.length === 0 && (
                <p className="py-16 text-center text-sm text-gray-400 dark:text-white/30">
                  등록된 강좌가 없습니다
                </p>
              )}
              {classes.map((c) => (
                <div key={c.id} className={`${cardClass} px-4 py-3.5`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-white/85">
                      {c.title}
                    </span>
                    {c.is_open ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-bold">
                        모집중
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/35">
                        마감
                      </span>
                    )}
                    {!c.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/35">
                        비노출
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 dark:text-white/40 mt-1">
                    {[c.instructor, c.schedule, c.fee].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="text-[12px] text-purple-600/80 dark:text-purple-300/70 font-semibold mt-0.5">
                    신청 {c.application_count}명{c.capacity ? ` / 정원 ${c.capacity}명` : ''}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => {
                        setTab('applications')
                        setClassFilter(c.id)
                      }}
                      className="px-2.5 py-1 text-[12px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      신청자
                    </button>
                    <button
                      onClick={() => {
                        setClassTarget(c)
                        setShowClassForm(true)
                      }}
                      className="px-2.5 py-1 text-[12px] font-medium text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c)}
                      className="px-2.5 py-1 text-[12px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* ── 신청자 탭 ── */}
        {tab === 'applications' && (
          <>
            <div className="px-4 pt-3 flex gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : '')}
                className={`${inputClass} flex-1`}
              >
                <option value="">전체 강좌</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as CultureApplicationStatus | '')
                }
                className={`${inputClass} w-32`}
              >
                <option value="">전체 상태</option>
                <option value="pending">접수 대기</option>
                <option value="confirmed">등록 완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>
            {loading ? (
              spinner
            ) : (
              <div className="px-4 pt-3 space-y-2">
                {applications.length === 0 && (
                  <p className="py-16 text-center text-sm text-gray-400 dark:text-white/30">
                    신청 내역이 없습니다
                  </p>
                )}
                {applications.map((a) => (
                  <div key={a.id} className={`${cardClass} px-4 py-3.5`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-gray-900 dark:text-white/85 truncate">
                        {a.name}
                        {a.gender ? ` (${a.gender})` : ''}
                      </span>
                      <span
                        className={`flex-shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[a.status]}`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <p className="text-[12px] text-purple-600/80 dark:text-purple-300/70 font-medium mt-0.5">
                      {a.class_title ?? '삭제된 강좌'}
                    </p>
                    <p className="text-[12px] text-gray-400 dark:text-white/40 mt-0.5">
                      {a.phone} · {a.birth_date} ·{' '}
                      {new Date(a.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {a.memo && (
                      <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1.5 p-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] whitespace-pre-wrap">
                        {a.memo}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {a.status !== 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(a, 'confirmed')}
                          className="px-2.5 py-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          등록 완료
                        </button>
                      )}
                      {a.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusChange(a, 'pending')}
                          className="px-2.5 py-1 text-[12px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          대기로
                        </button>
                      )}
                      {a.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusChange(a, 'cancelled')}
                          className="px-2.5 py-1 text-[12px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 공지 탭 ── */}
        {tab === 'notices' &&
          (loading ? (
            spinner
          ) : (
            <div className="px-4 pt-4 space-y-2">
              {notices.length === 0 && (
                <p className="py-16 text-center text-sm text-gray-400 dark:text-white/30">
                  등록된 공지가 없습니다
                </p>
              )}
              {notices.map((n) => (
                <div key={n.id} className={`${cardClass} px-4 py-3.5`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-white/85 truncate">
                      {n.title}
                    </span>
                    {!n.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/35 flex-shrink-0">
                        비공개
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 dark:text-white/45 mt-1 line-clamp-2 whitespace-pre-wrap">
                    {n.content}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">
                    {new Date(n.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => {
                        setNoticeTarget(n)
                        setShowNoticeForm(true)
                      }}
                      className="px-2.5 py-1 text-[12px] font-medium text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n)}
                      className="px-2.5 py-1 text-[12px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* FAB */}
      {tab !== 'applications' && (
        <button
          onClick={() => {
            if (tab === 'classes') {
              setClassTarget(null)
              setShowClassForm(true)
            } else {
              setNoticeTarget(null)
              setShowNoticeForm(true)
            }
          }}
          className="fixed bottom-6 right-1/2 translate-x-[calc(50%+min(calc(100vw/2),24rem)-4.5rem)] z-30 flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl shadow-[0_4px_20px_rgba(147,51,234,0.45)] transition-colors"
        >
          <span className="material-icons-round text-[18px]">add</span>
          {tab === 'classes' ? '강좌 추가' : '공지 추가'}
        </button>
      )}

      {showClassForm && (
        <ClassFormPanel
          initial={
            classTarget
              ? {
                  title: classTarget.title,
                  description: classTarget.description ?? '',
                  instructor: classTarget.instructor ?? '',
                  schedule: classTarget.schedule ?? '',
                  fee: classTarget.fee ?? '',
                  capacity: classTarget.capacity ? String(classTarget.capacity) : '',
                  location: classTarget.location ?? '',
                  quarter: classTarget.quarter ?? '',
                  is_open: classTarget.is_open,
                  is_active: classTarget.is_active,
                  display_order: classTarget.display_order,
                }
              : EMPTY_CLASS_FORM
          }
          onSave={handleSaveClass}
          onCancel={() => {
            setShowClassForm(false)
            setClassTarget(null)
          }}
          isPending={saving}
        />
      )}

      {showNoticeForm && (
        <NoticeFormPanel
          initial={
            noticeTarget
              ? {
                  title: noticeTarget.title,
                  content: noticeTarget.content,
                  is_active: noticeTarget.is_active,
                }
              : EMPTY_NOTICE_FORM
          }
          onSave={handleSaveNotice}
          onCancel={() => {
            setShowNoticeForm(false)
            setNoticeTarget(null)
          }}
          isPending={saving}
        />
      )}
    </div>
  )
}

export default CultureManagement
