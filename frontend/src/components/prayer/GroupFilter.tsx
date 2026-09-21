// 소그룹 필터 컴포넌트
import { useState, useRef, useEffect } from 'react'
import { useMyGroups } from '../../hooks/useGroups'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import { getGroupColorTheme } from '../../utils/groupColors'
import { GroupGlyph, PrayIcon } from '../../pages/Groups/GroupIcons'
import { isPastor } from '../../utils/access'
import type { PrayerFilterType } from '../../types/prayer'

interface GroupFilterProps {
  selectedGroupId: number | null
  selectedFilter: PrayerFilterType
  onGroupChange: (groupId: number | null) => void
  onFilterChange: (filter: PrayerFilterType) => void
  onCreateGroup: () => void
  onJoinGroup: () => void
}

// lg+ 세그먼트 컨트롤 — 활성 탭은 언더라인 대신 트랙 위로 떠오른 알약
const SEG_BASE = 'lg:px-1 lg:py-1.5 lg:text-[13px] lg:rounded-full lg:whitespace-nowrap'
const SEG_ACTIVE = 'lg:font-semibold lg:bg-[var(--surface-container)] lg:shadow-sm dark:lg:bg-white/[0.12]'

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

  // 목양 기도함 — 목회자에게만 다섯 번째 탭이 생긴다 (서버도 filter=pastoral 을 403 으로 지킨다).
  // 탭이 하나 늘면 모바일 폭이 빠듯해 좌우 패딩만 줄인다
  const showPastoral = isPastor()
  const tabPad = showPastoral ? 'px-2' : 'px-4'

  // 드롭다운 위치는 여는 순간에 계산한다
  const toggleDropdown = () => {
    if (isExpanded || !buttonRef.current) {
      setIsExpanded(false)
      return
    }
    // PC: 화면 중앙 고정 시트가 아니라 세그먼트 바로 아래에 붙는 팝오버
    // (피드 컬럼은 3컬럼 배치라 뷰포트 중앙이 아니다)
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setDropdownStyle({ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0 })
    } else {
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
    setIsExpanded(true)
  }

  // 키보드가 있는 환경 — Esc로 팝오버 닫기
  useEffect(() => {
    if (!isExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isExpanded])
  
  return (
    <div className="relative">
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* 언더라인 탭 스타일 */}
      <div className="relative z-50">
        {/* lg+: 모바일식 언더라인 탭을 늘려 쓰지 않고 한 줄 세그먼트(알약 트랙)로 — 옆에 정렬 토글이 붙는다 */}
        <div className="flex items-center border-b border-black/[0.06] dark:border-white/[0.08] lg:border-b-0 lg:gap-0.5 lg:p-1 lg:rounded-full lg:bg-black/[0.05] dark:lg:bg-white/[0.06]">
          {/* 전체 공개 */}
          <button
            className={`
              relative flex-1 ${tabPad} py-3 text-sm font-medium ${SEG_BASE}
              transition-all duration-200
              ${selectedGroupId === null && selectedFilter === 'all'
                ? `text-brand ${SEG_ACTIVE}`
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient-bg rounded-full lg:hidden" />
            )}
          </button>
          
          {/* 내 그룹 드롭다운 */}
          <button
            ref={buttonRef}
            className={`
              relative flex-1 flex items-center justify-center gap-1.5 ${tabPad} py-3 text-sm font-medium lg:gap-0.5 ${SEG_BASE}
              transition-all duration-200
              ${selectedGroupId !== null
                ? `text-brand ${SEG_ACTIVE}`
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            onClick={toggleDropdown}
          >
            <span className="truncate max-w-[90px] lg:max-w-[56px]">{selectedGroup?.name || t('myGroups')}</span>
            <svg 
              className={`w-4 h-4 lg:w-3.5 lg:h-3.5 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {selectedGroupId !== null && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient-bg rounded-full lg:hidden" />
            )}
          </button>

          {/* 내 기도 */}
          <button
            className={`
              relative flex-1 ${tabPad} py-3 text-sm font-medium ${SEG_BASE}
              transition-all duration-200
              ${selectedFilter === 'my_prayers'
                ? `text-brand ${SEG_ACTIVE}`
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient-bg rounded-full lg:hidden" />
            )}
          </button>

          {/* 내가 기도한 */}
          <button
            className={`
              relative flex-1 ${tabPad} py-3 text-sm font-medium ${SEG_BASE}
              transition-all duration-200
              ${selectedFilter === 'prayed_by_me'
                ? `text-brand ${SEG_ACTIVE}`
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient-bg rounded-full lg:hidden" />
            )}
          </button>

          {/* 목양 기도함 — '목사님과 함께'로 올라온 기도 (목회자 전용) */}
          {showPastoral && (
            <button
              className={`
                relative flex-1 ${tabPad} py-3 text-sm font-medium ${SEG_BASE}
                transition-all duration-200
                ${selectedFilter === 'pastoral'
                  ? `text-brand ${SEG_ACTIVE}`
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
              onClick={() => {
                onGroupChange(null)
                onFilterChange('pastoral')
              }}
            >
              {t('pastoralInbox')}
              {selectedFilter === 'pastoral' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 brand-gradient-bg rounded-full lg:hidden" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div 
          style={dropdownStyle}
          className="bg-white/95 dark:bg-[#201f1f]/95 backdrop-blur-xl border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto lg:animate-pop-in"
        >
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">{t('loading')}</div>
          ) : groups.length === 0 ? (
            <div className="p-4 text-center">
              <div className="mb-2 flex justify-center text-brand"><PrayIcon size={36} /></div>
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">{t('noGroupsYet')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => requireAuth(onCreateGroup)}
                  className="flex-1 px-3 py-2 brand-gradient font-semibold text-xs rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  + {t('createGroupShort')}
                </button>
                <button
                  onClick={() => requireAuth(onJoinGroup)}
                  className="flex-1 px-3 py-2 outline-button font-semibold text-xs rounded-full hover:bg-[var(--brand-soft-strong)] transition-all"
                >
                  {t('joinGroupShort')}
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
                        <span
                          className="inline-flex items-center leading-none"
                          style={{ color: isSelected ? '#3D2817' : 'var(--brand)' }}
                        >
                          <GroupGlyph emoji={group.icon} size={17} />
                        </span>
                        
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
              
              <div className="px-3 pb-3 pt-2 border-t border-[var(--card-border)] flex gap-2">
                <button
                  onClick={() => requireAuth(onCreateGroup)}
                  className="flex-1 px-3 py-2 brand-gradient font-semibold text-xs rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  + {t('createGroupShort')}
                </button>
                <button
                  onClick={() => requireAuth(onJoinGroup)}
                  className="flex-1 px-3 py-2 outline-button font-semibold text-xs rounded-full hover:bg-[var(--brand-soft-strong)] transition-all"
                >
                  {t('joinGroupShort')}
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
