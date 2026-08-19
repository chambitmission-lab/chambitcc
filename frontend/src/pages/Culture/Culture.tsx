import { useEffect, useState } from 'react'
import DatePicker from '../../components/common/DatePicker'
import { showToast } from '../../utils/toast'
import {
  getCultureClasses,
  getCultureNotices,
  lookupCultureApplications,
  cancelCultureApplication,
} from '../../api/culture'
import type {
  CultureClass,
  CultureNotice,
  CultureApplication,
  CultureApplicationStatus,
} from '../../types/culture'
import ApplySheet, { AccountCopyRow, BANK_ACCOUNT } from './ApplySheet'
import {
  getCultureAccent,
  withAlpha,
  parseScheduleDays,
  quarterEmoji,
} from './cultureAccents'
import { confirmDialog } from '../../utils/confirmDialog'

type SectionKey = 'classes' | 'lookup' | 'notice' | 'contact'

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'classes', label: '강좌', icon: 'palette' },
  { key: 'lookup', label: '신청 내역', icon: 'fact_check' },
  { key: 'notice', label: '공지사항', icon: 'campaign' },
  { key: 'contact', label: '문의', icon: 'support_agent' },
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
  'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

/* DatePicker 트리거를 이 폼의 입력들과 같은 테두리·높이로 맞춘다 */
const datePickerTriggerClass =
  `${inputClass} flex items-center justify-between gap-2 text-left hover:border-brand`

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

const isRecentNotice = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000

// ── 강좌 카드 ─────────────────────────────────────────────────────────

const ClassCard = ({
  cultureClass,
  onApply,
}: {
  cultureClass: CultureClass
  onApply: (c: CultureClass) => void
}) => {
  const accent = getCultureAccent(cultureClass.title)
  const days = parseScheduleDays(cultureClass.schedule)

  const capacity = cultureClass.capacity ?? null
  const count = cultureClass.application_count
  const hasSeatInfo = capacity !== null && capacity > 0 && typeof count === 'number'
  const remaining = hasSeatInfo ? Math.max(0, capacity - count) : null
  const ratio = hasSeatInfo ? Math.min(1, count / capacity) : 0
  const isFull = remaining === 0
  const almostFull = hasSeatInfo && !isFull && (remaining! <= 3 || ratio >= 0.8)

  return (
    <div className={`${cardClass} overflow-hidden`}>
      {/* 상단 파스텔 틴트 헤더 */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3"
        style={{
          background: `linear-gradient(135deg, ${withAlpha(accent.color, 0.1)}, transparent 70%)`,
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] shrink-0"
          style={{
            background: withAlpha(accent.color, 0.14),
            border: `1px solid ${withAlpha(accent.color, 0.22)}`,
          }}
        >
          {accent.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-[15.5px] font-bold text-gray-900 dark:text-white/90">
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
            {almostFull && cultureClass.is_open && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 text-amber-600 dark:text-amber-300">
                마감 임박
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {cultureClass.quarter && (
              <span className="text-[11.5px] font-semibold" style={{ color: accent.color }}>
                {cultureClass.quarter}
              </span>
            )}
            {days.length > 0 && (
              <span className="flex items-center gap-1">
                {days.map((d) => (
                  <span
                    key={d}
                    className="w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                      background: withAlpha(accent.color, 0.13),
                      color: accent.color,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        {cultureClass.description && (
          <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed whitespace-pre-wrap">
            {cultureClass.description}
          </p>
        )}

        <div className="mt-3 space-y-1.5">
          {[
            { icon: 'person', value: cultureClass.instructor && `강사 ${cultureClass.instructor}` },
            { icon: 'schedule', value: cultureClass.schedule },
            { icon: 'payments', value: cultureClass.fee },
            { icon: 'place', value: cultureClass.location },
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

        {/* 잔여석 게이지 */}
        {hasSeatInfo ? (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] text-gray-400 dark:text-white/40">
                정원 {capacity}명
              </span>
              <span
                className={`text-[11.5px] font-bold ${
                  isFull
                    ? 'text-gray-400 dark:text-white/40'
                    : almostFull
                      ? 'text-amber-600 dark:text-amber-300'
                      : ''
                }`}
                style={isFull || almostFull ? undefined : { color: accent.color }}
              >
                {isFull ? '정원이 모두 찼어요' : `${remaining}자리 남았어요`}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: withAlpha(accent.color, 0.12) }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${ratio * 100}%`, background: accent.color }}
              />
            </div>
          </div>
        ) : (
          capacity !== null &&
          capacity > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="material-icons-outlined text-[15px] text-gray-400 dark:text-white/35">
                groups
              </span>
              <span className="text-[12.5px] text-gray-600 dark:text-white/55">
                정원 {capacity}명
              </span>
            </div>
          )
        )}

        {cultureClass.is_open && (
          <button
            onClick={() => onApply(cultureClass)}
            disabled={isFull}
            className="mt-3.5 w-full py-2.5 text-sm font-semibold bg-brand hover:bg-brand-dim text-white rounded-xl transition-colors disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/[0.06] dark:disabled:text-white/35"
          >
            {isFull ? '정원 마감' : '이 강좌 수강신청'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────

const Culture = () => {
  const [section, setSection] = useState<SectionKey>('classes')
  const [classes, setClasses] = useState<CultureClass[]>([])
  const [notices, setNotices] = useState<CultureNotice[]>([])
  const [loading, setLoading] = useState(true)

  // 수강신청 바텀시트
  const [applyTarget, setApplyTarget] = useState<CultureClass | null>(null)

  // 신청 확인·취소
  const [lookupForm, setLookupForm] = useState({ phone: '', birth_date: '' })
  const [lookupResults, setLookupResults] = useState<CultureApplication[] | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  // 공지 펼침 / 이용 안내 펼침
  const [openNoticeId, setOpenNoticeId] = useState<number | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

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
  const heroQuarter = openClasses.find((c) => c.quarter)?.quarter ?? null
  const newNoticeCount = notices.filter((n) => isRecentNotice(n.created_at)).length

  const handleSubmitted = (application: CultureApplication) => {
    // 방금 신청한 강좌의 잔여석을 바로 반영
    setClasses((prev) =>
      prev.map((c) =>
        c.id === application.class_id && typeof c.application_count === 'number'
          ? { ...c, application_count: c.application_count + 1 }
          : c
      )
    )
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
    if (
      !(await confirmDialog({
        title: '수강신청 취소',
        message: `"${application.class_title ?? '강좌'}" 수강신청을 취소할까요?`,
        description: '취소 후 다시 신청하려면 잔여석이 있어야 해요.',
        confirmText: '신청 취소',
        cancelText: '닫기',
        icon: 'event_busy',
      }))
    )
      return
    try {
      const updated = await cancelCultureApplication(application.id, {
        phone: lookupForm.phone.trim(),
        birth_date: lookupForm.birth_date.trim(),
      })
      setLookupResults((prev) =>
        prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev
      )
      // 취소된 만큼 잔여석 복구
      setClasses((prev) =>
        prev.map((c) =>
          c.id === updated.class_id &&
          typeof c.application_count === 'number' &&
          c.application_count > 0
            ? { ...c, application_count: c.application_count - 1 }
            : c
        )
      )
      showToast('수강신청이 취소되었습니다', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '취소에 실패했습니다', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-3">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            CULTURE CLASS
          </p>
          <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
            문화교실
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
            아름다운 배움과 즐거운 만남이 있는 참빛 문화교실입니다
          </p>
        </header>

        {/* 칩 탭 — 강좌가 첫 화면의 주인공이 되도록 메뉴를 압축 */}
        <nav className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar">
            {SECTIONS.map((s) => {
              const active = section === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={`relative flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-full border text-[13px] font-semibold transition-all ${
                    active
                      ? 'border-brand bg-brand text-white shadow-[0_2px_10px_var(--brand-glow)]'
                      : 'border-gray-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card-dark text-gray-600 dark:text-white/65 hover:border-[var(--brand-soft-strong)]'
                  }`}
                >
                  <span className="material-icons-outlined text-[16px]">{s.icon}</span>
                  {s.label}
                  {s.key === 'notice' && newNoticeCount > 0 && (
                    <span
                      className={`min-w-[16px] h-4 px-1 rounded-full text-[9.5px] font-bold flex items-center justify-center ${
                        active ? 'bg-white text-brand' : 'bg-red-500 text-white'
                      }`}
                    >
                      {newNoticeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* 섹션 콘텐츠 */}
        <div className="px-4 pt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── 강좌 ── */}
              {section === 'classes' && (
                <>
                  {/* 시즌 모집 히어로 배너 */}
                  {openClasses.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-4">
                      <div className="absolute -top-6 -right-4 text-[64px] opacity-20 rotate-12 pointer-events-none select-none">
                        {quarterEmoji(heroQuarter)}
                      </div>
                      <p className="text-[11px] font-bold tracking-[0.1em] text-brand uppercase">
                        Now Open
                      </p>
                      <h2 className="text-[17px] font-bold text-ink-strong mt-1">
                        {quarterEmoji(heroQuarter)}{' '}
                        {heroQuarter ? `${heroQuarter} 수강생 모집 중` : '수강생 모집 중'}
                      </h2>
                      <p className="text-[12.5px] text-gray-600 dark:text-white/60 mt-1">
                        {openClasses.length}개 강좌가 성도님을 기다리고 있어요
                      </p>
                    </div>
                  )}

                  {classes.length === 0 ? (
                    <div className={`${cardClass} py-14 text-center`}>
                      <p className="text-[32px] mb-2">🌱</p>
                      <p className="text-sm font-semibold text-gray-500 dark:text-white/50">
                        현재 개설된 강좌가 없습니다
                      </p>
                      <p className="text-[12.5px] text-gray-400 dark:text-white/35 mt-1">
                        다음 분기 강좌를 기대해 주세요
                      </p>
                    </div>
                  ) : (
                    classes.map((c) => (
                      <ClassCard key={c.id} cultureClass={c} onApply={setApplyTarget} />
                    ))
                  )}

                  {/* 이용 안내 — 접이식으로 강좌 아래에 배치 */}
                  <div className={`${cardClass} overflow-hidden`}>
                    <button
                      onClick={() => setGuideOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons-outlined text-[18px] text-brand">
                          info
                        </span>
                        <span className="text-[13.5px] font-bold text-gray-800 dark:text-white/85">
                          문화교실 이용 안내
                        </span>
                      </span>
                      <span
                        className={`material-icons-outlined text-[18px] text-gray-300 dark:text-white/25 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
                      >
                        expand_more
                      </span>
                    </button>
                    {guideOpen && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
                          다양한 강좌가 개설되어 있으며, 분기별로 수강생을 모집합니다. 모집 기간
                          이후에도 상시 신청하실 수 있으니 편하게 문의해 주세요.
                        </p>
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] space-y-1.5">
                          {[
                            '① 강좌 카드에서 수강신청 버튼을 눌러 신청서를 작성해 주세요',
                            '② 수강료를 입금하시면 등록이 완료됩니다',
                            '③ 12회 일괄 또는 5회 분할 입금이 가능합니다',
                          ].map((step) => (
                            <p key={step} className="text-[12.5px] text-gray-600 dark:text-white/55">
                              {step}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

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
                      <DatePicker
                        value={lookupForm.birth_date}
                        onChange={(date) =>
                          setLookupForm((f) => ({ ...f, birth_date: date }))
                        }
                        placeholder="생년월일을 선택해주세요"
                        birthMode
                        className={datePickerTriggerClass}
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
                    lookupResults.map((application) => {
                      const accent = getCultureAccent(application.class_title ?? '')
                      return (
                        <div key={application.id} className={`${cardClass} p-4`}>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                              style={{ background: withAlpha(accent.color, 0.14) }}
                            >
                              {accent.emoji}
                            </div>
                            <div className="min-w-0 flex-1">
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
                              <p className="text-[12px] text-gray-400 dark:text-white/40 mt-0.5">
                                {application.name} · {formatDate(application.created_at)} 신청
                              </p>
                            </div>
                          </div>
                          {application.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(application)}
                              className="mt-3 w-full py-2 text-[13px] font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/25 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              수강신청 취소
                            </button>
                          )}
                        </div>
                      )
                    })}
                  {lookupResults !== null && lookupResults.length === 0 && (
                    <div className={`${cardClass} py-10 text-center`}>
                      <p className="text-[28px] mb-2">🔍</p>
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
                  <div className={`${cardClass} py-14 text-center`}>
                    <p className="text-[32px] mb-2">📭</p>
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
                          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white/90 flex items-center gap-1.5 min-w-0">
                            <span className="truncate">{notice.title}</span>
                            {isRecentNotice(notice.created_at) && (
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                N
                              </span>
                            )}
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

              {/* ── 문의 ── */}
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

                  {/* 수강료 입금 계좌 — 복사 버튼 포함 */}
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] flex items-center justify-center flex-shrink-0">
                        <span className="material-icons-outlined text-[18px] text-brand">
                          account_balance
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 dark:text-white/80">
                          수강료 입금 계좌
                        </p>
                        <p className="text-[12.5px] text-gray-500 dark:text-white/50 mt-0.5">
                          {BANK_ACCOUNT.holder}
                        </p>
                      </div>
                    </div>
                    <AccountCopyRow />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 수강신청 바텀시트 */}
      {applyTarget && (
        <ApplySheet
          cultureClass={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}

export default Culture
