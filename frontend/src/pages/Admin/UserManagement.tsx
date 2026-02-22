import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import './UserManagement.css'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_admin: boolean
  is_active: boolean
  created_at: string
  last_login?: string
}

const UserManagement = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    // 관리자 권한 확인
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    
    loadUsers()
  }, [navigate])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // TODO: API 연동 - 백엔드 API 준비되면 연결
      // const data = await getUserList()
      // setUsers(data)
      
      // 임시 데이터
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@church.com',
          full_name: '관리자',
          is_admin: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          last_login: '2024-02-22T10:30:00Z'
        },
        {
          id: 2,
          username: 'user1',
          email: 'user1@example.com',
          full_name: '홍길동',
          is_admin: false,
          is_active: true,
          created_at: '2024-01-15T00:00:00Z',
          last_login: '2024-02-20T14:20:00Z'
        },
        {
          id: 3,
          username: 'user2',
          email: 'user2@example.com',
          full_name: '김철수',
          is_admin: false,
          is_active: true,
          created_at: '2024-02-01T00:00:00Z',
          last_login: '2024-02-21T09:15:00Z'
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('회원 목록 로드 에러:', error)
      showToast('회원 목록을 불러오는데 실패했습니다', 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`정말 ${currentStatus ? '일반 사용자로' : '관리자로'} 변경하시겠습니까?`)) return
    
    try {
      // TODO: API 연동
      // await updateUserRole(userId, !currentStatus)
      showToast('권한이 변경되었습니다', 'success')
      loadUsers()
    } catch (error) {
      showToast('권한 변경에 실패했습니다', 'error')
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (!confirm(`정말 ${currentStatus ? '비활성화' : '활성화'}하시겠습니까?`)) return
    
    try {
      // TODO: API 연동
      // await updateUserStatus(userId, !currentStatus)
      showToast('상태가 변경되었습니다', 'success')
      loadUsers()
    } catch (error) {
      showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = 
      filterRole === 'all' ||
      (filterRole === 'admin' && user.is_admin) ||
      (filterRole === 'user' && !user.is_admin)
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '로그인 기록 없음'
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h1>회원 관리</h1>
          <div className="user-stats">
            <span className="stat-badge">전체 {users.length}명</span>
            <span className="stat-badge admin">관리자 {users.filter(u => u.is_admin).length}명</span>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="filter-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="이름, 이메일, 아이디로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">전체 권한</option>
              <option value="admin">관리자</option>
              <option value="user">일반 사용자</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        {/* 회원 목록 */}
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="list-empty">
              <p>검색 결과가 없습니다</p>
              <p className="empty-subtitle">다른 검색어를 입력해보세요</p>
            </div>
          ) : (
            <div className="users-feed">
              {filteredUsers.map((user) => (
                <article key={user.id} className="user-card">
                  <div className="card-header">
                    <div className="card-avatar">
                      {user.is_admin ? '👑' : '👤'}
                    </div>
                    <div className="card-meta">
                      <div className="card-author">
                        {user.full_name}
                        {user.is_admin && <span className="admin-badge">관리자</span>}
                      </div>
                      <div className="card-username">@{user.username}</div>
                    </div>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? '활성' : '비활성'}
                    </span>
                  </div>

                  <div className="card-content">
                    <div className="user-info-row">
                      <span className="info-label">📧 이메일</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="info-label">📅 가입일</span>
                      <span className="info-value">{formatDate(user.created_at)}</span>
                    </div>
                    <div className="user-info-row">
                      <span className="info-label">🕐 최근 로그인</span>
                      <span className="info-value">{formatDateTime(user.last_login)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button 
                      className={`action-button ${user.is_admin ? 'demote' : 'promote'}`}
                      onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                    >
                      <span className="action-icon">{user.is_admin ? '👤' : '👑'}</span>
                      <span>{user.is_admin ? '일반 사용자로' : '관리자로'}</span>
                    </button>
                    <button 
                      className={`action-button ${user.is_active ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                    >
                      <span className="action-icon">{user.is_active ? '🚫' : '✅'}</span>
                      <span>{user.is_active ? '비활성화' : '활성화'}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement
