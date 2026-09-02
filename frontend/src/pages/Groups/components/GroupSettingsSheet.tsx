// 기도방 설정 시트 — 모든 멤버가 연다 (토스식 섹션 구조)
// 관리자: 방 정보 / 공개 설정 / 함께 기도 시간 / 위험 구역(삭제)
// 일반 멤버: 방 정보 읽기 + 기도방 나가기 (예전엔 멤버 탭 맨 아래에 숨어 있었다)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateGroup, useDeleteGroup, useLeaveGroup } from '../../../hooks/useGroups'
import { useSituationCategories } from '../../../hooks/useSituation'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { confirmDialog } from '../../../utils/confirmDialog'
import type { PrayerGroup, GroupVisibility } from '../../../types/prayer'
import { GroupGlyph, PersonIcon, PrayIcon } from '../GroupIcons'

const ICON_OPTIONS = ['🙏', '⛪', '✝️', '🎵', '📖', '💒', '👥', '🕊️', '🌟', '❤️']

const VISIBILITY_OPTIONS: { value: GroupVisibility; label: string; desc: string }[] = [
  { value: 'private', label: '비공개', desc: '초대 코드·링크로만 들어올 수 있어요' },
  { value: 'approval', label: '승인제', desc: '둘러보기에 보이고, 신청을 승인하면 가입돼요' },
  { value: 'public', label: '공개', desc: '둘러보기에 보이고, 누구나 바로 가입할 수 있어요' },
]

const VISIBILITY_LABELS: Record<GroupVisibility, string> = {
  private: '비공개 · 초대로만',
  approval: '승인제 · 신청 후 승인',
  public: '공개 · 누구나 가입',
}

interface GroupSettingsSheetProps {
  group: PrayerGroup
  onClose: () => void
}

// 섹션 헤더 — 긴 단일 폼을 의미 단위로 끊어 읽게 한다
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11.5px] font-bold tracking-[0.06em] text-gray-400 dark:text-white/40 uppercase">
    {children}
  </p>
)

const GroupSettingsSheet = ({ group, onClose }: GroupSettingsSheetProps) => {
  const navigate = useNavigate()
  const update = useUpdateGroup()
  const remove = useDeleteGroup()
  const leave = useLeaveGroup()
  const { data: themeCategories } = useSituationCategories()

  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  const [icon, setIcon] = useState(group.icon || '🙏')
  const [themeCategoryId, setThemeCategoryId] = useState<number | null>(group.theme?.id ?? null)
  const [visibility, setVisibility] = useState<GroupVisibility>(group.visibility ?? 'private')
  const [prayerTimeOn, setPrayerTimeOn] = useState(!!group.prayer_time)
  const [prayerTime, setPrayerTime] = useState(group.prayer_time || '21:00')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useModalBackButton(onClose)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await update.mutateAsync({
        groupId: group.id,
        data: {
          name: name.trim(),
          description,
          icon,
          // 0 = 테마 해제
          theme_category_id: themeCategoryId ?? 0,
          visibility,
          prayer_time: prayerTimeOn ? prayerTime : '',
        },
      })
      onClose()
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(group.id)
      navigate('/groups')
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  const handleLeave = async () => {
    if (
      !(await confirmDialog({
        title: '기도방 나가기',
        message: '이 기도방에서 나가시겠어요?',
        description: '다시 들어오려면 초대 코드가 필요해요.',
        confirmText: '나가기',
        icon: 'logout',
      }))
    )
      return
    try {
      await leave.mutateAsync(group.id)
      navigate('/groups')
    } catch {
      /* 토스트는 훅에서 처리 */
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">기도방 설정</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!group.is_admin ? (
          /* ── 일반 멤버 — 방 정보 읽기 + 나가기 ── */
          <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-white">
                  <GroupGlyph emoji={group.icon || '🙏'} size={26} />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink-strong truncate">{group.name}</p>
                  <p className="text-[11.5px] text-gray-500 dark:text-white/50 inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><PersonIcon size={11} /> {group.member_count}명</span>
                    {group.prayer_count > 0 && (
                      <span className="inline-flex items-center gap-1"><PrayIcon size={11} /> {group.prayer_count}개</span>
                    )}
                  </p>
                </div>
              </div>
              {group.description && (
                <p className="text-[12.5px] text-gray-600 dark:text-white/60 leading-[1.6] whitespace-pre-wrap mb-3">
                  {group.description}
                </p>
              )}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <InfoRow label="공개 설정" value={VISIBILITY_LABELS[group.visibility ?? 'private']} />
                {group.theme && <InfoRow label="기도방 테마" value={group.theme.name} />}
                <InfoRow
                  label="함께 기도 시간"
                  value={group.prayer_time ? `매일 ${group.prayer_time}` : '설정 안 함'}
                />
              </div>
              <p className="mt-3 text-[11px] text-gray-400 dark:text-white/35 leading-[1.5]">
                방 정보는 관리자만 수정할 수 있어요
              </p>
            </div>

            <div className="pt-1">
              <SectionTitle>나의 참여</SectionTitle>
              <button
                type="button"
                onClick={handleLeave}
                disabled={leave.isPending}
                className="mt-2 w-full h-11 rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50/60 dark:bg-red-500/[0.08] text-red-500 dark:text-red-300 text-[13px] font-bold transition-colors hover:bg-red-50 dark:hover:bg-red-500/[0.12] disabled:opacity-50"
              >
                {leave.isPending ? '나가는 중…' : '기도방 나가기'}
              </button>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-white/35 leading-[1.5] text-center">
                나가면 다시 들어올 때 초대 코드가 필요해요
              </p>
            </div>
          </div>
        ) : (
          /* ── 관리자 — 섹션으로 끊은 편집 폼 ── */
          <form onSubmit={handleSave} className="relative z-10 flex-1 overflow-y-auto">
            <div className="px-5 py-5 space-y-6">
              {/* ── 방 정보 ── */}
              <section className="space-y-4">
                <SectionTitle>방 정보</SectionTitle>
                <Field label="그룹 이름" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] font-semibold text-ink-strong focus:outline-none focus:border-brand transition-colors"
                  />
                </Field>

                <Field label="설명">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong focus:outline-none focus:border-brand transition-colors resize-none leading-[1.6]"
                  />
                </Field>

                <Field label="아이콘">
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIcon(opt)}
                        className={[
                          'aspect-square flex items-center justify-center text-[22px] rounded-xl transition-all',
                          icon === opt
                            ? 'bg-brand shadow-[0_4px_14px_-4px_var(--brand-glow)] ring-2 ring-[var(--brand-soft-strong)]'
                            : 'bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]',
                        ].join(' ')}
                      >
                        <GroupGlyph emoji={opt} size={24} className={icon === opt ? 'text-white' : 'text-ink-strong/70'} />
                      </button>
                    ))}
                  </div>
                </Field>

                {themeCategories && themeCategories.length > 0 && (
                  <Field label="기도방 테마">
                    <div className="flex flex-wrap gap-1.5">
                      {themeCategories.map((cat) => {
                        const active = themeCategoryId === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setThemeCategoryId(active ? null : cat.id)}
                            className={[
                              'inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[12px] font-semibold transition-all border',
                              active
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/65',
                            ].join(' ')}
                            style={active ? { backgroundColor: cat.color } : undefined}
                          >
                            <span className="material-icons-round text-[14px]">{cat.icon}</span>
                            {cat.name}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}
              </section>

              {/* ── 공개 설정 ── */}
              <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                <SectionTitle>공개 설정</SectionTitle>
                <div className="space-y-1.5">
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const active = visibility === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setVisibility(opt.value)}
                        className={[
                          'w-full flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all',
                          active
                            ? 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)]'
                            : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08]',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            active ? 'border-brand' : 'border-gray-300 dark:border-white/[0.2]',
                          ].join(' ')}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-[13px] font-bold ${active ? 'text-brand' : 'text-ink-strong'}`}>
                            {opt.label}
                          </span>
                          <span className="block text-[11.5px] text-gray-500 dark:text-white/50 leading-[1.5]">
                            {opt.desc}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* ── 함께 기도 시간 ── */}
              <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                <SectionTitle>함께 기도 시간</SectionTitle>
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] p-3.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[13px] font-semibold text-ink-strong">
                      🕯️ 매일 같은 시간에 함께 기도해요
                    </span>
                    <input
                      type="checkbox"
                      checked={prayerTimeOn}
                      onChange={(e) => setPrayerTimeOn(e.target.checked)}
                      className="w-5 h-5 accent-[var(--brand)]"
                    />
                  </label>
                  <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-1 leading-[1.5]">
                    정한 시각에 멤버 모두에게 알림이 가요. 흩어져 있어도 같은 시간에 마음을 모을 수 있어요.
                  </p>
                  {prayerTimeOn && (
                    <input
                      type="time"
                      value={prayerTime}
                      onChange={(e) => setPrayerTime(e.target.value)}
                      className="mt-2.5 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.06] text-[15px] font-bold text-ink-strong focus:outline-none focus:border-brand transition-colors"
                    />
                  )}
                </div>
              </section>

              {/* ── 위험 구역 ── */}
              <section className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                <SectionTitle>위험 구역</SectionTitle>
                <p className="text-[11.5px] text-gray-400 dark:text-white/35 leading-[1.6]">
                  방을 나가려면 먼저 <b>우리 탭</b>에서 다른 멤버에게 관리자 권한을 이양해주세요.
                </p>
                {confirmDelete ? (
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 p-3.5">
                    <p className="text-[12.5px] text-red-700 dark:text-red-300 font-semibold leading-[1.5] mb-2.5">
                      정말 삭제할까요? 그룹의 멤버십과 기록이 사라지고 되돌릴 수 없어요.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 h-10 rounded-full bg-white dark:bg-white/[0.08] border border-gray-200 dark:border-white/[0.1] text-[12.5px] font-bold text-gray-600 dark:text-white/70"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={remove.isPending}
                        className="flex-1 h-10 rounded-full bg-red-500 text-white text-[12.5px] font-bold disabled:opacity-60"
                      >
                        {remove.isPending ? '삭제 중…' : '삭제하기'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-[12px] text-red-400 underline underline-offset-2 hover:text-red-500 transition-colors"
                  >
                    그룹 삭제하기
                  </button>
                )}
              </section>
            </div>

            {/* 푸터 */}
            <div className="sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!name.trim() || update.isPending}
                className="ml-auto px-5 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40"
              >
                {update.isPending ? '저장 중…' : '저장하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-[12px] font-semibold text-gray-500 dark:text-white/50">{label}</span>
    <span className="text-[12.5px] font-bold text-ink-strong text-right">{value}</span>
  </div>
)

const Field = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
      {required && <span className="text-rose-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

export default GroupSettingsSheet
