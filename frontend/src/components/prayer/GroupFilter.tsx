// 소그룹 필터 컴포넌트
import { useState } from 'react'
import { useMyGroups } from '../../hooks/useGroups'
import './GroupFilter.css'

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
    <div className="group-filter">
      <div className="group-filter-header">
        <button
          className={`group-filter-btn ${selectedGroupId === null ? 'active' : ''}`}
          onClick={() => onGroupChange(null)}
        >
          <span className="group-icon">🌍</span>
          <span>전체 공개</span>
        </button>
        
        <button
          className="group-filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="group-icon">{selectedGroup?.icon || '👥'}</span>
          <span>{selectedGroup?.name || '내 그룹'}</span>
          <span className="toggle-icon">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="group-filter-dropdown">
          {isLoading ? (
            <div className="group-filter-loading">로딩 중...</div>
          ) : groups.length === 0 ? (
            <div className="group-filter-empty">
              <p>아직 가입한 그룹이 없습니다</p>
              <div className="group-filter-actions">
                <button onClick={onCreateGroup} className="btn-create">
                  그룹 만들기
                </button>
                <button onClick={onJoinGroup} className="btn-join">
                  그룹 가입하기
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="group-filter-list">
                {groups.map(group => (
                  <button
                    key={group.id}
                    className={`group-filter-item ${selectedGroupId === group.id ? 'active' : ''}`}
                    onClick={() => {
                      onGroupChange(group.id)
                      setIsExpanded(false)
                    }}
                  >
                    <span className="group-icon">{group.icon}</span>
                    <div className="group-info">
                      <div className="group-name">{group.name}</div>
                      <div className="group-stats">
                        멤버 {group.member_count}명 · 기도 {group.prayer_count}개
                      </div>
                    </div>
                    {group.is_admin && (
                      <span className="admin-badge">관리자</span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="group-filter-actions">
                <button onClick={onCreateGroup} className="btn-create">
                  + 그룹 만들기
                </button>
                <button onClick={onJoinGroup} className="btn-join">
                  그룹 가입하기
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
