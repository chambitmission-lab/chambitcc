// 기도 작성 시 그룹 선택 컴포넌트
import { useMyGroups } from '../../../../hooks/useGroups'

interface GroupSelectorProps {
  selectedGroupId: number | null
  onGroupChange: (groupId: number | null) => void
}

const GroupSelector = ({ selectedGroupId, onGroupChange }: GroupSelectorProps) => {
  const { data: groupsData, isLoading } = useMyGroups()
  const groups = groupsData?.data.items || []

  if (isLoading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          공개 범위
        </label>
        <div className="text-sm text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        공개 범위
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onGroupChange(null)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${selectedGroupId === null
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <span>🌍</span>
          <span>전체 공개</span>
        </button>

        {groups.map(group => (
          <button
            key={group.id}
            type="button"
            onClick={() => onGroupChange(group.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${selectedGroupId === group.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
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
