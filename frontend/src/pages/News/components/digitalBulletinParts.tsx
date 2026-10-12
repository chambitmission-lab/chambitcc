// 디지털 주보(DigitalBulletin)의 부분 컴포넌트 — 섹션 카드·추가 안내 블록·상세 행·항목 카드.
// 페이지 파일이 길어 자리만 옮겼다(동작 변경 없음).
import type { ReactNode } from 'react'
import { EditableField, AddItemButton, RemoveItemButton } from '../../../components/EditableField'
import type { ExtraBlock } from '../../../types/digitalBulletin'
import { ChurchIcon, MegaphoneIcon, PeopleIcon, CalendarIcon } from './NewsIcons'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Translation } from '../../../locales'

export type SectionKey = 'worship' | 'announcements' | 'groups' | 'schedule'

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

// ── Section Card ─────────────────────────────────
interface SectionCardProps {
  sectionKey: SectionKey
  expanded: boolean
  onToggle: () => void
  badge?: string
  children: ReactNode
}

export const SectionCard = ({ sectionKey, expanded, onToggle, badge, children }: SectionCardProps) => {
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
export const ExtraBlockView = ({
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
export const ItemCard = ({ children }: { children: ReactNode }) => (
  <div className="relative rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] px-3 py-2.5">
    {children}
  </div>
)

// ── Detail Row ───────────────────────────────────
export const DetailRow = ({
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
