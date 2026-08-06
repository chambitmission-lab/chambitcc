// 우리반 리포트 (/classes/:classId/report) — 교사 전용
// 최근 N주 확인·암송·응답 통계, 주간 추이, 멤버별 현황 + 관심 필요 표시
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClassDetail, useClassReport } from '../../hooks/useClassRoom'
import type { ReportMemberRow, ReportWeekRow } from '../../types/classRoom'
import { isAuthenticated } from '../../utils/auth'
import { Avatar, memberLabel, Shell, timeAgo } from './classUi'

const WEEK_OPTIONS = [4, 8, 12]

// 지표 3종 — 색은 글 유형 액센트(브랜드/앰버/에메랄드)와 동일 계열
const METRICS = [
  { key: 'check_rate', label: '확인', color: '#3182f6' },
  { key: 'recite_rate', label: '암송', color: '#f59e0b' },
  { key: 'rsvp_rate', label: '응답', color: '#10b981' },
] as const

const FLAG_META: Record<string, { label: string; cls: string }> = {
  'needs-check': {
    label: '공지 연속 미확인',
    cls: 'bg-rose-400/15 text-rose-500 dark:text-rose-300',
  },
  'needs-recite': {
    label: '암송 참여 없음',
    cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300',
  },
  inactive: {
    label: '최근 활동 없음',
    cls: 'bg-gray-400/15 text-gray-500 dark:text-white/50',
  },
}

const pct = (v: number | null | undefined): string =>
  v == null ? '—' : `${Math.round(v * 100)}%`

const ClassReport = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const id = Number(classId)
  const [weeks, setWeeks] = useState(4)

  const { data: cls } = useClassDetail(id, isAuthenticated())
  const { data: report, isLoading, error } = useClassReport(id, weeks)

  const attention = report?.members.filter((m) => m.attention_flags.length > 0) ?? []

  return (
    <Shell onBack={() => navigate(`/classes/${id}`)} title="📊 우리반 리포트">
      {/* 기간 선택 */}
      <div className="flex gap-2 px-4 pt-4">
        {WEEK_OPTIONS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWeeks(w)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all ${
              weeks === w
                ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
            }`}
          >
            최근 {w}주
          </button>
        ))}
      </div>

      {isLoading || !report ? (
        <div className="px-4 pt-4 space-y-3">
          {error ? (
            <div className="text-center py-16 px-6">
              <span className="text-4xl block mb-3">🔒</span>
              <p className="text-[13px] text-gray-500 dark:text-white/55">
                {error instanceof Error ? error.message : '리포트를 불러오지 못했습니다'}
              </p>
            </div>
          ) : (
            <>
              <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
              <div className="h-48 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
            </>
          )}
        </div>
      ) : (
        <>
          {/* 요약 타일 */}
          <section className="grid grid-cols-3 gap-2 px-4 pt-4">
            {METRICS.map((m) => (
              <div
                key={m.key}
                className="rounded-2xl p-3.5 bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]"
              >
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-gray-500 dark:text-white/55">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  {m.label}
                </p>
                <p className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong mt-1">
                  {pct(report[m.key])}
                </p>
              </div>
            ))}
          </section>
          <p className="px-5 pt-2 text-[11.5px] text-gray-400 dark:text-white/40">
            최근 {report.weeks}주 · 알림 {report.post_count}개 기준
          </p>

          {/* 주간 추이 */}
          <section className="mx-4 mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <h3 className="text-[14px] font-bold text-ink-strong mb-3">주간 추이</h3>
            {report.trend.every((w) => w.post_count === 0) ? (
              <p className="text-center text-[12.5px] text-gray-400 dark:text-white/40 py-4">
                이 기간에 올린 알림이 없어요
              </p>
            ) : (
              <div className="space-y-3.5">
                {report.trend.map((w) => (
                  <WeekTrendRow key={w.week_start} week={w} />
                ))}
              </div>
            )}
          </section>

          {/* 관심 필요 */}
          {attention.length > 0 && (
            <section className="mx-4 mt-4 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-400/[0.06] border border-rose-200/60 dark:border-rose-300/20">
              <h3 className="text-[14px] font-bold text-rose-600 dark:text-rose-300 mb-1">
                💛 조금 더 살펴봐 주세요
              </h3>
              <p className="text-[11.5px] text-gray-500 dark:text-white/50 mb-3 leading-[1.6]">
                최근 반응이 뜸한 멤버예요. 전화나 심방으로 안부를 물어보면 좋아요.
              </p>
              {attention.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2.5 py-2">
                  <Avatar name={m.name} size={30} />
                  <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-ink-strong truncate">
                    {memberLabel(m.name, m.child_name)}
                  </span>
                  <span className="flex gap-1 flex-wrap justify-end">
                    {m.attention_flags.map((f) => (
                      <span
                        key={f}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold leading-relaxed ${FLAG_META[f]?.cls ?? ''}`}
                      >
                        {FLAG_META[f]?.label ?? f}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* 멤버별 현황 */}
          <section className="mx-4 mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <h3 className="text-[14px] font-bold text-ink-strong mb-1">멤버별 현황</h3>
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mb-2">
              확인 · 암송 · 참석/투표 응답 · ⭐ 누적 암송
            </p>
            {report.members.map((m) => (
              <MemberRow key={m.user_id} member={m} />
            ))}
          </section>
        </>
      )}
      {cls && !cls.is_teacher && (
        <p className="text-center text-[12px] text-gray-400 dark:text-white/40 mt-8">
          리포트는 선생님만 볼 수 있어요
        </p>
      )}
    </Shell>
  )
}

// ── 주간 추이 한 줄 — 지표별 얇은 미터 3개 (색 + 라벨 병기) ──
const WeekTrendRow = ({ week }: { week: ReportWeekRow }) => {
  const d = new Date(week.week_start)
  const label = `${d.getMonth() + 1}/${d.getDate()}주`
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12px] font-bold text-gray-600 dark:text-white/65">{label}</span>
        <span className="text-[10.5px] text-gray-400 dark:text-white/40">
          알림 {week.post_count}개
        </span>
      </div>
      <div className="space-y-1">
        {METRICS.map((m) => {
          const v = week[m.key]
          return (
            <div key={m.key} className="flex items-center gap-2">
              <span className="shrink-0 w-7 text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                {m.label}
              </span>
              <div className="flex-1 h-[6px] rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
                {v != null && (
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(v * 100)}%`, backgroundColor: m.color }}
                  />
                )}
              </div>
              <span className="shrink-0 w-9 text-right text-[10.5px] font-bold text-gray-500 dark:text-white/55 tabular-nums">
                {pct(v)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 멤버별 현황 한 줄 ──
const MemberRow = ({ member: m }: { member: ReportMemberRow }) => (
  <div className="py-2.5 border-b border-gray-100 dark:border-white/[0.05] last:border-0">
    <div className="flex items-center gap-2.5">
      <Avatar name={m.name} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink-strong truncate">
          {memberLabel(m.name, m.child_name)}
          {m.is_teacher && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
              교사
            </span>
          )}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
          {m.last_active_at ? `최근 활동 ${timeAgo(m.last_active_at)}` : '기간 내 활동 없음'}
          {m.attend_count > 0 && ` · 출석 ${m.attend_count}회`}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2 text-[11.5px] font-bold tabular-nums">
        <span className="text-brand">
          ✓ {m.check_count}/{m.check_total}
        </span>
        {m.recite_total > 0 && (
          <span className="text-amber-600 dark:text-amber-300">
            📖 {m.recite_count}/{m.recite_total}
          </span>
        )}
        {m.rsvp_total > 0 && (
          <span className="text-emerald-600 dark:text-emerald-300">
            🗳 {m.rsvp_responded}/{m.rsvp_total}
          </span>
        )}
        <span className="text-gray-500 dark:text-white/55">⭐{m.star_count}</span>
      </div>
    </div>
  </div>
)

export default ClassReport
