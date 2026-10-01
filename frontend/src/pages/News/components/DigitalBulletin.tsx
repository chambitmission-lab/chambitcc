import { lazy, Suspense, useState, type ReactNode } from 'react'
import { showToast } from '../../../utils/toast'
import {
  useDigitalBulletin,
  useReplaceDigitalBulletin,
} from '../../../hooks/useDigitalBulletin'
import { EditableField, AddItemButton, RemoveItemButton } from '../../../components/EditableField'
import type {
  AnnouncementItem,
  BulletinData,
  ExtraBlock,
  ExtraBlockKind,
  GroupItem,
  WeeklyScheduleItem,
  WorshipServiceItem,
} from '../../../types/digitalBulletin'
import {
  ChurchIcon,
  MegaphoneIcon,
  PeopleIcon,
  CalendarIcon,
  ClockIcon,
  PinIcon,
  SparkleIcon,
} from './NewsIcons'
import { extrasOf, newExtraBlock } from './bulletinExtras'
import { can } from '../../../utils/access'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Translation } from '../../../locales'

const BulletinDeskEditor = lazy(() => import('./BulletinDeskEditor'))

type SectionKey = 'worship' | 'announcements' | 'groups' | 'schedule'

const SECTION_META: Record<
  SectionKey,
  {
    Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement
    titleKey: keyof Translation
    bar: string
  }
> = {
  worship: {
    Icon: ChurchIcon,
    titleKey: 'newsDbSectionWorship',
    bar: 'from-blue-500 to-blue-600',
  },
  announcements: {
    Icon: MegaphoneIcon,
    titleKey: 'newsDbSectionAnnouncements',
    bar: 'from-sky-400 to-blue-500',
  },
  groups: {
    Icon: PeopleIcon,
    titleKey: 'newsDbSectionGroups',
    bar: 'from-cyan-400 to-sky-500',
  },
  schedule: {
    Icon: CalendarIcon,
    titleKey: 'newsDbSectionSchedule',
    bar: 'from-indigo-400 to-blue-600',
  },
}

interface DigitalBulletinProps {
  /** PC 편집기 미리보기 — 넘기면 이 초안을 읽기 전용·전 섹션 펼침으로 그린다 */
  previewData?: BulletinData
}

const DigitalBulletin = ({ previewData }: DigitalBulletinProps = {}) => {
  const { t } = useLanguage()
  const isPreview = previewData != null
  const isAdminUser = !isPreview && can('content:manage')
  const { data: fetched } = useDigitalBulletin()
  const data = previewData ?? fetched
  const replaceMutation = useReplaceDigitalBulletin()
  const [expanded, setExpanded] = useState<Set<SectionKey>>(
    () => new Set<SectionKey>(isPreview ? ['worship', 'announcements', 'groups', 'schedule'] : ['worship']),
  )
  const [deskOpen, setDeskOpen] = useState(false)

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
      showToast(t('newsDbSaveFailed'), 'error')
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

  const extras = extrasOf(data)
  const setExtra = (idx: number, next: ExtraBlock) =>
    save({ ...data, extras: extras.map((b, i) => (i === idx ? next : b)) })
  const addExtra = (kind: ExtraBlockKind) =>
    save({
      ...data,
      extras: [
        ...extras,
        newExtraBlock(kind, {
          title: '새 안내',
          items: kind === 'list' ? ['내용을 입력하세요.'] : [],
          content: kind === 'note' ? '내용을 입력하세요.' : '',
          columns: kind === 'table' ? ['항목', '내용'] : [],
          rows: kind === 'table' ? [['-', '-']] : [],
        }),
      ],
    })
  const removeExtra = (idx: number) => save({ ...data, extras: extras.filter((_, i) => i !== idx) })

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
      {/* PC 편집기 진입 — 관리자 · lg+ 전용(모바일은 아래 인라인 편집) */}
      {isAdminUser && (
        <div className="hidden lg:block px-4">
          <button
            type="button"
            onClick={() => setDeskOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] text-left transition-colors hover:border-[var(--brand)]"
          >
            <span className="shrink-0 w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[16px] font-bold text-brand">{t('newsDbDeskOpen')}</span>
              <span className="block text-[13.5px] text-gray-600 dark:text-white/60">{t('newsDbDeskOpenHint')}</span>
            </span>
          </button>
        </div>
      )}
      {deskOpen && (
        <Suspense fallback={null}>
          <BulletinDeskEditor initial={data} onClose={() => setDeskOpen(false)} />
        </Suspense>
      )}

      {/* Hero — 표어 카드 */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-3xl p-5 bg-brand shadow-[0_18px_44px_-18px_var(--brand-glow)]">
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
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[11px] lg:text-[13.5px] font-bold tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <EditableField
                value={data.date}
                isAdmin={isAdminUser}
                label={t('newsDbFieldDate')}
                onSave={setTopField('date')}
              >
                {data.date}
              </EditableField>
            </span>
            <h1 className="text-white text-[22px] lg:text-[28px] font-bold leading-[1.25] tracking-[-0.015em] mb-3 whitespace-pre-line">
              <EditableField
                value={data.title}
                isAdmin={isAdminUser}
                multiline
                label={t('newsDbFieldTitle')}
                onSave={setTopField('title')}
              >
                {data.title}
              </EditableField>
            </h1>
            <p className="text-white/90 text-[13px] lg:text-[16.5px] leading-[1.65] font-medium">
              <EditableField
                value={data.subtitle}
                isAdmin={isAdminUser}
                label={t('newsDbFieldVerse')}
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
        badge={t('newsDbBadgeServices').replace('{n}', String(data.worship.schedule.length))}
      >
        {/* 예배 일정 */}
        <div className="space-y-2">
          {data.worship.schedule.map((service, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeService(idx)} />
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-[13.5px] lg:text-[17px] font-bold text-ink-strong tracking-[-0.01em]">
                  <EditableField
                    value={service.name}
                    isAdmin={isAdminUser}
                    label={t('newsDbFieldServiceName')}
                    onSave={updateServiceField(idx, 'name')}
                  >
                    {service.name}
                  </EditableField>
                </p>
                <span className="text-[11.5px] lg:text-[14.5px] font-semibold text-brand shrink-0">
                  <EditableField
                    value={service.time}
                    isAdmin={isAdminUser}
                    label={t('newsDbFieldServiceTime')}
                    onSave={updateServiceField(idx, 'time')}
                  >
                    {service.time}
                  </EditableField>
                </span>
              </div>
              <p className="text-[12px] lg:text-[15px] text-gray-500 dark:text-white/55">
                {t('newsDbSermonBy')}
                <EditableField
                  value={service.preacher}
                  isAdmin={isAdminUser}
                  label={t('newsDbFieldPreacher')}
                  onSave={updateServiceField(idx, 'preacher')}
                >
                  {service.preacher}
                </EditableField>
              </p>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addService} label={t('newsDbAddService')} />
        </div>

        {/* 찬송/기도/설교 */}
        <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-white/[0.05] space-y-1.5">
          <DetailRow
            label={t('newsDbFieldHymn')}
            value={
              <EditableField
                value={data.worship.offering}
                isAdmin={isAdminUser}
                label={t('newsDbFieldHymn')}
                onSave={setOffering}
              >
                {data.worship.offering}
              </EditableField>
            }
          />
          <DetailRow
            label={t('newsDbFieldPrayer')}
            value={
              <EditableField
                value={data.worship.prayer}
                isAdmin={isAdminUser}
                label={t('newsDbFieldPrayer')}
                onSave={setPrayer}
              >
                {data.worship.prayer}
              </EditableField>
            }
          />

          {/* 설교 카드 */}
          <div className="mt-2 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] p-3">
            <p className="inline-flex items-center gap-1 text-[10.5px] lg:text-[13px] font-bold uppercase tracking-[0.1em] text-brand mb-1.5">
              <SparkleIcon width={13} height={13} className="shrink-0" />
              {t('newsDbSermon')}
            </p>
            <p className="text-[14px] lg:text-[17.5px] font-bold text-ink-strong leading-[1.4] tracking-[-0.01em] mb-0.5 whitespace-pre-line">
              <EditableField
                value={data.worship.sermon.title}
                isAdmin={isAdminUser}
                multiline
                label={t('newsDbFieldSermonTitle')}
                onSave={setSermonField('title')}
              >
                {data.worship.sermon.title}
              </EditableField>
            </p>
            <p className="text-[12px] lg:text-[15px] text-gray-600 dark:text-white/65 leading-[1.5]">
              <EditableField
                value={data.worship.sermon.subtitle}
                isAdmin={isAdminUser}
                label={t('newsDbFieldSermonSubtitle')}
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
        badge={
          t('newsDbBadgeAnnouncements').replace('{n}', String(data.announcements.length)) +
          (extras.length ? t('newsDbBadgeExtras').replace('{n}', String(extras.length)) : '')
        }
      >
        <div className="space-y-2">
          {data.announcements.map((item, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeAnnouncement(idx)} />
              <p className="text-[13.5px] lg:text-[17px] font-bold text-ink-strong tracking-[-0.01em] mb-1.5">
                <EditableField
                  value={item.title}
                  isAdmin={isAdminUser}
                  label={t('newsDbFieldAnnouncementTitle')}
                  onSave={updateAnnouncementField(idx, 'title')}
                >
                  {item.title}
                </EditableField>
              </p>
              <p className="text-[12.5px] lg:text-[16px] text-gray-600 dark:text-white/70 leading-[1.65] whitespace-pre-line">
                <EditableField
                  value={item.content}
                  isAdmin={isAdminUser}
                  multiline
                  label={t('newsDbFieldAnnouncementBody')}
                  onSave={updateAnnouncementField(idx, 'content')}
                >
                  {item.content}
                </EditableField>
              </p>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addAnnouncement} label={t('newsDbAddAnnouncement')} />
        </div>

        {/* 자유 안내 블록 — 당회 결정사항·봉사표·헌금 계좌 같은 종이 주보 하단 요약 */}
        {(extras.length > 0 || isAdminUser) && (
          <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-white/[0.05] space-y-2.5">
            {extras.map((block, idx) => (
              <ExtraBlockView
                key={idx}
                block={block}
                isAdmin={isAdminUser}
                onChange={next => setExtra(idx, next)}
                onRemove={() => removeExtra(idx)}
              />
            ))}
            {isAdminUser && (
              <div className="grid grid-cols-3 gap-2 [&_.ef-add-btn]:my-0">
                <AddItemButton isAdmin onClick={() => addExtra('list')} label={t('newsDbAddExtraList')} />
                <AddItemButton isAdmin onClick={() => addExtra('table')} label={t('newsDbAddExtraTable')} />
                <AddItemButton isAdmin onClick={() => addExtra('note')} label={t('newsDbAddExtraNote')} />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* 구역 보고 */}
      <SectionCard
        sectionKey="groups"
        expanded={expanded.has('groups')}
        onToggle={() => toggle('groups')}
        badge={t('newsDbBadgeGroups').replace('{n}', String(data.groups.length))}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.groups.map((group, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeGroup(idx)} />
              <div className="flex items-center gap-2 mb-2">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white text-[14px] lg:text-[17.5px] font-bold shadow-[0_4px_12px_-4px_var(--brand-glow)]">
                  {(group.name || '?').slice(0, 1)}
                </div>
                <p className="text-[13.5px] lg:text-[17px] font-bold text-ink-strong tracking-[-0.01em] truncate min-w-0">
                  <EditableField
                    value={group.name}
                    isAdmin={isAdminUser}
                    label={t('newsDbFieldGroupName')}
                    onSave={updateGroupField(idx, 'name')}
                  >
                    {group.name}
                  </EditableField>
                </p>
              </div>
              <div className="space-y-1 text-[11.5px] lg:text-[14.5px]">
                <DetailRow
                  size="sm"
                  label={t('newsDbFieldGroupLeader')}
                  value={
                    <EditableField
                      value={group.leader}
                      isAdmin={isAdminUser}
                      label={t('newsDbFieldGroupLeader')}
                      onSave={updateGroupField(idx, 'leader')}
                    >
                      {group.leader}
                    </EditableField>
                  }
                />
                <DetailRow
                  size="sm"
                  label={t('newsDbFieldGroupMembers')}
                  value={
                    <EditableField
                      value={String(group.members)}
                      isAdmin={isAdminUser}
                      type="number"
                      label={t('newsDbFieldGroupMembers')}
                      onSave={updateGroupField(idx, 'members')}
                    >
                      {t('newsDbGroupMemberCount').replace('{n}', String(group.members))}
                    </EditableField>
                  }
                />
                <DetailRow
                  size="sm"
                  label={t('newsDbFieldGroupMeeting')}
                  value={
                    <EditableField
                      value={group.meeting}
                      isAdmin={isAdminUser}
                      label={t('newsDbFieldGroupMeeting')}
                      onSave={updateGroupField(idx, 'meeting')}
                    >
                      {group.meeting}
                    </EditableField>
                  }
                />
              </div>
            </ItemCard>
          ))}
          <AddItemButton isAdmin={isAdminUser} onClick={addGroup} label={t('newsDbAddGroup')} />
        </div>
      </SectionCard>

      {/* 이번 주 일정 */}
      <SectionCard
        sectionKey="schedule"
        expanded={expanded.has('schedule')}
        onToggle={() => toggle('schedule')}
        badge={t('newsDbBadgeSchedules').replace('{n}', String(data.weeklySchedule.length))}
      >
        <div className="space-y-2">
          {data.weeklySchedule.map((item, idx) => (
            <ItemCard key={idx}>
              <RemoveItemButton isAdmin={isAdminUser} onClick={() => removeSchedule(idx)} />
              <div className="flex items-start gap-3">
                {/* 요일 배지 */}
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white text-[14px] lg:text-[17.5px] font-bold shadow-[0_4px_12px_-4px_var(--brand-glow)]">
                  <EditableField
                    value={item.day}
                    isAdmin={isAdminUser}
                    label={t('newsDbFieldScheduleDay')}
                    onSave={updateScheduleField(idx, 'day')}
                  >
                    {item.day}
                  </EditableField>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] lg:text-[17px] font-bold text-ink-strong tracking-[-0.01em] mb-1">
                    <EditableField
                      value={item.event}
                      isAdmin={isAdminUser}
                      label={t('newsDbFieldScheduleName')}
                      onSave={updateScheduleField(idx, 'event')}
                    >
                      {item.event}
                    </EditableField>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] lg:text-[14.5px] text-gray-500 dark:text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon width={12.5} height={12.5} className="shrink-0" />{' '}
                      <EditableField
                        value={item.time}
                        isAdmin={isAdminUser}
                        label={t('newsDbFieldScheduleTime')}
                        onSave={updateScheduleField(idx, 'time')}
                      >
                        {item.time}
                      </EditableField>
                    </span>
                    <span className="text-gray-300 dark:text-white/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      <PinIcon width={12.5} height={12.5} className="shrink-0" />{' '}
                      <EditableField
                        value={item.location}
                        isAdmin={isAdminUser}
                        label={t('newsDbFieldScheduleLocation')}
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
          <AddItemButton isAdmin={isAdminUser} onClick={addSchedule} label={t('newsDbAddSchedule')} />
        </div>
      </SectionCard>

      {isAdminUser && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
          <p className="text-[11.5px] lg:text-[14.5px] text-brand leading-[1.6]">
            {t('newsDbAdminHint')}
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
  const { t } = useLanguage()
  const meta = SECTION_META[sectionKey]
  return (
    <div className="px-4">
      <div
        className={[
          'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
          'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
          expanded
            ? 'border-[var(--brand-soft-strong)]'
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
          <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bar} text-white flex items-center justify-center shadow-[0_4px_12px_-4px_var(--brand-glow)]`}>
            <meta.Icon width={21} height={21} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] lg:text-[18.5px] font-bold text-ink-strong tracking-[-0.01em]">
              {t(meta.titleKey)}
            </p>
            {badge && (
              <p className="text-[11px] lg:text-[13.5px] text-gray-500 dark:text-white/55 mt-0.5">{badge}</p>
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

// ── Extra Block ──────────────────────────────────
// 모바일 관리자도 고칠 수 있게 칸마다 EditableField. 열 추가·표 붙여넣기 같은 큰 손질은 PC 편집기에서.
const ExtraBlockView = ({
  block,
  isAdmin,
  onChange,
  onRemove,
}: {
  block: ExtraBlock
  isAdmin: boolean
  onChange: (next: ExtraBlock) => void
  onRemove: () => void
}) => {
  const { t } = useLanguage()
  const setItem = (i: number) => (v: string) =>
    onChange({ ...block, items: block.items.map((x, j) => (j === i ? v : x)) })
  const setColumn = (c: number) => (v: string) =>
    onChange({ ...block, columns: block.columns.map((x, j) => (j === c ? v : x)) })
  const setCell = (r: number, c: number) => (v: string) =>
    onChange({
      ...block,
      rows: block.rows.map((row, i) => (i === r ? block.columns.map((_, j) => (j === c ? v : row[j] ?? '')) : row)),
    })
  const cell = (r: number, c: number) => (
    <EditableField
      value={block.rows[r][c] ?? ''}
      isAdmin={isAdmin}
      label={block.columns[c] || t('newsDbFieldExtraCell')}
      onSave={setCell(r, c)}
    >
      {block.rows[r][c] || (isAdmin ? '—' : '')}
    </EditableField>
  )

  return (
    <div className="relative rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] px-3 py-3">
      <RemoveItemButton isAdmin={isAdmin} onClick={onRemove} />
      {(block.title || isAdmin) && (
        <p className="flex items-center gap-1.5 text-[13.5px] lg:text-[17px] font-bold text-ink-strong tracking-[-0.01em] mb-2 pr-7">
          <span className="w-1 h-3.5 lg:h-4 rounded-full bg-[var(--brand)] shrink-0" />
          <EditableField
            value={block.title}
            isAdmin={isAdmin}
            label={t('newsDbFieldExtraTitle')}
            onSave={v => onChange({ ...block, title: v })}
          >
            {block.title}
          </EditableField>
        </p>
      )}

      {block.kind === 'list' && (
        <>
          <ol className="space-y-1.5">
            {block.items.map((item, i) =>
              !isAdmin && !item.trim() ? null : (
                <li key={i} className="flex gap-2 text-[12.5px] lg:text-[16px] text-gray-700 dark:text-white/75 leading-[1.6]">
                  <span className="shrink-0 mt-[0.2em] w-[1.35em] h-[1.35em] rounded-full bg-[var(--brand-soft)] text-brand text-[0.78em] font-bold flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 whitespace-pre-line">
                    <EditableField
                      value={item}
                      isAdmin={isAdmin}
                      multiline
                      label={t('newsDbFieldExtraItem')}
                      onSave={setItem(i)}
                    >
                      {item}
                    </EditableField>
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      className="shrink-0 self-start px-1 text-[12px] text-gray-400 hover:text-red-500"
                      onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                      aria-label="remove"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ),
            )}
          </ol>
          {isAdmin && (
            <AddItemButton
              isAdmin
              onClick={() => onChange({ ...block, items: [...block.items, '내용을 입력하세요.'] })}
              label={t('newsDbAddExtraItem')}
            />
          )}
        </>
      )}

      {block.kind === 'table' && block.columns.length > 0 && (
        <>
          {/* 좁은 화면: 행마다 '열 이름 — 값' 카드. 다섯 칸짜리 봉사표도 가로 스크롤 없이 읽힌다 */}
          <div className="sm:hidden space-y-2">
            {block.rows.map((_, r) => (
              <div
                key={r}
                className="rounded-lg bg-white dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.05] px-2.5 py-2 space-y-1"
              >
                {block.columns.map((col, c) => (
                  <DetailRow key={c} size="sm" label={col} value={cell(r, c)} />
                ))}
              </div>
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200/70 dark:border-white/[0.07]">
            <table className="w-full text-center text-[12.5px] lg:text-[15px] break-keep">
              <thead>
                <tr className="bg-[var(--brand-soft)]">
                  {block.columns.map((col, c) => (
                    <th key={c} className="px-2 py-1.5 font-bold text-brand">
                      <EditableField value={col} isAdmin={isAdmin} label={t('newsDbFieldExtraColumn')} onSave={setColumn(c)}>
                        {col}
                      </EditableField>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((_, r) => (
                  <tr key={r} className="border-t border-gray-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-transparent">
                    {block.columns.map((_, c) => (
                      <td key={c} className="px-2 py-1.5 font-medium text-gray-800 dark:text-white/85">
                        {cell(r, c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isAdmin && (
            <AddItemButton
              isAdmin
              onClick={() => onChange({ ...block, rows: [...block.rows, block.columns.map(() => '')] })}
              label={t('newsDbAddExtraRow')}
            />
          )}
        </>
      )}

      {block.kind === 'note' && (
        <p className="text-[12.5px] lg:text-[16px] text-gray-700 dark:text-white/75 leading-[1.65] whitespace-pre-line">
          <EditableField
            value={block.content}
            isAdmin={isAdmin}
            multiline
            label={t('newsDbFieldExtraContent')}
            onSave={v => onChange({ ...block, content: v })}
          >
            {block.content}
          </EditableField>
        </p>
      )}
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
        size === 'sm' ? 'text-[11.5px] lg:text-[14.5px]' : 'text-[12.5px] lg:text-[16px]',
      ].join(' ')}
    >
      {label}
    </span>
    <span
      className={[
        'text-gray-800 dark:text-white/85 font-medium text-right min-w-0',
        size === 'sm' ? 'text-[11.5px] lg:text-[14.5px]' : 'text-[12.5px] lg:text-[16px]',
      ].join(' ')}
    >
      {value}
    </span>
  </div>
)

export default DigitalBulletin
