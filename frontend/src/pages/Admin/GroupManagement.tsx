import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { fetchAdminGroups, deleteAdminGroup } from '../../api/admin'
import type { AdminGroupListResponse } from '../../api/admin'
import './UserManagement.css'

const GroupManagement = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<AdminGroupListResponse['data']['items']>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    
    loadGroups()
  }, [navigate, currentPage])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await fetchAdminGroups(currentPage, 20)
      setGroups(response.data.items)
      setTotal(response.data.total)
      setTotalPages(response.data.total_pages)
    } catch (error) {
      console.error('그룹 목록 로드 에러:', error)
      showToast('그룹 목록을 불러오는데 실패했습니다', 'error')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`정말 "${groupName}" 그룹을 삭제하시겠습니까?\n그룹의 모든 데이터가 삭제됩니다.`)) {
      return
    }
    
    try {
      await deleteAdminGroup(groupId)
      showToast('그룹이 삭제되었습니다', 'success')
      loadGroups()
    } catch (error) {
      showToast('그룹 삭제에 실패했습니다', 'error')
    }
  }

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    group.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-container-inner">
          <div className="loading-spinner">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-container-inner">
        <div className="admin-header">
          <h1>그룹 관리</h1>
          <div className="user-stats">
            <span className="stat-badge">전체 {total}개</span>
            <span className="stat-badge">페이지 {currentPage}/{totalPages}</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="filter-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="그룹명, 설명, 생성자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 그룹 목록 */}
        <div className="users-list">
          {filteredGroups.length === 0 ? (
            <div className="list-empty">
              <p>검색 결과가 없습니다</p>
              <p className="empty-subtitle">다른 검색어를 입력해보세요</p>
            </div>
          ) : (
            <div className="users-feed">
              {filteredGroups.map((group) => (
                <article key={group.id} className="user-card">
                  <div className="card-header">
                    <div className="card-avatar">
                      {group.icon || '👥'}
                    </div>
                    <div className="card-meta">
                      <div className="card-author">
                        {group.name}
                      </div>
                      {group.description && (
                        <div className="card-username">{group.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="card-content">
                    <div className="user-info-row">
                      <span className="info-label">👤 생성자</span>
                      <span className="info-value">{group.creator_name}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="info-label">👥 멤버 수</span>
                      <span className="info-value">{group.member_count}명</span>
                    </div>
                    <div className="user-info-row">
                      <span className="info-label">🙏 기도 수</span>
                      <span className="info-value">{group.prayer_count}개</span>
                    </div>
                    {group.invite_code && (
                      <div className="user-info-row">
                        <span className="info-label">🔑 초대 코드</span>
                        <span className="info-value">{group.invite_code}</span>
                      </div>
                    )}
                    <div className="user-info-row">
                      <span className="info-label">📅 생성일</span>
                      <span className="info-value">{formatDate(group.created_at)}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="info-label">🔄 수정일</span>
                      <span className="info-value">{formatDate(group.updated_at)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="action-button deactivate"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                    >
                      <span className="action-icon">🗑️</span>
                      <span>삭제</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              이전
            </button>
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupManagement
