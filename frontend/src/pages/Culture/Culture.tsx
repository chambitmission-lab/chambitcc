import { useEffect, useState } from 'react'
import { useThemeArt } from '../../hooks/useThemeArt'
import { CULTURE_HERO } from '../../utils/themeAssets'
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
import { getCultureAccent, withAlpha, quarterIcon, type IconComponent } from './cultureAccents'
import {
  PaletteIcon,
  ClipboardCheckIcon,
  MegaphoneIcon,
  SupportIcon,
  SproutIcon,
  SearchIcon,
  EmptyMailIcon,
} from './CultureIcons'
import { confirmDialog } from '../../utils/confirmDialog'
import { ClassCard } from './components/ClassCard'
import { cardClass, datePickerTriggerClass, inputClass, labelClass } from './components/styles'
import './culture-hero.css'

type SectionKey = 'classes' | 'lookup' | 'notice' | 'contact'

const SECTIONS: { key: SectionKey; label: string; Icon: IconComponent }[] = [
  { key: 'classes', label: '강좌', Icon: PaletteIcon },
  { key: 'lookup', label: '신청 내역', Icon: ClipboardCheckIcon },
  { key: 'notice', label: '공지사항', Icon: MegaphoneIcon },
  { key: 'contact', label: '문의', Icon: SupportIcon },
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


const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const isRecentNotice = (createdAt: string) =>
  Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000

// ── 강좌 카드 ─────────────────────────────────────────────────────────


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

  // 브라우저는 지금 매칭되는 삽화 한 장만 받는다(.culture-hero / .dark .culture-hero).
  // 테마를 토글하는 순간 반대 테마 파일을 맨땅에서 받기 시작해 밴드가 빈 채로 남으므로,
  // 현재 테마가 그려진 뒤 유휴 시간에 반대 테마도 데워 둔다 (themeAssets.ts)
  useThemeArt(CULTURE_HERO)

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
  // 분기 → 계절 아이콘 (배너 워터마크·제목 앞 표식에 함께 쓴다)
  const HeroSeasonIcon = quarterIcon(heroQuarter)
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
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문 + 우측 위젯 레일 2단 (/news·/sermon 등과 같은 규격) */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen pb-20 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 — 오른쪽에 삽화(culture-hero.css)를 높이맞춤으로 깐다.
            안내 문구는 모바일에서 삽화 위를 지나가므로 폭을 묶어 두 줄로 접는다. */}
        <header className="culture-hero px-4 pt-5 pb-3">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            CULTURE CLASS
          </p>
          <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
            문화교실
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2 max-w-[62%] lg:max-w-none">
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
                      ? 'seal-chip border-transparent bg-brand text-white'
                      : 'border-gray-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-card-dark text-gray-600 dark:text-white/65 hover:border-[var(--brand-soft-strong)]'
                  }`}
                >
                  <s.Icon width={15} height={15} className="shrink-0" />
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
                      <div className="absolute -top-6 -right-4 opacity-20 rotate-12 pointer-events-none select-none text-brand">
                        <HeroSeasonIcon width={78} height={78} strokeWidth={1.4} />
                      </div>
                      <p className="text-[11px] font-bold tracking-[0.1em] text-brand uppercase">
                        Now Open
                      </p>
                      <h2 className="text-[17px] font-bold text-ink-strong mt-1">
                        <HeroSeasonIcon
                          width={17}
                          height={17}
                          className="inline-block align-[-2px] mr-1.5 text-brand"
                        />
                        {heroQuarter ? `${heroQuarter} 수강생 모집 중` : '수강생 모집 중'}
                      </h2>
                      <p className="text-[12.5px] text-gray-600 dark:text-white/60 mt-1">
                        {openClasses.length}개 강좌가 성도님을 기다리고 있어요
                      </p>
                    </div>
                  )}

                  {classes.length === 0 ? (
                    <div className={`${cardClass} py-14 text-center`}>
                      <SproutIcon width={34} height={34} className="mx-auto mb-2 text-brand opacity-70" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-white/50">
                        현재 개설된 강좌가 없습니다
                      </p>
                      <p className="text-[12.5px] text-gray-400 dark:text-white/35 mt-1">
                        다음 분기 강좌를 기대해 주세요
                      </p>
                    </div>
                  ) : (
                    // lg+: 넓어진 본문을 세로로만 쓰지 않도록 2열 카드 그리드
                    <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:items-start">
                      {classes.map((c) => (
                        <ClassCard key={c.id} cultureClass={c} onApply={setApplyTarget} />
                      ))}
                    </div>
                  )}

                  {/* 이용 안내 — 접이식으로 강좌 아래에 배치 (lg에선 우측 레일이 대신) */}
                  <div className={`${cardClass} overflow-hidden lg:hidden`}>
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
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: withAlpha(accent.color, 0.14),
                                color: accent.color,
                              }}
                            >
                              <accent.Icon width={19} height={19} />
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
                      <SearchIcon width={30} height={30} className="mx-auto mb-2 text-gray-300 dark:text-white/25" />
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
                    <EmptyMailIcon width={34} height={34} className="mx-auto mb-2 text-gray-300 dark:text-white/25" />
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

      {/* 우측 위젯 레일 (lg+) — 모집 현황·이용 안내·문의를 본문 밖으로 빼
          넓어진 본문은 강좌 카드에 집중하게 한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        {!loading && openClasses.length > 0 && (
          <section className="relative overflow-hidden rounded-2xl border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-4">
            <div className="absolute -top-5 -right-3 opacity-20 rotate-12 pointer-events-none select-none text-brand">
              <HeroSeasonIcon width={64} height={64} strokeWidth={1.4} />
            </div>
            <p className="text-[11px] font-bold tracking-[0.1em] text-brand uppercase">Now Open</p>
            <p className="text-[15px] font-bold text-ink-strong mt-1">
              {heroQuarter ? `${heroQuarter} 모집 중` : '수강생 모집 중'}
            </p>
            <p className="text-[12.5px] text-gray-600 dark:text-white/60 mt-1">
              {openClasses.length}개 강좌가 성도님을 기다리고 있어요
            </p>
          </section>
        )}

        <section className={`${cardClass} p-4`}>
          <p className="flex items-center gap-1.5 mb-2 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
            <span className="material-icons-outlined text-[15px] text-brand">info</span>
            신청은 이렇게
          </p>
          <div className="space-y-1.5">
            {[
              '① 강좌 카드에서 수강신청 버튼을 눌러 신청서를 작성해 주세요',
              '② 수강료를 입금하시면 등록이 완료됩니다',
              '③ 12회 일괄 또는 5회 분할 입금이 가능합니다',
            ].map((step) => (
              <p key={step} className="text-[12.5px] text-gray-600 dark:text-white/55 leading-[1.6]">
                {step}
              </p>
            ))}
          </div>
        </section>

        <section className={`${cardClass} p-4`}>
          <p className="mb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-white/50">
            강좌 문의
          </p>
          <a href="tel:010-7572-2949" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-full bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-[16px] text-brand">call</span>
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-gray-800 dark:text-white/80 group-hover:text-brand transition-colors">
                김정란 집사
              </span>
              <span className="block text-[12px] text-gray-500 dark:text-white/50 tabular-nums">
                010-7572-2949
              </span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setSection('contact')}
            className="mt-3 w-full h-9 rounded-xl border border-[var(--card-border)] text-[12.5px] font-bold text-ink-strong hover:text-brand hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
          >
            카카오 채널 · 입금 계좌 보기
          </button>
        </section>
      </aside>
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
