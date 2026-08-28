// 나만의 플랜 — "함께 읽는 사람들" 섹션
// 개인 플랜의 핵심 가치: 혼자 결심한 플랜을 소그룹과 같이 읽는다.
// 각자 자기 속도(진행률·스트릭)를 보여주고, 소유자/참여자 모두 초대 링크를 뿌릴 수 있다.
import type { CSSProperties } from 'react'
import type { PlanParticipant } from '../../../../types/biblePlan'
import { UsersIcon } from '../../../../components/icons/ActionIcons'

const numStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

const PlanParticipants = ({
  participants,
  grad,
  inviteCode,
  onInvite,
}: {
  participants: PlanParticipant[]
  grad: string
  inviteCode?: string | null
  onInvite: () => void
}) => {
  const count = participants.length
  return (
    <section className="mx-4 mt-3 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-brand flex items-center justify-center">
          <UsersIcon size={15} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-ink-strong tracking-[-0.01em]">
            함께 읽는 사람들
            <span className="ml-1.5 text-[12px] font-semibold text-gray-400 dark:text-white/40" style={numStyle}>
              {count}명
            </span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-white/45 mt-0.5">
            각자 자기 속도로 읽어요 · 진행률 순
          </p>
        </div>
        {inviteCode && (
          <button
            type="button"
            onClick={onInvite}
            className="shrink-0 inline-flex items-center gap-1 px-3 h-8 rounded-full bg-brand text-white text-[12px] font-bold shadow-[0_4px_14px_-4px_var(--brand-glow)] active:scale-95 transition-transform"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13" />
              <polyline points="8 7 12 3 16 7" />
              <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            초대하기
          </button>
        )}
      </div>

      {count <= 1 ? (
        <div className="mt-3.5 rounded-xl bg-[var(--brand-soft)] px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-ink-strong">아직 혼자 읽고 있어요</p>
          <p className="text-[11.5px] leading-[1.6] text-gray-500 dark:text-white/55 mt-0.5">
            초대 링크를 소그룹 단톡방에 올리면 같은 플랜을 함께 읽을 수 있어요.
          </p>
        </div>
      ) : (
        <ul className="mt-3.5 space-y-2.5">
          {participants.map((p) => (
            <li key={p.user_id} className="flex items-center gap-2.5">
              <Avatar name={p.name} url={p.avatar_url} grad={grad} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[13px] font-bold truncate ${p.is_me ? 'text-brand' : 'text-ink-strong'}`}>
                    {p.name}
                  </span>
                  {p.is_me && <Tag>나</Tag>}
                  {p.is_owner && <Tag>만든 이</Tag>}
                  {p.status === 'completed' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">완주 🎉</span>
                  )}
                  <span className="ml-auto shrink-0 text-[12px] font-extrabold text-ink-strong" style={numStyle}>
                    {p.percent}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${grad} transition-[width] duration-500`}
                      style={{ width: `${Math.min(100, p.percent)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10.5px] font-semibold text-gray-400 dark:text-white/40" style={numStyle}>
                    {p.completed_days}일{p.streak_count > 0 ? ` · 🔥${p.streak_count}` : ''}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 px-1.5 py-[2px] rounded-full bg-[var(--brand-soft-strong)] text-brand text-[9.5px] font-bold leading-none">
    {children}
  </span>
)

const Avatar = ({ name, url, grad }: { name: string; url?: string | null; grad: string }) =>
  url ? (
    <img src={url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-black/[0.05] dark:ring-white/[0.1]" />
  ) : (
    <span className={`w-9 h-9 rounded-full shrink-0 bg-gradient-to-br ${grad} text-white text-[13px] font-bold flex items-center justify-center`}>
      {name.slice(0, 1)}
    </span>
  )

export default PlanParticipants
