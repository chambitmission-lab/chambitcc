// 기도 작성 시 그룹 선택 컴포넌트
import { useMyGroups } from '../../../../hooks/useGroups'

interface GroupSelectorProps {
  selectedGroupId: number | null
  onGroupChange: (groupId: number | null) => void
}

const GroupSelector = ({ selectedGroupId, onGroupChange }: GroupSelectorProps) => {
  const { data: groupsData, isLoading } = useMyGroups()
  const groups = groupsData?.data.items || []

  const baseClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200'
  const activeClass =
    'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_2px_8px_rgba(168,85,247,0.35)]'
  const inactiveClass =
    'bg-purple-500/[0.06] dark:bg-purple-500/10 text-gray-600 dark:text-gray-300 hover:bg-purple-500/[0.12] dark:hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-300'

  if (isLoading) {
    return (
      <div className="mb-5">
        <label className="block text-[13px] font-bold tracking-[-0.015em] mb-2.5 text-gray-700 dark:text-gray-300">
          공개 범위
        </label>
        <div className="text-xs text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      <label className="block text-[13px] font-bold tracking-[-0.015em] mb-2.5 text-gray-700 dark:text-gray-300">
        공개 범위
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onGroupChange(null)}
          className={`${baseClass} ${selectedGroupId === null ? activeClass : inactiveClass}`}
        >
          <span>🌍</span>
          <span>전체 공개</span>
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onGroupChange(group.id)}
            className={`${baseClass} ${selectedGroupId === group.id ? activeClass : inactiveClass}`}
          >
            <span>{group.icon}</span>
            <span>{group.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default GroupSelector
