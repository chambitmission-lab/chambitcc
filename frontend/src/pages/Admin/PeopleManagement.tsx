// 섬기는 사람들 관리 (admin, /admin/people)
//
// 교역자·파송선교사·장로·교회직원이 한 목록에 모인다. 분류 필터로 탭을 좁히고,
// 같은 분류 안에서 ↑↓ 로 순서를 잡는다(공개 화면의 표시 순서가 그대로 이 순서다).
// 담임·원로목사는 여기 없다 — /admin/pastors 가 단일 출처.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  useAllPeople,
  useDeletePerson,
  useMovePerson,
  useUpdatePerson,
} from '../../hooks/usePeople'
import {
  CATEGORY_DATE_LABEL,
  CATEGORY_LABEL,
  PERSON_CATEGORIES,
  assignmentList,
  looksLikeLeaderRole,
  personDateLabel,
  personInitial,
  personText,
} from '../../types/people'
import type { Person, PersonCategory } from '../../types/people'
import PersonComposer from './components/PersonComposer'
import { FilterChip, FilterRow } from './components/FilterControls'
import { can } from '../../utils/access'

type CategoryFilter = 'all' | PersonCategory

const PeopleManagement = () => {
  const navigate = useNavigate()
  const admin = can('admin:access')

  const { data: people = [], isPending, isError, refetch } = useAllPeople(admin)
  const updateMutation = useUpdatePerson()
  const moveMutation = useMovePerson()
  const deleteMutation = useDeletePerson()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // null = 닫힘, 'new' = 등록, Person = 수정
  const [composer, setComposer] = useState<'new' | Person | null>(null)

  useEffect(() => {
    if (!admin) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [admin, navigate])

  useEffect(() => {
    if (isError) showToast('섬기는 사람들 목록을 불러오지 못했습니다', 'error')
  }, [isError])

  // 서버가 이미 분류 → 순서로 정렬해 준다. 여기서는 거르기만 한다
  // (정렬을 다시 하면 ↑↓ 이동 결과와 화면이 어긋난다)
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return people.filter((person) => {
      const matchesSearch =
        !q ||
        [
          person.name_ko,
          person.name_en ?? '',
          person.role_ko ?? '',
          person.group_ko ?? '',
          person.assignments_ko ?? '',
          person.field_ko ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchesCategory = categoryFilter === 'all' || person.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [people, searchTerm, categoryFilter])

  const counts = useMemo(() => {
    const map = {} as Record<PersonCategory, number>
    PERSON_CATEGORIES.forEach((c) => {
      map[c] = people.filter((p) => p.category === c).length
    })
    return map
  }, [people])

  const hiddenCount = people.filter((p) => !p.is_published).length

  const handleToggleVisibility = async (person: Person) => {
    try {
      await updateMutation.mutateAsync({
        id: person.id,
        data: { is_published: !person.is_published },
      })
      showToast(person.is_published ? '숨김으로 전환했어요' : '공개로 전환했어요', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '변경에 실패했습니다', 'error')
    }
  }

  const handleMove = async (person: Person, direction: 'up' | 'down') => {
    try {
      await moveMutation.mutateAsync({ id: person.id, direction })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '순서 변경에 실패했습니다', 'error')
    }
  }

  const handleDelete = async (person: Person) => {
    if (
      !(await confirmDialog({
        title: '인물 삭제',
        message: `${person.name_ko} ${person.role_ko ?? ''}님의 정보를 삭제하시겠습니까?`.trim(),
        description:
          '사진·소개·담당 사역이 모두 사라지며 되돌릴 수 없습니다. 화면에서만 감추려면 삭제 대신 "숨김"을 사용하세요.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteMutation.mutateAsync(person.id)
      showToast('삭제되었습니다', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제에 실패했습니다', 'error')
    }
  }

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 도구 레일 sticky 가 산다.
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[1100px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark">
        {/* 헤더 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">섬기는 사람들</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 목록 / 우: 도구(등록·통계·검색/필터)가 sticky */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start lg:px-5 lg:pt-4">
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:space-y-3">
            <button
              type="button"
              onClick={() => setComposer('new')}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>인물 등록</span>
            </button>

            {/* 통계 */}
            <div className="px-4 pt-4 pb-1 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="전체" value={people.length} accent />
              {PERSON_CATEGORIES.map((c) => (
                <StatChip key={c} label={CATEGORY_LABEL[c].ko} value={counts[c]} />
              ))}
              <StatChip label="숨김" value={hiddenCount} />
            </div>

            {/* 검색 + 필터 */}
            <div className="px-4 py-3 lg:px-0 lg:py-0">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] p-4">
                <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

                <div className="relative z-10 space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="이름 · 직분 · 담당 사역 검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
                        aria-label="검색어 지우기"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <FilterRow label="분류">
                    <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                      전체
                    </FilterChip>
                    {PERSON_CATEGORIES.map((c) => (
                      <FilterChip
                        key={c}
                        active={categoryFilter === c}
                        onClick={() => setCategoryFilter(c)}
                      >
                        {CATEGORY_LABEL[c].ko}
                      </FilterChip>
                    ))}
                  </FilterRow>
                </div>
              </div>
            </div>

            {/* 결과 카운트 + 안내 */}
            <div className="px-5 pb-2 lg:px-1 lg:pb-0 text-[12px] text-gray-500 dark:text-white/55 flex items-center gap-2">
              <span>
                검색 결과 <span className="font-bold text-ink-strong">{filtered.length}</span>명
              </span>
              {searchTerm && <span className="text-brand truncate">"{searchTerm}"</span>}
            </div>

            <div className="px-5 pb-2 lg:px-1 flex flex-col gap-1 items-start">
              <button
                type="button"
                onClick={() => navigate('/people')}
                className="text-[12px] font-semibold text-brand hover:underline"
              >
                섬기는 사람들 페이지에서 보기 →
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/pastors')}
                className="text-[12px] font-semibold text-gray-500 dark:text-white/50 hover:text-brand hover:underline"
              >
                담임 · 원로목사는 인사말 관리에서 →
              </button>
            </div>
          </div>

          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            <div className="px-4 pb-32 lg:px-0 lg:pb-8 space-y-2">
              {isPending && people.length === 0 ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🙋</span>
                  <p className="text-[13px] text-gray-500 dark:text-white/55">
                    {searchTerm || categoryFilter !== 'all'
                      ? '조건에 맞는 분이 없습니다'
                      : '아직 등록된 분이 없어요'}
                  </p>
                  <p className="text-[12px] text-gray-400 dark:text-white/35 mt-1">
                    {searchTerm || categoryFilter !== 'all'
                      ? '필터를 바꾸거나 검색어를 지워보세요'
                      : '＋ 인물 버튼으로 등록해 보세요'}
                  </p>
                </div>
              ) : (
                filtered.map((person, index) => {
                  // ↑↓ 은 같은 분류 안에서만 의미가 있다 — 목록의 이웃이 다른 분류면 막는다
                  const prev = filtered[index - 1]
                  const next = filtered[index + 1]
                  return (
                    <PersonRow
                      key={person.id}
                      person={person}
                      expanded={expandedId === person.id}
                      canMoveUp={!!prev && prev.category === person.category}
                      canMoveDown={!!next && next.category === person.category}
                      onToggleExpand={() =>
                        setExpandedId((prevId) => (prevId === person.id ? null : person.id))
                      }
                      onEdit={() => setComposer(person)}
                      onMove={(direction) => handleMove(person, direction)}
                      onToggleVisibility={() => handleToggleVisibility(person)}
                      onDelete={() => handleDelete(person)}
                      onGoPastors={() => navigate('/admin/pastors')}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={() => setComposer('new')}
          className="fixed bottom-6 right-1/2 translate-x-[calc(min(50vw,14rem)-3.5rem)] z-30 lg:hidden inline-flex items-center gap-2 pl-4 pr-5 h-13 py-3 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_10px_30px_-6px_var(--brand-glow)] hover:-translate-y-0.5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>인물</span>
        </button>

        {composer && (
          <PersonComposer
            // key — 다른 사람을 연속으로 수정할 때 폼 상태가 남지 않도록 재마운트
            key={composer === 'new' ? 'new' : composer.id}
            person={composer === 'new' ? undefined : composer}
            defaultCategory={categoryFilter === 'all' ? 'pastor' : categoryFilter}
            onClose={() => setComposer(null)}
            onSuccess={() => {
              setComposer(null)
              void refetch()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────
interface PersonRowProps {
  person: Person
  expanded: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onMove: (direction: 'up' | 'down') => void
  onToggleVisibility: () => void
  onDelete: () => void
  onGoPastors: () => void
}

const PersonRow = ({
  person,
  expanded,
  canMoveUp,
  canMoveDown,
  onToggleExpand,
  onEdit,
  onMove,
  onToggleVisibility,
  onDelete,
  onGoPastors,
}: PersonRowProps) => {
  const assignments = assignmentList(person, 'ko')
  const group = personText(person, 'group', 'ko')
  const since = personDateLabel(person.started_on)
  // 담임·원로목사가 여기 들어오면 대표 카드가 아니라 일반 카드로 내려간다 — 눈에 띄게 알린다
  const misplacedLeader = looksLikeLeaderRole(person)

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border transition-all duration-200',
        'shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]',
        expanded ? 'border-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08]',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 공개는 브랜드 솔리드, 숨김은 중립 회색 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          person.is_published ? 'bg-brand' : 'bg-gray-300 dark:bg-white/10'
        }`}
      />

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative z-10 w-full flex items-center gap-3 pl-3.5 pr-3 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.name_ko}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-[20px] font-bold text-brand">
              {personInitial(person.name_ko)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14.5px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {person.name_ko}
              {person.role_ko && (
                <span className="ml-1 text-[13px] font-semibold text-brand">{person.role_ko}</span>
              )}
            </span>
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.05em] shrink-0">
              {CATEGORY_LABEL[person.category].ko}
            </span>
            {!person.is_published && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60 shrink-0">
                숨김
              </span>
            )}
            {misplacedLeader && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] text-[var(--amber)] shrink-0">
                대표 아님
              </span>
            )}
          </div>
          <div className="text-[11.5px] text-gray-500 dark:text-white/50 truncate mt-0.5">
            {group || '그룹 없음'}
            {person.field_ko && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-white/20">·</span>
                {person.field_ko}
              </>
            )}
          </div>
          <div className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
            {assignments.length > 0 ? assignments.join(' · ') : '담당 사역 미입력'}
          </div>
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

      {expanded && (
        <div className="relative z-10 px-3.5 pb-3.5 border-t border-gray-200/60 dark:border-white/[0.05] pt-3 space-y-2.5">
          {misplacedLeader && (
            <div className="px-3.5 py-3 rounded-xl bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)] space-y-2">
              <p className="text-[12.5px] leading-[1.6] text-ink-strong">
                담임목사·원로목사는 <span className="font-bold">인사말 관리</span>가 단일 출처입니다.
                여기 등록된 분은 섬기는 사람들 화면에서 맨 위 <span className="font-bold">대표 카드</span>가
                아니라 교역자 목록의 일반 카드로 보입니다.
              </p>
              <p className="text-[11.5px] leading-[1.6] text-gray-600 dark:text-white/60">
                인사말 관리에 등록(원로목사는 상태를 <span className="font-semibold">원로목사</span>로)하면
                대표 카드로 올라갑니다. 그 뒤 이 기록은 삭제해 주세요 — 두 곳에 있으면 두 번 보입니다.
              </p>
              <button
                type="button"
                onClick={onGoPastors}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[12.5px] font-bold transition-colors"
              >
                인사말 관리로 이동 →
              </button>
            </div>
          )}

          {person.bio_ko && (
            <p className="text-[12.5px] leading-[1.6] text-gray-700 dark:text-white/75 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2.5 whitespace-pre-wrap line-clamp-6">
              {person.bio_ko}
            </p>
          )}

          <div className="space-y-1.5 text-[12.5px]">
            <InfoRow label="전화" value={person.phone || '—'} />
            <InfoRow label="이메일" value={person.email || '—'} />
            {person.category === 'missionary' && (
              <>
                <InfoRow label="사역지" value={person.field_ko || '—'} />
                <InfoRow label="국가 코드" value={person.country_code?.toUpperCase() || '—'} />
                <InfoRow label="파송기관" value={person.org_ko || '—'} />
              </>
            )}
            <InfoRow
              label={`${CATEGORY_DATE_LABEL[person.category].ko}일`}
              value={since || '—'}
            />
            <InfoRow label="영문 이름" value={person.name_en || '—'} />
          </div>

          {/* 순서 — 같은 분류 안에서만 움직인다 */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onMove('up')}
              disabled={!canMoveUp}
              className="flex-1 h-9 rounded-xl text-[12px] font-semibold border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
            >
              ↑ 위로
            </button>
            <button
              type="button"
              onClick={() => onMove('down')}
              disabled={!canMoveDown}
              className="flex-1 h-9 rounded-xl text-[12px] font-semibold border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)] transition-colors disabled:opacity-35 disabled:hover:bg-transparent"
            >
              ↓ 아래로
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <RowAction onClick={onEdit} accent icon="edit" label="수정" />
            <RowAction
              onClick={onToggleVisibility}
              icon={person.is_published ? 'hide' : 'eye'}
              label={person.is_published ? '숨김' : '공개'}
            />
            <RowAction onClick={onDelete} destructive icon="trash" label="삭제" />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 작은 컴포넌트들 ──────────────────────────────────────
const StatChip = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-[12px] font-semibold text-brand'
        : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-gray-500 dark:text-white/50 shrink-0">{label}</span>
    <span className="text-gray-800 dark:text-white/85 font-medium truncate text-right min-w-0">
      {value}
    </span>
  </div>
)

const ACTION_ICONS: Record<string, ReactNode> = {
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  hide: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
}

const RowAction = ({
  onClick,
  accent,
  destructive,
  icon,
  label,
}: {
  onClick: () => void
  accent?: boolean
  destructive?: boolean
  icon: keyof typeof ACTION_ICONS
  label: string
}) => {
  let cls =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all '
  if (destructive) {
    cls +=
      'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-400/30 hover:bg-red-100 dark:hover:bg-red-500/15'
  } else if (accent) {
    cls +=
      'bg-[var(--brand-soft)] text-brand border border-[var(--brand-glow)] hover:bg-[var(--brand-soft-strong)]'
  } else {
    cls +=
      'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]'
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {ACTION_ICONS[icon]}
      <span>{label}</span>
    </button>
  )
}

export default PeopleManagement
