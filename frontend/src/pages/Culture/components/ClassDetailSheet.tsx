// 강좌 상세 — 기본 틀(표지·소개·안내·강사·수업 계획표) + 선생님이 덧붙인 자유 꼭지.
// 모바일은 아래에서 올라오는 시트, PC(lg+)는 오른쪽 넓은 패널. 채운 칸만 그린다.

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import type { CultureClass, CultureDetailSection } from '../../../types/culture'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useFeedTextScale } from '../../../utils/feedTextScale'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import { classDetailQuery } from '../classDetailQuery'
import { getClassAccent, withAlpha } from '../cultureAccents'
import '../culture-apply.css'

const bodyText =
  'text-[14px] lg:text-[16.5px] leading-[1.75] text-gray-700 dark:text-white/75 whitespace-pre-wrap'

const lines = (text?: string | null) =>
  (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** 꼭지 제목 — 대표 색 짧은 줄 + 제목 */
const SectionTitle = ({ color, children }: { color: string; children: ReactNode }) => (
  <h3 className="flex items-center gap-2.5 text-[16.5px] lg:text-[20px] font-bold text-ink-strong">
    <span className="h-[3px] w-6 shrink-0 rounded-full" style={{ background: color }} />
    {children}
  </h3>
)

const tintBox = 'rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]'

const FreeSection = ({ section, color }: { section: CultureDetailSection; color: string }) => {
  const title = section.title.trim()
  if (section.type === 'quote') {
    if (!section.body.trim()) return null
    return (
      <section
        className="rounded-2xl px-5 py-4 lg:px-6 lg:py-5"
        style={{ background: withAlpha(color, 0.1), borderLeft: `4px solid ${color}` }}
      >
        {title && (
          <p className="mb-1 text-[12.5px] lg:text-[14.5px] font-bold" style={{ color }}>
            {title}
          </p>
        )}
        <p className="text-[15.5px] lg:text-[19px] font-bold leading-[1.6] text-ink-strong whitespace-pre-wrap">
          {section.body.trim()}
        </p>
      </section>
    )
  }
  if (section.type === 'image') {
    if (!section.image_url) return null
    return (
      <section className="space-y-3">
        {title && <SectionTitle color={color}>{title}</SectionTitle>}
        <img
          src={section.image_url}
          alt={title || '강좌 사진'}
          loading="lazy"
          className="w-full rounded-2xl border border-gray-100 dark:border-white/[0.06] dark:[filter:var(--media-dim)]"
        />
        {section.body.trim() && (
          <p className="text-[13px] lg:text-[15px] text-gray-500 dark:text-white/55 whitespace-pre-wrap">
            {section.body.trim()}
          </p>
        )}
      </section>
    )
  }
  if (section.type === 'list') {
    const items = lines(section.body)
    if (items.length === 0) return null
    return (
      <section className="space-y-3">
        {title && <SectionTitle color={color}>{title}</SectionTitle>}
        <ul className={`${tintBox} px-4 py-3.5 lg:px-5 lg:py-4 space-y-2`}>
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] lg:text-[16.5px] leading-[1.6] text-gray-700 dark:text-white/75">
              <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
              {item}
            </li>
          ))}
        </ul>
      </section>
    )
  }
  if (!section.body.trim()) return null
  return (
    <section className="space-y-3">
      {title && <SectionTitle color={color}>{title}</SectionTitle>}
      <p className={bodyText}>{section.body.trim()}</p>
    </section>
  )
}

const ClassDetailSheet = ({
  cultureClass,
  onClose,
  onApply,
}: {
  cultureClass: CultureClass
  onClose: () => void
  onApply: (c: CultureClass) => void
}) => {
  useModalBackButton(onClose)
  const textScale = useFeedTextScale()

  const c = cultureClass
  // 목록엔 카드 칸만 실려 온다 — 계획표·꼭지·강사 소개는 여기서 받는다(카드에 손이 닿을 때 미리 받아 둔다).
  // 받는 동안·실패(옛 서버)엔 목록에 실린 것으로 그린다. 잔여석 등 나머지는 늘 목록 값.
  const { data: full } = useQuery(classDetailQuery(c.id))
  const d = full?.detail ?? c.detail
  const accent = getClassAccent(c)
  const color = accent.color

  const capacity = c.capacity ?? null
  const count = c.application_count
  const remaining =
    capacity !== null && capacity > 0 && typeof count === 'number' ? Math.max(0, capacity - count) : null
  const isFull = remaining === 0

  const curriculum = (d?.curriculum ?? []).filter((row) => row.title.trim() || row.note.trim())
  const hasNote = curriculum.some((row) => row.note.trim())
  const bio = lines(d?.instructor_bio)
  const scheduleLines = lines(c.schedule)

  const infoRows = [
    // 경력을 적지 않은 강좌는 강사 꼭지를 따로 세우지 않고 안내 표에 이름만 둔다
    { label: '강사', value: bio.length === 0 ? c.instructor : null },
    { label: '장소', value: c.location },
    { label: '수강료', value: c.fee },
    { label: '정원', value: capacity ? `${capacity}명` : null },
    { label: '모집', value: c.quarter },
  ].filter((row) => row.value)

  const heroFacts = (
    <>
      <h2 className="text-[24px] lg:text-[30px] font-bold leading-tight tracking-[-0.01em]">
        {c.title}
        {d?.duration && <span className="font-medium whitespace-nowrap"> ({d.duration})</span>}
      </h2>
      {(d?.target || scheduleLines.length > 0) && (
        <>
          <span className="mt-3 mb-3 block h-px w-10 bg-white/80" />
          <dl className="space-y-1 text-[14px] lg:text-[16.5px] font-semibold leading-[1.55]">
            {d?.target && (
              <div className="flex gap-2">
                <dt className="shrink-0 opacity-80">대상</dt>
                <dd>{d.target}</dd>
              </div>
            )}
            {scheduleLines.length > 0 && (
              <div className="flex gap-2">
                <dt className="shrink-0 opacity-80">시간</dt>
                <dd>
                  {scheduleLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
    </>
  )

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center lg:items-stretch lg:justify-end bg-black/60 backdrop-blur-sm overflow-hidden"
      onClick={onClose}
    >
      <div
        data-scale={textScale}
        role="dialog"
        aria-modal="true"
        aria-label={`${c.title} 강좌 안내`}
        className="culture-detail-panel relative flex w-full flex-col overflow-hidden rounded-t-3xl bg-background-light dark:bg-card-dark shadow-[0_-12px_40px_rgba(0,0,0,0.5)] animate-slide-up lg:w-[680px] lg:max-w-[92vw] lg:rounded-none lg:rounded-l-3xl lg:animate-fade-in lg:shadow-[-16px_0_48px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetGrabber
          onClose={onClose}
          className="absolute left-1/2 top-2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-white/70 shadow lg:hidden"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <span className="material-icons-outlined text-[22px]">close</span>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* 표지 — 사진이 있으면 사진 위에 대표 색 판, 없으면 대표 색 면 */}
          {d?.cover_image_url ? (
            <div className="relative">
              <img
                src={d.cover_image_url}
                alt=""
                className="block h-[300px] lg:h-[380px] w-full object-cover dark:[filter:var(--media-dim)]"
              />
              <div
                className="absolute bottom-4 left-4 right-10 max-w-[360px] rounded-2xl px-5 py-4 lg:bottom-6 lg:left-6 lg:px-6 lg:py-5 text-white shadow-lg"
                style={{ background: withAlpha(color, 0.93) }}
              >
                {heroFacts}
              </div>
            </div>
          ) : (
            <div
              className="relative overflow-hidden px-5 pt-10 pb-6 lg:px-8 lg:pt-12 lg:pb-8 text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${withAlpha(color, 0.78)})` }}
            >
              <accent.Icon
                width={150}
                height={150}
                strokeWidth={1.2}
                className="pointer-events-none absolute -bottom-6 -right-4 opacity-20"
              />
              <div className="relative max-w-[78%]">{heroFacts}</div>
            </div>
          )}

          <div className="space-y-7 px-5 py-6 lg:space-y-9 lg:px-8 lg:py-8">
            {c.description?.trim() && (
              <section className="space-y-3">
                <SectionTitle color={color}>강좌 소개</SectionTitle>
                <p className={bodyText}>{c.description.trim()}</p>
              </section>
            )}

            {infoRows.length > 0 && (
              <section className="space-y-3">
                <SectionTitle color={color}>강좌 안내</SectionTitle>
                <dl className={`${tintBox} px-4 py-3.5 lg:px-5 lg:py-4 space-y-2`}>
                  {infoRows.map((row) => (
                    <div key={row.label} className="flex gap-3 text-[14px] lg:text-[16.5px] leading-[1.6]">
                      <dt className="w-14 lg:w-16 shrink-0 font-semibold text-gray-500 dark:text-white/55">
                        {row.label}
                      </dt>
                      <dd className="text-gray-800 dark:text-white/85">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {bio.length > 0 && (
              <section className="space-y-3">
                <SectionTitle color={color}>
                  강사 소개{c.instructor ? ` · ${c.instructor} 강사` : ''}
                </SectionTitle>
                <ul className={`${tintBox} px-4 py-3.5 lg:px-5 lg:py-4 space-y-1.5`}>
                  {bio.map((line, i) => (
                    <li key={i} className="text-[14px] lg:text-[16.5px] leading-[1.6] text-gray-700 dark:text-white/75">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {curriculum.length > 0 && (
              <section className="space-y-3">
                <SectionTitle color={color}>수업 계획표 ({curriculum.length}주)</SectionTitle>
                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08]">
                  <table className="w-full border-collapse text-[14px] lg:text-[16.5px]">
                    <thead>
                      <tr className="text-white" style={{ background: color }}>
                        <th className="w-12 lg:w-16 px-2 py-2.5 lg:py-3 font-bold">주</th>
                        <th className="px-3 py-2.5 lg:py-3 font-bold">수업 계획</th>
                        {hasNote && <th className="w-[30%] px-3 py-2.5 lg:py-3 font-bold">비고</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {curriculum.map((row, i) => (
                        <tr key={i} className="border-t border-gray-200 dark:border-white/[0.08]">
                          <td className="bg-gray-50 dark:bg-white/[0.04] px-2 py-2.5 lg:py-3 text-center font-semibold tabular-nums text-gray-600 dark:text-white/65">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2.5 lg:py-3 text-center text-gray-800 dark:text-white/85">
                            {row.title}
                          </td>
                          {hasNote && (
                            <td className="border-l border-gray-200 dark:border-white/[0.08] px-3 py-2.5 lg:py-3 text-center text-gray-600 dark:text-white/65">
                              {row.note}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(d?.sections ?? []).map((section, i) => (
              <FreeSection key={i} section={section} color={color} />
            ))}
          </div>
        </div>

        {/* 신청 버튼 — 항상 아래에 고정 */}
        <div className="shrink-0 border-t border-black/[0.05] dark:border-white/[0.08] px-5 py-3.5 lg:px-8 lg:py-4 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {remaining !== null && c.is_open && !isFull && (
            <p className="mb-2 text-center text-[12.5px] lg:text-[14.5px] font-semibold" style={{ color }}>
              {remaining}자리 남았어요
            </p>
          )}
          <button
            type="button"
            onClick={() => onApply(c)}
            disabled={!c.is_open || isFull}
            className={`relative w-full h-12 lg:h-14 text-[15px] lg:text-[17px] font-bold rounded-xl transition-colors [--seal-radius:0.75rem] ${
              !c.is_open || isFull
                ? 'bg-gray-200 text-gray-400 dark:bg-white/[0.06] dark:text-white/35'
                : 'seal-chip bg-brand hover:bg-brand-dim text-white'
            }`}
          >
            {!c.is_open ? '지금은 모집 기간이 아니에요' : isFull ? '정원 마감' : '이 강좌 수강신청'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ClassDetailSheet
