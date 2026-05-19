import { useState, type ReactNode } from 'react'
import { isAdmin } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import {
  useDigitalBulletin,
  useReplaceDigitalBulletin,
} from '../../../hooks/useDigitalBulletin'
import { EditableField, AddItemButton, RemoveItemButton } from '../../../components/EditableField'
import type {
  AnnouncementItem,
  BulletinData,
  GroupItem,
  WeeklyScheduleItem,
  WorshipServiceItem,
} from '../../../types/digitalBulletin'

type SectionKey = 'worship' | 'announcements' | 'groups' | 'schedule'

const SECTION_META: Record<SectionKey, { emoji: string; title: string; bar: string }> = {
  worship: {
    emoji: '🙏',
    title: '주일오전예배',
    bar: 'from-purple-500 to-pink-500',
  },
  announcements: {
    emoji: '📢',
    title: '교회 소식',
    bar: 'from-fuchsia-500 to-pink-500',
  },
  groups: {
    emoji: '👥',
    title: '구역 보고',
    bar: 'from-purple-400 to-fuchsia-500',
  },
  schedule: {
    emoji: '📅',
    title: '이번 주 일정',
    bar: 'from-pink-500 to-rose-500',
  },
}

const DigitalBulletin = () => {
  const isAdminUser = isAdmin()
  const { data } = useDigitalBulletin()
  const replaceMutation = useReplaceDigitalBulletin()
  const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set(['worship']))

  const toggle = (key: SectionKey) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const save = async (next: BulletinData) => {
    try {
      await replaceMutation.mutateAsync(next)
    } catch (e) {
      console.error(e)
      showToast('저장에 실패했습니다', 'error')
    }
  }

  const setTopField = (key: 'date' | 'title' | 'subtitle') => (value: string) =>
    save({ ...data, [key]: value })

  const setOffering = (value: string) =>
    save({ ...data, worship: { ...data.worship, offering: value } })
  const setPrayer = (value: string) =>
    save({ ...data, worship: { ...data.worship, prayer: value } })
  const setSermonField = (key: 'title' | 'subtitle') => (value: string) =>
    save({
      ...data,
      worship: { ...data.worship, sermon: { ...data.worship.sermon, [key]: value } },
    })

  const updateServiceField = (idx: number, key: keyof WorshipServiceItem) => (value: string) => {
    const next = [...data.worship.schedule]
    next[idx] = { ...next[idx], [key]: value }
    save({ ...data, worship: { ...data.worship, schedule: next } })
  }
  const addService = () =>
    save({
      ...data,
      worship: {
        ...data.worship,
        schedule: [
          ...data.worship.schedule,
          { name: '새 예배', time: '오전 0:00', preacher: '담당자' },
        ],
      },
    })
  const removeService = (idx: number) => {
    const next = data.worship.schedule.filter((_, i) => i !== idx)
    save({ ...data, worship: { ...data.worship, schedule: next } })
  }

  const updateAnnouncementField =
    (idx: number, key: keyof AnnouncementItem) => (value: string) => {
      const next = [...data.announcements]
      next[idx] = { ...next[idx], [key]: value }
      save({ ...data, announcements: next })
    }
  const addAnnouncement = () =>
    save({
      ...data,
      announcements: [
        ...data.announcements,
        { title: '새 소식 제목', content: '내용을 입력하세요.' },
      ],
    })
  const removeAnnouncement = (idx: number) =>
    save({ ...data, announcements: data.announcements.filter((_, i) => i !== idx) })

  const updateGroupField = (idx: number, key: keyof GroupItem) => (value: string) => {
    const next = [...data.groups]
    const parsed = key === 'members' ? Number(value) || 0 : value
    next[idx] = { ...next[idx], [key]: parsed } as GroupItem
    save({ ...data, groups: next })
  }
  const addGroup = () =>
    save({
      ...data,
      groups: [
        ...data.groups,
        { name: '새 구역', leader: '담당자', members: 0, meeting: '매주 ○요일' },
      ],
    })
  const removeGroup = (idx: number) =>
    save({ ...data, groups: data.groups.filter((_, i) => i !== idx) })

  const updateScheduleField =
    (idx: number, key: keyof WeeklyScheduleItem) => (value: string) => {
      const next = [...data.weeklySchedule]
      next[idx] = { ...next[idx], [key]: value }
      save({ ...data, weeklySchedule: next })
    }
  const addSchedule = () =>
    save({
      ...data,
      weeklySchedule: [
        ...data.weeklySchedule,
        { day: '월', event: '새 일정', time: '오전 0:00', location: '본당' },
      ],
    })
  const removeSchedule = (idx: number) =>
    save({ ...data, weeklySchedule: data.weeklySchedule.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {/* Hero — 표어 카드 */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_18px_44px_-18px_rgba(168,85,247,0.6)]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.18) 100%)',
            }}
          />
          <div
            className="absolute -top-8 -right-8 w-40 h-40 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <EditableField
                value={data.date}
                isAdmin={isAdminUser}
                label="날짜"
                onSave={setTopField('date')}
              >
                {data.date}
              </EditableField>
            </span>
            <h1 className="text-white text-[22px] font-bold leading-[1.25] tracking-[-0.015em] mb-3 whitespace-pre-line">
              <EditableField
                value={data.title}
                isAdmin={isAdminUser}
                multiline
                label="대표 제목"
                onSave={setTopField('title')}
              >
                {data.title}
              </EditableField>
            </h1>
            <p className="text-white/90 text-[13px] leading-[1.65] font-medium">
              <EditableField
                value={data.subtitle}
                isAdmin={isAdminUser}
                label="성경 구절"
                onSave={setTopField('subtitle')}
              >
                {data.subtitle}
              </EditableField>
            </p>
          </div>
        </div>
      </div>

      {/* 주일오전예배 */}
      <SectionCard
        sectionKey="worship"
        expanded={expanded.has('worship')}
        onToggle={() => toggle('worship')}
        badge={`${data.worship.schedule.length}개 예배`}
      >
        {/* 예배 일정 */}
        <div className="space-y-2">
          {data.worship.schedule.map((service, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeService(idx)} />
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
                  <EditableField
                    value={service.name}
                    isAdmin={isAdminUser}
                    label="예배 이름"
                    onSave={updateServiceField(idx, 'name')}
                  >
                    {service.name}
                  </EditableField>
                </p>
                <span className="text-[11.5px] font-semibold text-purple-600 dark:text-purple-300 shrink-0">
                  <EditableField
                    value={service.time}
                    isAdmin={isAdminUser}
                    label="예배 시간"
                    onSave={updateServiceField(idx, 'time')}
                  >
                    {service.time}
                  </EditableField>
                </span>
              </div>
              <p className="text-[12px] text-gray-500 dark:text-white/55">
                설교 ·{' '}
                <EditableField
                  value={service.preacher}
                  isAdmin={isAdminUser}
                  label="설교자"
                  onSave={updateServiceField(idx, 'preacher')}
                >
                  {service.preacher}
                </EditableField>
              </p>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addService} label="예배 추가" />
        </div>

        {/* 찬송/기도/설교 */}
        <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-white/[0.05] space-y-1.5">
          <DetailRow
            label="찬송"
            value={
              <EditableField
                value={data.worship.offering}
                isAdmin={isAdminUser}
                label="찬송"
                onSave={setOffering}
              >
                {data.worship.offering}
              </EditableField>
            }
          />
          <DetailRow
            label="기도"
            value={
              <EditableField
                value={data.worship.prayer}
                isAdmin={isAdminUser}
                label="기도"
                onSave={setPrayer}
              >
                {data.worship.prayer}
              </EditableField>
            }
          />

          {/* 설교 카드 */}
          <div className="mt-2 rounded-xl bg-purple-500/8 dark:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/25 p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-purple-600 dark:text-purple-300 mb-1.5">
              ✨ 설교
            </p>
            <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-[1.4] tracking-[-0.01em] mb-0.5 whitespace-pre-line">
              <EditableField
                value={data.worship.sermon.title}
                isAdmin={isAdminUser}
                multiline
                label="설교 제목"
                onSave={setSermonField('title')}
              >
                {data.worship.sermon.title}
              </EditableField>
            </p>
            <p className="text-[12px] text-gray-600 dark:text-white/65 leading-[1.5]">
              <EditableField
                value={data.worship.sermon.subtitle}
                isAdmin={isAdminUser}
                label="설교 부제"
                onSave={setSermonField('subtitle')}
              >
                {data.worship.sermon.subtitle}
              </EditableField>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 교회 소식 */}
      <SectionCard
        sectionKey="announcements"
        expanded={expanded.has('announcements')}
        onToggle={() => toggle('announcements')}
        badge={`${data.announcements.length}건`}
      >
        <div className="space-y-2">
          {data.announcements.map((item, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeAnnouncement(idx)} />
              <p className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] mb-1.5">
                <EditableField
                  value={item.title}
                  isAdmin={isAdminUser}
                  label="소식 제목"
                  onSave={updateAnnouncementField(idx, 'title')}
                >
                  {item.title}
                </EditableField>
              </p>
              <p className="text-[12.5px] text-gray-600 dark:text-white/70 leading-[1.65] whitespace-pre-line">
                <EditableField
                  value={item.content}
                  isAdmin={isAdminUser}
                  multiline
                  label="소식 내용"
                  onSave={updateAnnouncementField(idx, 'content')}
                >
                  {item.content}
                </EditableField>
              </p>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addAnnouncement} label="소식 추가" />
        </div>
      </SectionCard>

      {/* 구역 보고 */}
      <SectionCard
        sectionKey="groups"
        expanded={expanded.has('groups')}
        onToggle={() => toggle('groups')}
        badge={`${data.groups.length}구역`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.groups.map((group, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeGroup(idx)} />
              <div className="flex items-center gap-2 mb-2">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[14px] font-bold shadow-[0_4px_12px_-4px_rgba(168,85,247,0.5)]">
                  {(group.name || '?').slice(0, 1)}
                </div>
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate min-w-0">
                  <EditableField
                    value={group.name}
                    isAdmin={isAdminUser}
                    label="구역 이름"
                    onSave={updateGroupField(idx, 'name')}
                  >
                    {group.name}
                  </EditableField>
                </p>
              </div>
              <div className="space-y-1 text-[11.5px]">
                <DetailRow
                  size="sm"
                  label="구역장"
                  value={
                    <EditableField
                      value={group.leader}
                      isAdmin={isAdminUser}
                      label="구역장"
                      onSave={updateGroupField(idx, 'leader')}
                    >
                      {group.leader}
                    </EditableField>
                  }
                />
                <DetailRow
                  size="sm"
                  label="인원"
                  value={
                    <EditableField
                      value={String(group.members)}
                      isAdmin={isAdminUser}
                      type="number"
                      label="인원"
                      onSave={updateGroupField(idx, 'members')}
                    >
                      {group.members}명
                    </EditableField>
                  }
                />
                <DetailRow
                  size="sm"
                  label="모임"
                  value={
                    <EditableField
                      value={group.meeting}
                      isAdmin={isAdminUser}
                      label="모임"
                      onSave={updateGroupField(idx, 'meeting')}
                    >
                      {group.meeting}
                    </EditableField>
                  }
                />
              </div>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addGroup} label="구역 추가" />
        </div>
      </SectionCard>

      {/* 이번 주 일정 */}
      <SectionCard
        sectionKey="schedule"
        expanded={expanded.has('schedule')}
        onToggle={() => toggle('schedule')}
        badge={`${data.weeklySchedule.length}개 일정`}
      >
        <div className="space-y-2">
          {data.weeklySchedule.map((item, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeSchedule(idx)} />
              <div className="flex items-start gap-3">
                {/* 요일 배지 */}
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-[14px] font-bold shadow-[0_4px_12px_-4px_rgba(236,72,153,0.5)]">
                  <EditableField
                    value={item.day}
                    isAdmin={isAdminUser}
                    label="요일"
                    onSave={updateScheduleField(idx, 'day')}
                  >
                    {item.day}
                  </EditableField>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] mb-1">
                    <EditableField
                      value={item.event}
                      isAdmin={isAdminUser}
                      label="일정명"
                      onSave={updateScheduleField(idx, 'event')}
                    >
                      {item.event}
                    </EditableField>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-gray-500 dark:text-white/55">
                    <span className="inline-flex items-center gap-1">
                      🕘{' '}
                      <EditableField
                        value={item.time}
                        isAdmin={isAdminUser}
                        label="시간"
                        onSave={updateScheduleField(idx, 'time')}
                      >
                        {item.time}
                      </EditableField>
                    </span>
                    <span className="text-gray-300 dark:text-white/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      📍{' '}
                      <EditableField
                        value={item.location}
                        isAdmin={isAdminUser}
                        label="장소"
                        onSave={updateScheduleField(idx, 'location')}
                      >
                        {item.location}
                      </EditableField>
                    </span>
                  </div>
                </div>
              </div>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addSchedule} label="일정 추가" />
        </div>
      </SectionCard>

      {isAdminUser && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-xl bg-purple-500/8 dark:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/25">
          <p className="text-[11.5px] text-purple-700 dark:text-purple-200 leading-[1.6]">
            ✏️ 텍스트 옆 연필로 수정 · ➕ 항목 추가 · 🗑️ 항목 삭제 · 변경은 즉시 저장됩니다.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Section Card ─────────────────────────────────
interface SectionCardProps {
  sectionKey: SectionKey
  expanded: boolean
  onToggle: () => void
  badge?: string
  children: ReactNode
}

const SectionCard = ({ sectionKey, expanded, onToggle, badge, children }: SectionCardProps) => {
  const meta = SECTION_META[sectionKey]
  return (
    <div className="px-4">
      <div
        className={[
          'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
          'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
          expanded
            ? 'border-purple-300/50 dark:border-purple-400/30'
            : 'border-gray-200/70 dark:border-white/[0.08]',
        ].join(' ')}
      >
        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.bar}`} />

        {/* 헤더 */}
        <button
          type="button"
          onClick={onToggle}
          className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
          aria-expanded={expanded}
        >
          <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bar} flex items-center justify-center text-[19px] shadow-[0_4px_12px_-4px_rgba(168,85,247,0.45)]`}>
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 dark:text-white tracking-[-0.01em]">
              {meta.title}
            </p>
            {badge && (
              <p className="text-[11px] text-gray-500 dark:text-white/55 mt-0.5">{badge}</p>
            )}
          </div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* 펼침 */}
        {expanded && (
          <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Item Card ────────────────────────────────────
const ItemCard = ({ children }: { children: ReactNode }) => (
  <div className="relative rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] px-3 py-2.5">
    {children}
  </div>
)

// ── Detail Row ───────────────────────────────────
const DetailRow = ({
  label,
  value,
  size = 'md',
}: {
  label: string
  value: ReactNode
  size?: 'sm' | 'md'
}) => (
  <div className="flex items-center justify-between gap-2">
    <span
      className={[
        'text-gray-500 dark:text-white/50 shrink-0',
        size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]',
      ].join(' ')}
    >
      {label}
    </span>
    <span
      className={[
        'text-gray-800 dark:text-white/85 font-medium text-right min-w-0',
        size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]',
      ].join(' ')}
    >
      {value}
    </span>
  </div>
)

export default DigitalBulletin
