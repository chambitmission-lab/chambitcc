import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import type { ReflectionState } from '../../../../hooks/usePlanReflections'
import { normalizeReflection } from '../reflectionText'
import { parseReflection, splitQuoted } from '../reflectionParse'

interface ReflectionSheetProps {
  dayNumber: number
  dayTitle?: string | null
  /** 일차 본문 표기 (예: "창세기 20-22장") — 응답의 reference가 없을 때 폴백 */
  passageLabel: string
  state?: ReflectionState
  admin: boolean
  regenerating: boolean
  onEdit: () => void
  onRegenerate: () => void
  /** 하단 CTA — 오늘 본문 읽기로 이동 */
  onRead: () => void
  onClose: () => void
}

/**
 * AI 묵상 읽기 시트.
 *
 * 일정 카드 안에 통짜 텍스트로 펼치는 대신, 권 개관(BookIntroSheet)처럼
 * 별도 지면으로 분리했다. 묵상은 "읽고 싶을 때" 넉넉한 타이포로 읽는 콘텐츠가 된다.
 *
 * 읽힘을 만드는 규칙 (개관 시트와 동일):
 *  - 본문에 색을 쓰지 않는다 — 위계는 크기·행간·여백으로만
 *  - 색(브랜드 블루)은 아이브로우·흐름 장 번호·적용 카드 액센트에만 얹는다
 *  - 문단을 역할별로 해체한다: 리드 → 오늘의 흐름 → 본문 → 오늘의 한 걸음 → 묵상 질문
 */
const ReflectionSheet = ({
  dayNumber,
  dayTitle,
  passageLabel,
  state,
  admin,
  regenerating,
  onEdit,
  onRegenerate,
  onRead,
  onClose,
}: ReflectionSheetProps) => {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useModalBackButton(onClose)

  // 서버가 인증을 요구한 경우(구버전 서버 등) — 영문 에러 문자열 대신 로그인 안내
  const authError = /not authenticated|401|credentials/i.test(state?.error ?? '')

  // 시트가 열린 동안 뒤 화면(플랜 일정)이 같이 스크롤되지 않게 잠근다
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const data = state?.data
  const reference = data?.reference || passageLabel || dayTitle || ''
  const parsed = data ? parseReflection(data.reflection) : null

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full sm:max-w-[560px] bg-surface-container rounded-t-[28px] sm:rounded-[28px] overflow-hidden border-t sm:border border-[var(--card-border)] shadow-[0_-16px_48px_rgba(0,0,0,0.35)] flex flex-col"
        style={{ maxHeight: 'calc(var(--vvh, 100dvh) * 0.92)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${dayNumber}일차 AI 묵상`}
      >
        {/* 그래버 + 스크롤 시 나타나는 미니 헤더 — 몇 일차 묵상인지 잃지 않게 */}
        <div className="relative shrink-0 pt-2.5 pb-1">
          <div className="mx-auto w-9 h-1 rounded-full bg-[var(--text-muted)]/40" />
          <div
            className={`flex items-center gap-2 px-5 h-9 transition-opacity duration-200 ${
              scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="material-icons-round text-[17px] text-brand">auto_awesome</span>
            <p className="text-[14px] font-bold text-ink-strong truncate">
              {dayNumber}일차 · {reference}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-[var(--surface-inset)] transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 24)}
          className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6"
        >
          {/* 표제 */}
          <p className="flex items-center gap-1 text-[11.5px] font-bold tracking-[0.14em] text-brand">
            <span className="material-icons-round text-[14px]">auto_awesome</span>
            AI 묵상 · {dayNumber}일차
          </p>
          <h2 className="mt-1 text-[25px] font-bold tracking-[-0.03em] leading-[1.25] text-ink-strong">
            {reference}
          </h2>
          {dayTitle && dayTitle !== reference && (
            <p className="mt-1 text-[14px] text-ink-muted">{dayTitle}</p>
          )}

          {state?.loading ? (
            state.streamText ? (
              // SSE 스트리밍 중 — 도착한 본문을 실시간 표시 (타자기 효과)
              <p className="mt-5 text-[15px] leading-[1.85] text-ink whitespace-pre-wrap break-keep">
                {normalizeReflection(state.streamText)}
                <span
                  className="inline-block w-[2px] h-[1em] ml-0.5 align-[-0.15em] bg-brand animate-pulse"
                  aria-hidden
                />
              </p>
            ) : (
              <div className="mt-6 space-y-3" aria-label="묵상을 준비하고 있어요">
                {[100, 94, 97, 62].map((w, i) => (
                  <div
                    key={i}
                    className="h-4 rounded-full bg-[var(--surface-inset)] animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
                <p className="pt-1 text-[12.5px] text-ink-muted">묵상을 준비하고 있어요…</p>
              </div>
            )
          ) : state?.error ? (
            authError ? (
              <div className="mt-6 rounded-2xl bg-[var(--surface-inset)] px-4 py-4">
                <p className="text-[14px] font-semibold text-ink">로그인하면 AI 묵상을 읽을 수 있어요</p>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  로그인 후 다시 열어 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white"
                >
                  <span className="material-icons-round text-[16px]" aria-hidden>login</span>
                  로그인하기
                </button>
              </div>
            ) : (
              <p className="mt-6 text-[13.5px] text-red-500 dark:text-red-300">{state.error}</p>
            )
          ) : parsed ? (
            <>
              {/* 리드 — 본문보다 반 단계 큰 활자로 오늘 본문을 소개 */}
              {parsed.lede && (
                <p className="mt-4 text-[16px] leading-[1.75] text-ink break-keep">
                  {parsed.lede}
                </p>
              )}

              {/* 오늘의 흐름 — 리드에서 장별 주제가 잡혔을 때만 (개관 '책의 흐름' 축소판) */}
              {parsed.flow.length > 0 && (
                <section className="mt-5 rounded-2xl bg-[var(--surface-inset)] px-4 py-3.5">
                  <p className="text-[12px] font-bold text-ink-muted mb-2.5">오늘의 흐름</p>
                  <ul className="space-y-2">
                    {parsed.flow.map((f, i) => (
                      <li key={i} className="flex items-baseline gap-2.5">
                        <span className="shrink-0 w-[58px] text-[12.5px] font-bold tabular-nums text-brand">
                          {f.chapter}
                        </span>
                        <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <hr className="my-5 border-0 h-px bg-[var(--brand-soft)]" />

              {/* 본문 — 색 없이 행간·문단 여백으로만 읽힘을 만든다. 따옴표 구절만 세미볼드 */}
              <div className="space-y-4">
                {parsed.body.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-[1.85] text-ink break-keep">
                    {splitQuoted(paragraph).map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-semibold text-ink-strong">
                          {part}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                ))}
              </div>

              {/* 오늘의 한 걸음 — 마지막 적용 문단을 따로 세워 "읽고 끝"이 되지 않게 */}
              {parsed.step && (
                <section className="mt-6 rounded-2xl px-4 py-3.5 border-l-[3px] border-l-brand bg-[var(--brand-soft)]">
                  <p className="flex items-center gap-1.5 text-[12px] font-bold mb-1.5 text-brand">
                    <span className="material-icons-round text-[16px]">directions_walk</span>
                    오늘의 한 걸음
                  </p>
                  <p className="text-[14.5px] leading-[1.8] text-ink break-keep">{parsed.step}</p>
                </section>
              )}

              {/* 묵상 질문 — 나열 대신 카드로 한 개씩, 잠시 멈추게 */}
              {data && data.questions.length > 0 && (
                <section className="mt-6">
                  <p className="text-[12.5px] font-bold text-ink-strong mb-2.5">
                    잠시 멈추고, 나에게 묻기
                  </p>
                  <ul className="space-y-2">
                    {data.questions.map((q, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-2xl bg-[var(--surface-inset)] px-4 py-3"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand-soft)] text-brand text-[11.5px] font-bold flex items-center justify-center mt-[1px]">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 text-[14px] leading-[1.65] text-ink break-keep">
                          {normalizeReflection(q)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {admin && (
                <div className="mt-7 pt-3.5 flex items-center gap-2 border-t border-[var(--card-border)]">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand tracking-[0.06em]">
                    ADMIN
                  </span>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    수정
                  </button>
                  <span className="text-ink-muted opacity-40">·</span>
                  <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={regenerating}
                    className="text-[12px] font-semibold text-ink-muted hover:text-brand disabled:opacity-50"
                  >
                    {regenerating ? '생성 중…' : 'AI로 다시 생성'}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 푸터 — 묵상을 읽었으면 바로 오늘 본문으로 */}
        <div className="shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--card-border)] bg-surface-container">
          <button
            type="button"
            onClick={onRead}
            className="w-full h-12 rounded-2xl bg-brand text-white text-[15px] font-bold active:scale-[0.99] transition-transform"
          >
            {reference ? `${reference} 읽기` : '본문 읽기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReflectionSheet
