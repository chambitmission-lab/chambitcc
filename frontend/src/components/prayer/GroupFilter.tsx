// 소그룹 필터 컴포넌트
import { useState } from 'react'
import { useMyGroups } from '../../hooks/useGroups'

interface GroupFilterProps {
  selectedGroupId: number | null
  onGroupChange: (groupId: number | null) => void
  onCreateGroup: () => void
  onJoinGroup: () => void
}

const GroupFilter = ({ 
  selectedGroupId, 
  onGroupChange,
  onCreateGroup,
  onJoinGroup
}: GroupFilterProps) => {
  const { data: groupsData, isLoading } = useMyGroups()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const groups = groupsData?.data.items || []
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          className={`
            flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold
            transition-all
            ${selectedGroupId === null
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border border-border-light dark:border-border-dark'
            }
          `}
          onClick={() => onGroupChange(null)}
        >
          <span>🌍</span>
          <span>전체 공개</span>
        </button>
        
        <button
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{selectedGroup?.icon || '👥'}</span>
          <span className="flex-1 text-left">{selectedGroup?.name || '내 그룹'}</span>
          <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">로딩 중...</div>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">아직 가입한 그룹이 없습니다</p>
              <div className="flex gap-2">
                <button 
                  onClick={onCreateGroup}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  그룹 만들기
                </button>
                <button 
                  onClick={onJoinGroup}
                  className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  그룹 가입
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg text-left
                      transition-all
                      ${selectedGroupId === group.id
                        ? 'bg-purple-50 dark:bg-purple-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                    onClick={() => {
                      onGroupChange(group.id)
                      setIsExpanded(false)
                    }}
                  >
                    <span className="text-2xl">{group.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        멤버 {group.member_count}명 · 기도 {group.prayer_count}개
                      </div>
                    </div>
                    {group.is_admin && (
                      <span className="px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded">
                        관리자
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-3 border-t border-border-light dark:border-border-dark flex gap-2">
                <button 
                  onClick={onCreateGroup}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  + 그룹 만들기
                </button>
                <button 
                  onClick={onJoinGroup}
                  className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  그룹 가입
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GroupFilter
