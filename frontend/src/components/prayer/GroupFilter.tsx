// 소그룹 필터 컴포넌트
import { useState, useRef, useEffect } from 'react'
import { useMyGroups } from '../../hooks/useGroups'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import { getGroupColorTheme } from '../../utils/groupColors'
import type { PrayerFilterType } from '../../types/prayer'

interface GroupFilterProps {
  selectedGroupId: number | null
  selectedFilter: PrayerFilterType
  onGroupChange: (groupId: number | null) => void
  onFilterChange: (filter: PrayerFilterType) => void
  onCreateGroup: () => void
  onJoinGroup: () => void
}

const GroupFilter = ({ 
  selectedGroupId,
  selectedFilter,
  onGroupChange,
  onFilterChange,
  onCreateGroup,
  onJoinGroup
}: GroupFilterProps) => {
  const { data: groupsData, isLoading } = useMyGroups()
  const { t } = useLanguage()
  const { requireAuth } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  
  const groups = groupsData?.data.items || []
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: '16px',
        right: '16px',
        maxWidth: '448px',
        margin: '0 auto',
      })
    }
  }, [isExpanded])
  
  return (
    <div className="relative">
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* 언더라인 탭 스타일 */}
      <div className="relative z-50">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
          {/* 전체 공개 */}
          <button
            className={`
              relative flex-1 px-4 py-3 text-sm font-medium
              transition-all duration-200
              ${selectedGroupId === null && selectedFilter === 'all'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            onClick={() => {
              onGroupChange(null)
              onFilterChange('all')
            }}
          >
            {t('allPublic')}
            {selectedGroupId === null && selectedFilter === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>
          
          {/* 내 그룹 드롭다운 */}
          <button
            ref={buttonRef}
            className={`
              relative flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium
              transition-all duration-200
              ${selectedGroupId !== null
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="truncate max-w-[90px]">{selectedGroup?.name || t('myGroups')}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {selectedGroupId !== null && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>

          {/* 내 기도 */}
          <button
            className={`
              relative flex-1 px-4 py-3 text-sm font-medium
              transition-all duration-200
              ${selectedFilter === 'my_prayers'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            onClick={() => {
              requireAuth(() => {
                onGroupChange(null)
                onFilterChange('my_prayers')
              })
            }}
          >
            {t('myPrayers')}
            {selectedFilter === 'my_prayers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>

          {/* 내가 기도한 */}
          <button
            className={`
              relative flex-1 px-4 py-3 text-sm font-medium
              transition-all duration-200
              ${selectedFilter === 'prayed_by_me'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            onClick={() => {
              requireAuth(() => {
                onGroupChange(null)
                onFilterChange('prayed_by_me')
              })
            }}
          >
            {t('prayedByMe')}
            {selectedFilter === 'prayed_by_me' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div 
          style={dropdownStyle}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">로딩 중...</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">🙏</div>
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">아직 가입한 그룹이 없습니다</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => requireAuth(onCreateGroup)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xs rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  + 만들기
                </button>
                <button 
                  onClick={() => requireAuth(onJoinGroup)}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  가입하기
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3">
                {/* 그룹 칩 리스트 - 컴팩트 */}
                <div className="flex flex-wrap gap-2">
                  {groups.map(group => {
                    const colorTheme = getGroupColorTheme(group.name)
                    const isSelected = selectedGroupId === group.id
                    
                    return (
                      <button
                        key={group.id}
                        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 text-gray-700 dark:text-gray-200"
                        style={{
                          background: isSelected 
                            ? colorTheme.gradient
                            : 'rgba(0,0,0,0.03)',
                          border: isSelected 
                            ? `1.5px solid ${colorTheme.primary}`
                            : '1.5px solid transparent',
                          boxShadow: isSelected 
                            ? `0 2px 12px ${colorTheme.glow}`
                            : 'none'
                        }}
                        onClick={() => {
                          onGroupChange(group.id)
                          onFilterChange('all')
                          setIsExpanded(false)
                        }}
                      >
                        {/* 아이콘 */}
                        <span className="text-base leading-none">{group.icon || '👥'}</span>
                        
                        {/* 그룹명 - 다크모드 대응 */}
                        <span 
                          className="text-xs font-bold"
                          style={{
                            color: isSelected 
                              ? '#3D2817' 
                              : undefined,
                            textShadow: isSelected ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                          }}
                        >
                          {group.name}
                        </span>
                        
                        {/* 통계 - 다크모드 대응 */}
                        <div 
                          className="flex items-center gap-1 text-[10px] font-semibold"
                          style={{
                            color: isSelected 
                              ? '#3D2817' 
                              : 'rgba(156, 163, 175, 1)', // gray-400
                            textShadow: isSelected ? '0 1px 2px rgba(255,255,255,0.5)' : 'none'
                          }}
                        >
                          <span>{group.member_count}</span>
                          <span>·</span>
                          <span>{group.prayer_count}</span>
                        </div>
                        
                        {/* 선택 표시 */}
                        {isSelected && (
                          <div 
                            className="w-3 h-3 rounded-full flex items-center justify-center ml-0.5"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          >
                            <svg className="w-2 h-2" fill={colorTheme.accent} viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="px-3 pb-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-2">
                <button 
                  onClick={() => requireAuth(onCreateGroup)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xs rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  + 만들기
                </button>
                <button 
                  onClick={() => requireAuth(onJoinGroup)}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  가입하기
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
