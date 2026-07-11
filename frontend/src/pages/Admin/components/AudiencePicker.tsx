// 발송 대상 선택 UI — 대상 모드 칩 + 요약 배지 + 직접 선택(검색·필터·체크 리스트).
// 상태는 useAudiencePicker 훅이 관리하고, 이 컴포넌트는 렌더링만 담당한다.
import type { User } from '../../../api/user'
import type { AudiencePickerState } from '../../../hooks/useAudiencePicker'
import { FilterChip, FilterRow } from './FilterControls'

const AudiencePicker = ({ picker }: { picker: AudiencePickerState }) => {
  const {
    audienceMode,
    setAudienceMode,
    audienceLabel,
    userSearch,
    setUserSearch,
    userListFilter,
    setUserListFilter,
    filteredUsers,
    selectedUserIds,
    isLoadingUsers,
    toggleUser,
    toggleSelectAllVisible,
  } = picker

  return (
    <>
      <FilterRow align="center" label="대상">
        <FilterChip active={audienceMode === 'all'} onClick={() => setAudienceMode('all')}>
          전체
        </FilterChip>
        <FilterChip active={audienceMode === 'active'} onClick={() => setAudienceMode('active')}>
          활성 회원
        </FilterChip>
        <FilterChip active={audienceMode === 'admin'} onClick={() => setAudienceMode('admin')}>
          관리자
        </FilterChip>
        <FilterChip active={audienceMode === 'selected'} onClick={() => setAudienceMode('selected')}>
          직접 선택
        </FilterChip>
      </FilterRow>

      <div className="mt-3 rounded-xl bg-purple-50/60 dark:bg-purple-500/[0.08] border border-purple-200/60 dark:border-purple-400/20 px-3.5 py-2.5 flex items-center justify-between">
        <span className="text-[12.5px] text-gray-700 dark:text-white/80">
          발송 대상
        </span>
        <span className="text-[13px] font-bold text-purple-700 dark:text-purple-300">
          {audienceLabel}
        </span>
      </div>

      {audienceMode === 'selected' && (
        <div className="mt-3 space-y-3">
          {/* 검색 */}
          <div className="relative">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="아이디 · 이름 검색"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
            />
            {userSearch && (
              <button
                type="button"
                onClick={() => setUserSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 p-1 rounded-full"
                aria-label="검색어 지우기"
              >
                <span className="material-icons-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* 필터 + 일괄 선택 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              <FilterChip active={userListFilter === 'all'} onClick={() => setUserListFilter('all')}>
                전체
              </FilterChip>
              <FilterChip active={userListFilter === 'active'} onClick={() => setUserListFilter('active')}>
                활성
              </FilterChip>
              <FilterChip active={userListFilter === 'admin'} onClick={() => setUserListFilter('admin')}>
                관리자
              </FilterChip>
            </div>
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="text-[11.5px] font-semibold text-purple-700 dark:text-purple-300 hover:underline px-2 py-1"
            >
              {filteredUsers.every((u) => selectedUserIds.includes(u.id)) && filteredUsers.length > 0
                ? '보이는 행 해제'
                : '보이는 행 선택'}
            </button>
          </div>

          {/* 사용자 리스트 */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5 -mx-1 px-1">
            {isLoadingUsers ? (
              <SkeletonRows />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-[12.5px] text-gray-500 dark:text-white/55">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <UserPickRow
                  key={u.id}
                  user={u}
                  selected={selectedUserIds.includes(u.id)}
                  onToggle={() => toggleUser(u.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}

const SkeletonRows = () => (
  <div className="space-y-1.5">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-[52px] rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

const UserPickRow = ({
  user,
  selected,
  onToggle,
}: {
  user: User
  selected: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
      selected
        ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300/60 dark:border-purple-400/30'
        : 'bg-white/60 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/[0.06] hover:border-purple-200 dark:hover:border-purple-400/20'
    }`}
  >
    <span
      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
        selected
          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
          : 'bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1]'
      }`}
    >
      {selected && <span className="material-icons-outlined text-[14px]">check</span>}
    </span>

    <div className="relative shrink-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[12px] font-bold">
        {(user.full_name || user.username).charAt(0).toUpperCase()}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background-light dark:ring-card-dark ${
          user.is_active ? 'bg-green-500' : 'bg-gray-400 dark:bg-white/30'
        }`}
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
          {user.full_name || user.username}
        </span>
        {user.is_admin && (
          <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 tracking-[0.05em] shrink-0">
            ADMIN
          </span>
        )}
      </div>
      <div className="text-[11px] text-gray-500 dark:text-white/45 truncate">@{user.username}</div>
    </div>
  </button>
)

export default AudiencePicker
