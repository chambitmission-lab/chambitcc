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
      {/* Backdrop - 드롭다운 열릴 때 배경 흐리게 */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div className="flex items-center gap-2 relative z-50">
        <button
          className={`
            px-3 py-1.5 rounded-full text-xs font-semibold
            transition-all
            ${selectedGroupId === null
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-400 border border-border-light dark:border-border-dark'
            }
          `}
          onClick={() => onGroupChange(null)}
        >
          전체 공개
        </button>
        
        <button
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            transition-all
            ${selectedGroupId !== null
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-surface-light dark:bg-surface-dark text-gray-600 dark:text-gray-400 border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="truncate max-w-[100px]">{selectedGroup?.name || '내 그룹'}</span>
          <span className={`text-[10px] ${selectedGroupId !== null ? 'text-white/80' : 'text-gray-400'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
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
              <div className="p-2 grid grid-cols-2 gap-1.5">
                {groups.map(group => (
                  <button
                    key={group.id}
                    className={`
                      flex items-center gap-2 px-2.5 py-2 rounded-lg text-left relative
                      transition-all
                      ${selectedGroupId === group.id
                        ? 'bg-purple-500/10 dark:bg-purple-500/20 ring-1 ring-purple-500'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    onClick={() => {
                      onGroupChange(group.id)
                      setIsExpanded(false)
                    }}
                  >
                    {/* 그룹 아이콘 */}
                    <div className="text-xl flex-shrink-0">
                      {group.icon || '👥'}
                    </div>
                    
                    {/* 그룹 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                        {group.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>👤{group.member_count}</span>
                        <span>🙏{group.prayer_count}</span>
                      </div>
                    </div>
                    
                    {/* 선택 표시 */}
                    {selectedGroupId === group.id && (
                      <div className="absolute top-1 right-1 text-purple-500">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
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
