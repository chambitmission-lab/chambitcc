import { Lock } from '@phosphor-icons/react'
// 주일 출석부 (/classes/:classId/attendance) — 교사 전용
// 날짜(주일) 선택 → 멤버 탭탭 출석 체크, 월간 현황 히트맵
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useClassAttendanceMonth,
  useClassDetail,
  useToggleClassAttendance,
} from '../../hooks/useClassRoom'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { Avatar, memberLabel, Shell } from './classUi'

const fmtMonth = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const fmtDate = (d: Date): string =>
  `${fmtMonth(d)}-${String(d.getDate()).padStart(2, '0')}`

/** 해당 월의 주일(일요일) 목록 */
const sundaysOf = (month: string): string[] => {
  const [y, m] = month.split('-').map(Number)
  const out: string[] = []
  const d = new Date(y, m - 1, 1)
  while (d.getMonth() === m - 1) {
    if (d.getDay() === 0) out.push(fmtDate(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** 가장 최근 주일 (오늘이 주일이면 오늘) */
const lastSunday = (): Date => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d
}

const ClassAttendance = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const id = Number(classId)

  const [month, setMonth] = useState(() => fmtMonth(lastSunday()))
  const [selected, setSelected] = useState(() => fmtDate(lastSunday()))

  const { data: cls } = useClassDetail(id, isAuthenticated())
  const { data: att, isLoading, error } = useClassAttendanceMonth(id, month)
  const toggle = useToggleClassAttendance(id, month)

  const sundays = useMemo(() => sundaysOf(month), [month])
  const today = fmtDate(new Date())

  const presentIds = new Set(att?.records[selected] ?? [])
  const members = cls?.members ?? []
  const students = members.filter((m) => !m.is_teacher)
  const teachers = members.filter((m) => m.is_teacher)

  const moveMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const next = fmtMonth(d)
    setMonth(next)
    const nextSundays = sundaysOf(next)
    setSelected(nextSundays[nextSundays.length - 1] ?? `${next}-01`)
  }

  const handleToggle = async (userId: number) => {
    if (selected > today) {
      showToast('미래 날짜는 출석 체크할 수 없어요', 'error')
      return
    }
    try {
      await toggle.mutateAsync({ attDate: selected, userId })
    } catch (e) {
      showToast(e instanceof Error ? e.message : '출석 체크에 실패했습니다', 'error')
    }
  }

  const chipLabel = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}${iso === today ? ' (오늘)' : ''}`
  }

  return (
    <Shell onBack={() => navigate(`/classes/${id}`)} title="📋 출석부">
      {/* 월 이동 */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center text-gray-500 dark:text-white/60"
          aria-label="이전 달"
        >
          ‹
        </button>
        <span className="text-[16px] font-bold text-ink-strong tabular-nums">
          {month.replace('-', '년 ')}월
        </span>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center text-gray-500 dark:text-white/60"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      {/* 날짜(주일) 칩 */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sundays.map((d) => {
          const active = selected === d
          const count = att?.records[d]?.length ?? 0
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={`shrink-0 px-3.5 py-2 rounded-2xl text-[12px] font-bold transition-all ${
                active
                  ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                  : 'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-white/60'
              }`}
            >
              {chipLabel(d)}
              {count > 0 && (
                <span className={active ? 'ml-1 opacity-90' : 'ml-1 text-brand'}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="text-center py-16 px-6">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-3"><Lock size={26} weight="duotone" color="currentColor" aria-hidden="true" /></span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            {error instanceof Error ? error.message : '출석부를 불러오지 못했습니다'}
          </p>
        </div>
      ) : isLoading || !cls ? (
        <div className="px-4 pt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* 오늘의 출석 체크 */}
          <section className="mx-4 mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[14px] font-bold text-ink-strong">
                {chipLabel(selected)} 출석
              </h3>
              <span className="text-[12.5px] font-bold text-brand tabular-nums">
                {students.filter((m) => presentIds.has(m.user_id)).length}/
                {students.length}명
              </span>
            </div>
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mb-3">
              이름을 누르면 출석 ↔ 미출석이 바뀌어요
            </p>
            <div className="grid grid-cols-2 gap-2">
              {students.map((m) => {
                const present = presentIds.has(m.user_id)
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => handleToggle(m.user_id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-left transition-all active:scale-[0.97] ${
                      present
                        ? 'border-brand/50 bg-[var(--brand-soft)]'
                        : 'border-gray-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]'
                    }`}
                  >
                    <Avatar name={m.name} avatarUrl={m.avatar_url} size={28} />
                    <span
                      className={`flex-1 min-w-0 text-[12.5px] font-semibold truncate ${
                        present ? 'text-brand' : 'text-gray-600 dark:text-white/65'
                      }`}
                    >
                      {m.child_name || m.name}
                    </span>
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        present
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 dark:bg-white/[0.07] text-gray-300 dark:text-white/25'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </div>
            {students.length === 0 && (
              <p className="text-center text-[12.5px] text-gray-400 dark:text-white/40 py-4">
                아직 반에 멤버가 없어요. 초대 링크를 보내보세요!
              </p>
            )}
            {teachers.length > 0 && (
              <details className="mt-3">
                <summary className="text-[12px] font-bold text-gray-400 dark:text-white/40 cursor-pointer select-none">
                  선생님 출석 ({teachers.filter((t) => presentIds.has(t.user_id)).length}/
                  {teachers.length})
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {teachers.map((m) => {
                    const present = presentIds.has(m.user_id)
                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => handleToggle(m.user_id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-left transition-all active:scale-[0.97] ${
                          present
                            ? 'border-brand/50 bg-[var(--brand-soft)]'
                            : 'border-gray-200/70 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]'
                        }`}
                      >
                        <Avatar name={m.name} avatarUrl={m.avatar_url} size={28} />
                        <span className="flex-1 min-w-0 text-[12.5px] font-semibold truncate text-gray-600 dark:text-white/65">
                          {m.name}
                        </span>
                        <span
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            present
                              ? 'bg-brand text-white'
                              : 'bg-gray-100 dark:bg-white/[0.07] text-gray-300 dark:text-white/25'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    )
                  })}
                </div>
              </details>
            )}
          </section>

          {/* 월간 현황 */}
          <section className="mx-4 mt-4 p-4 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
            <h3 className="text-[14px] font-bold text-ink-strong mb-3">이번 달 현황</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left font-bold text-gray-400 dark:text-white/40 pb-2 pr-2">
                      이름
                    </th>
                    {sundays.map((d) => (
                      <th
                        key={d}
                        className="font-bold text-gray-400 dark:text-white/40 pb-2 px-1 text-center whitespace-nowrap"
                      >
                        {new Date(d).getDate()}일
                      </th>
                    ))}
                    <th className="font-bold text-gray-400 dark:text-white/40 pb-2 pl-1 text-right">
                      합계
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((m) => {
                    const total = sundays.filter((d) =>
                      (att?.records[d] ?? []).includes(m.user_id),
                    ).length
                    return (
                      <tr key={m.user_id} className="border-t border-gray-100 dark:border-white/[0.05]">
                        <td className="py-2 pr-2 font-semibold text-ink-strong whitespace-nowrap">
                          {memberLabel(m.child_name || m.name, null)}
                        </td>
                        {sundays.map((d) => {
                          const present = (att?.records[d] ?? []).includes(m.user_id)
                          return (
                            <td key={d} className="py-2 px-1 text-center">
                              <span
                                className={`inline-block w-4 h-4 rounded-full ${
                                  present
                                    ? 'bg-brand'
                                    : 'bg-gray-100 dark:bg-white/[0.07]'
                                }`}
                                aria-label={present ? '출석' : '미출석'}
                              />
                            </td>
                          )
                        })}
                        <td className="py-2 pl-1 text-right font-bold text-brand tabular-nums">
                          {total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {students.length > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2">
                🔵 출석 · 한 달 개근이면 리포트에서 확인할 수 있어요
              </p>
            )}
          </section>
        </>
      )}
    </Shell>
  )
}

export default ClassAttendance
