import { useEffect, useState } from 'react'
import { showToast } from '../../utils/toast'
import {
  getCultureClasses,
  getCultureNotices,
  createCultureApplication,
  lookupCultureApplications,
  cancelCultureApplication,
} from '../../api/culture'
import type {
  CultureClass,
  CultureNotice,
  CultureApplication,
  CultureApplicationStatus,
} from '../../types/culture'

type SectionKey = 'guide' | 'apply' | 'lookup' | 'notice' | 'contact'

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'guide', label: '문화교실 안내' },
  { key: 'apply', label: '수강신청' },
  { key: 'lookup', label: '신청 확인 · 취소' },
  { key: 'notice', label: '공지사항' },
  { key: 'contact', label: '강좌 문의' },
]

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

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const labelClass =
  'text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block'

const cardClass =
  'rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]'

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

// ── 강좌 카드 ─────────────────────────────────────────────────────────

const ClassCard = ({
  cultureClass,
  onApply,
}: {
  cultureClass: CultureClass
  onApply: (c: CultureClass) => void
}) => (
  <div className={`${cardClass} p-4`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white/90">
            {cultureClass.title}
          </h3>
          {cultureClass.is_open ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand">
              모집중
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-400 dark:text-white/40">
              모집 마감
            </span>
          )}
        </div>
        {cultureClass.quarter && (
          <p className="text-[11.5px] text-brand font-semibold mt-0.5">
            {cultureClass.quarter}
          </p>
        )}
      </div>
    </div>

    {cultureClass.description && (
      <p className="text-[13px] text-gray-600 dark:text-white/60 mt-2 leading-relaxed whitespace-pre-wrap">
        {cultureClass.description}
      </p>
    )}

    <div className="mt-3 space-y-1.5">
      {[
        { icon: 'person', value: cultureClass.instructor && `강사 ${cultureClass.instructor}` },
        { icon: 'schedule', value: cultureClass.schedule },
        { icon: 'payments', value: cultureClass.fee },
        { icon: 'place', value: cultureClass.location },
        { icon: 'groups', value: cultureClass.capacity ? `정원 ${cultureClass.capacity}명` : null },
      ]
        .filter((row) => row.value)
        .map((row) => (
          <div key={row.icon} className="flex items-center gap-2">
            <span className="material-icons-outlined text-[15px] text-gray-400 dark:text-white/35">
              {row.icon}
            </span>
            <span className="text-[12.5px] text-gray-600 dark:text-white/55">{row.value}</span>
          </div>
        ))}
    </div>

    {cultureClass.is_open && (
      <button
        onClick={() => onApply(cultureClass)}
        className="mt-3.5 w-full py-2.5 text-sm font-semibold bg-brand hover:bg-brand-dim text-white rounded-xl transition-colors"
      >
        이 강좌 수강신청
      </button>
    )}
  </div>
)

// ── 메인 ─────────────────────────────────────────────────────────────

const Culture = () => {
  const [section, setSection] = useState<SectionKey>('guide')
  const [classes, setClasses] = useState<CultureClass[]>([])
  const [notices, setNotices] = useState<CultureNotice[]>([])
  const [loading, setLoading] = useState(true)

  // 수강신청 폼
  const [form, setForm] = useState({
    class_id: 0,
    name: '',
    phone: '',
    birth_date: '',
    gender: '',
    memo: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<CultureApplication | null>(null)

  // 신청 확인·취소
  const [lookupForm, setLookupForm] = useState({ phone: '', birth_date: '' })
  const [lookupResults, setLookupResults] = useState<CultureApplication[] | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  // 공지 펼침
  const [openNoticeId, setOpenNoticeId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [classData, noticeData] = await Promise.all([
          getCultureClasses(),
          getCultureNotices(),
        ])
        setClasses(classData)
        setNotices(noticeData)
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : '문화교실 정보를 불러오지 못했습니다',
          'error'
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openClasses = classes.filter((c) => c.is_open)

  const goApply = (cultureClass: CultureClass) => {
    setForm((f) => ({ ...f, class_id: cultureClass.id }))
    setSubmitted(null)
    setSection('apply')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!form.class_id) return showToast('신청할 강좌를 선택해주세요', 'error')
    if (!form.name.trim()) return showToast('이름을 입력해주세요', 'error')
    if (!form.phone.trim()) return showToast('전화번호를 입력해주세요', 'error')
    if (!form.birth_date.trim()) return showToast('생년월일을 입력해주세요', 'error')

    try {
      setSubmitting(true)
      const result = await createCultureApplication({
        class_id: form.class_id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date.trim(),
        gender: form.gender || undefined,
        memo: form.memo.trim() || undefined,
      })
      setSubmitted(result)
      setForm({ class_id: 0, name: '', phone: '', birth_date: '', gender: '', memo: '' })
    } catch (error) {
      showToast(error instanceof Error ? error.message : '수강신청에 실패했습니다', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLookup = async () => {
    if (!lookupForm.phone.trim() || !lookupForm.birth_date.trim()) {
      return showToast('전화번호와 생년월일을 입력해주세요', 'error')
    }
    try {
      setLookingUp(true)
      const results = await lookupCultureApplications({
        phone: lookupForm.phone.trim(),
        birth_date: lookupForm.birth_date.trim(),
      })
      setLookupResults(results)
      if (results.length === 0) showToast('신청 내역이 없습니다', 'error')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '조회에 실패했습니다', 'error')
    } finally {
      setLookingUp(false)
    }
  }

  const handleCancel = async (application: CultureApplication) => {
    if (!confirm(`"${application.class_title ?? '강좌'}" 수강신청을 취소할까요?`)) return
    try {
      const updated = await cancelCultureApplication(application.id, {
        phone: lookupForm.phone.trim(),
        birth_date: lookupForm.birth_date.trim(),
      })
      setLookupResults((prev) =>
        prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev
      )
      showToast('수강신청이 취소되었습니다', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '취소에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            CULTURE CLASS
          </p>
          <h1 className="text-gray-900 dark:text-white text-[26px] font-bold leading-none tracking-[-0.02em]">
            문화교실
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
            아름다운 배움과 즐거운 만남이 있는 참빛 문화교실입니다
          </p>
        </header>

        {/* 섹션 메뉴 — 옛 홈페이지 사이드메뉴 느낌 */}
        <nav className="px-4 pt-3 space-y-1.5">
          {SECTIONS.map((s) => {
            const active = section === s.key
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSection(s.key)
                  if (s.key !== 'apply') setSubmitted(null)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] shadow-[inset_3px_0_0_0_var(--brand)]'
                    : 'border-gray-200/70 dark:border-white/[0.06] bg-white/80 dark:bg-card-dark hover:border-[var(--brand-soft-strong)]'
                }`}
              >
                <span
                  className={`text-[14px] font-semibold ${
                    active
                      ? 'text-brand'
                      : 'text-gray-700 dark:text-white/75'
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`material-icons-outlined text-[18px] ${
                    active
                      ? 'text-brand'
                      : 'text-gray-300 dark:text-white/25'
                  }`}
                >
                  chevron_right
                </span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-border-light dark:border-border-dark mt-4" />

        {/* 섹션 콘텐츠 */}
        <div className="px-4 pt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── 문화교실 안내 ── */}
              {section === 'guide' && (
                <>
                  <div className={`${cardClass} p-4`}>
                    <h2 className="text-[14px] font-bold text-gray-900 dark:text-white/90 mb-2">
                      참빛 문화교실을 소개합니다
                    </h2>
                    <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
                      다양한 강좌가 개설되어 있으며, 분기별로 수강생을 모집합니다.
                      모집 기간 이후에도 상시 신청하실 수 있으니 편하게 문의해 주세요.
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-1.5">
                      {[
                        '① 아래 수강신청 메뉴에서 신청서를 작성해 주세요',
                        '② 수강료를 입금하시면 등록이 완료됩니다',
                        '③ 12회 일괄 또는 5회 분할 입금이 가능합니다',
                      ].map((step) => (
                        <p key={step} className="text-[12.5px] text-gray-600 dark:text-white/55">
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>

                  <h2 className="text-[13px] font-bold text-gray-500 dark:text-white/45 uppercase tracking-wider pt-1 px-1">
                    개설 강좌
                  </h2>
                  {classes.length === 0 ? (
                    <div className={`${cardClass} py-12 text-center`}>
                      <p className="text-sm text-gray-400 dark:text-white/35">
                        현재 개설된 강좌가 없습니다
                      </p>
                    </div>
                  ) : (
                    classes.map((c) => (
                      <ClassCard key={c.id} cultureClass={c} onApply={goApply} />
                    ))
                  )}
                </>
              )}

              {/* ── 수강신청 ── */}
              {section === 'apply' &&
                (submitted ? (
                  <div className={`${cardClass} p-5 text-center`}>
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
                      <span className="material-icons-round text-[26px] text-emerald-500">
                        check
                      </span>
                    </div>
                    <h2 className="text-[16px] font-bold text-gray-900 dark:text-white">
                      수강신청이 접수되었습니다
                    </h2>
                    <p className="text-[13px] text-gray-500 dark:text-white/55 mt-1.5">
                      {submitted.class_title} · {submitted.name}님
                    </p>
                    <div className="mt-4 p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-left">
                      <p className="text-[12.5px] text-gray-600 dark:text-white/60 leading-relaxed">
                        수강료를 입금하시면 등록이 완료됩니다.
                        <br />
                        12회 일괄 또는 5회 분할 입금이 가능합니다.
                      </p>
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-white/80 mt-2">
                        농협 301-0254-9469-31
                        <span className="font-normal text-gray-500 dark:text-white/50">
                          {' '}
                          (대한예수교장로회 참빛교회)
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitted(null)}
                      className="mt-4 px-5 py-2.5 text-sm font-semibold text-brand border border-[var(--brand-soft-strong)] rounded-xl hover:bg-[var(--brand-soft)] transition-colors"
                    >
                      다른 강좌 신청하기
                    </button>
                  </div>
                ) : (
                  <div className={`${cardClass} p-4 space-y-4`}>
                    <div>
                      <label className={labelClass}>신청 강좌 *</label>
                      <select
                        value={form.class_id || ''}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, class_id: Number(e.target.value) }))
                        }
                        className={inputClass}
                      >
                        <option value="">강좌를 선택해주세요</option>
                        {openClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                            {c.schedule ? ` — ${c.schedule}` : ''}
                          </option>
                        ))}
                      </select>
                      {openClasses.length === 0 && (
                        <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1.5">
                          현재 모집 중인 강좌가 없습니다
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>이름 (수강생) *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="성함을 입력해주세요"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>생년월일 *</label>
                      <input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>성별</label>
                      <div className="flex gap-2">
                        {['남', '여'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, gender: f.gender === g ? '' : g }))
                            }
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                              form.gender === g
                                ? 'border-brand bg-[var(--brand-soft)] text-brand'
                                : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>전화번호 *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="010-0000-0000"
                        className={inputClass}
                      />
                      <p className="text-[11.5px] text-gray-400 dark:text-white/35 mt-1.5">
                        신청 확인과 취소 시 본인 확인에 사용됩니다
                      </p>
                    </div>

                    <div>
                      <label className={labelClass}>남기실 말씀</label>
                      <textarea
                        value={form.memo}
                        onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                        placeholder="문의사항이 있으시면 남겨주세요 (선택)"
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting || openClasses.length === 0}
                      className="w-full py-3 text-sm font-bold bg-brand hover:bg-brand-dim text-white rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {submitting ? '신청 중...' : '수강신청 하기'}
                    </button>
                  </div>
                ))}

              {/* ── 신청 확인 · 취소 ── */}
              {section === 'lookup' && (
                <>
                  <div className={`${cardClass} p-4 space-y-4`}>
                    <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
                      신청 시 입력하신 전화번호와 생년월일로 신청 내역을 확인하고 취소할 수
                      있습니다.
                    </p>
                    <div>
                      <label className={labelClass}>전화번호</label>
                      <input
                        type="tel"
                        value={lookupForm.phone}
                        onChange={(e) =>
                          setLookupForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="010-0000-0000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>생년월일</label>
                      <input
                        type="date"
                        value={lookupForm.birth_date}
                        onChange={(e) =>
                          setLookupForm((f) => ({ ...f, birth_date: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <button
                      onClick={handleLookup}
                      disabled={lookingUp}
                      className="w-full py-3 text-sm font-bold bg-brand hover:bg-brand-dim text-white rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {lookingUp ? '조회 중...' : '신청 내역 조회'}
                    </button>
                  </div>

                  {lookupResults !== null &&
                    lookupResults.map((application) => (
                      <div key={application.id} className={`${cardClass} p-4`}>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white/90 truncate">
                            {application.class_title ?? '강좌'}
                          </h3>
                          <span
                            className={`flex-shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[application.status]}`}
                          >
                            {STATUS_LABEL[application.status]}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-400 dark:text-white/40 mt-1">
                          {application.name} · {formatDate(application.created_at)} 신청
                        </p>
                        {application.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(application)}
                            className="mt-3 w-full py-2 text-[13px] font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/25 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            수강신청 취소
                          </button>
                        )}
                      </div>
                    ))}
                  {lookupResults !== null && lookupResults.length === 0 && (
                    <div className={`${cardClass} py-10 text-center`}>
                      <p className="text-sm text-gray-400 dark:text-white/35">
                        신청 내역이 없습니다
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ── 공지사항 ── */}
              {section === 'notice' &&
                (notices.length === 0 ? (
                  <div className={`${cardClass} py-12 text-center`}>
                    <p className="text-sm text-gray-400 dark:text-white/35">
                      등록된 공지사항이 없습니다
                    </p>
                  </div>
                ) : (
                  notices.map((notice) => {
                    const open = openNoticeId === notice.id
                    return (
                      <button
                        key={notice.id}
                        onClick={() => setOpenNoticeId(open ? null : notice.id)}
                        className={`${cardClass} w-full p-4 text-left`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white/90">
                            {notice.title}
                          </h3>
                          <span
                            className={`material-icons-outlined text-[18px] text-gray-300 dark:text-white/25 transition-transform ${open ? 'rotate-180' : ''}`}
                          >
                            expand_more
                          </span>
                        </div>
                        <p className="text-[11.5px] text-gray-400 dark:text-white/35 mt-1">
                          {formatDate(notice.created_at)}
                        </p>
                        {open && (
                          <p className="text-[13px] text-gray-600 dark:text-white/60 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] leading-relaxed whitespace-pre-wrap">
                            {notice.content}
                          </p>
                        )}
                      </button>
                    )
                  })
                ))}

              {/* ── 강좌 문의 ── */}
              {section === 'contact' && (
                <div className={`${cardClass} p-4 space-y-4`}>
                  <h2 className="text-[14px] font-bold text-gray-900 dark:text-white/90">
                    강좌 문의
                  </h2>
                  {[
                    {
                      icon: 'chat_bubble_outline',
                      title: '카카오 채널',
                      desc: '"참빛문화교실" 검색 후 대화하기',
                    },
                    {
                      icon: 'call',
                      title: '전화 문의',
                      desc: '김정란 집사 · 010-7572-2949',
                      href: 'tel:010-7572-2949',
                    },
                    {
                      icon: 'edit_note',
                      title: '방문 접수',
                      desc: '신청서를 작성하셔서 2층 교역자 사무실에 제출하셔도 됩니다',
                    },
                    {
                      icon: 'account_balance',
                      title: '수강료 입금 계좌',
                      desc: '농협 301-0254-9469-31 (대한예수교장로회 참빛교회)',
                    },
                  ].map((row) => {
                    const content = (
                      <>
                        <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] flex items-center justify-center flex-shrink-0">
                          <span className="material-icons-outlined text-[18px] text-brand">
                            {row.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 dark:text-white/80">
                            {row.title}
                          </p>
                          <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-0.5 leading-relaxed">
                            {row.desc}
                          </p>
                        </div>
                      </>
                    )
                    return row.href ? (
                      <a key={row.title} href={row.href} className="flex items-start gap-3">
                        {content}
                      </a>
                    ) : (
                      <div key={row.title} className="flex items-start gap-3">
                        {content}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Culture
