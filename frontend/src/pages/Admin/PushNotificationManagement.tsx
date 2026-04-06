import { useState, useEffect } from 'react';
import { sendPush, type PushPayload } from '../../api/push';
import { getUserList, type User } from '../../api/user';
import './NotificationManagement.css';
import './PushNotificationManagement.css';

export const PushNotificationManagement = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [icon, setIcon] = useState('/chambitcc/pwa-192x192.png');
  const [tag, setTag] = useState('notification');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [sendTarget, setSendTarget] = useState<'all' | 'selected'>('all');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 사용자 목록
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getUserList();
      setUsers(data.users);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 검색 필터링
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.full_name && user.full_name.toLowerCase().includes(query))
    );
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: '제목과 내용을 입력해주세요.' });
      return;
    }

    if (sendTarget === 'selected' && selectedUserIds.length === 0) {
      setMessage({ type: 'error', text: '전송할 사용자를 선택해주세요.' });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      const payload: PushPayload = {
        title: title.trim(),
        body: body.trim(),
        icon: icon.trim() || '/chambitcc/pwa-192x192.png',
        image: '/chambitcc/pwa-512x512.png',
        url: url.trim() || '/',
        tag: tag.trim() || 'notification'
      };

      const userIdsToSend = sendTarget === 'selected' ? selectedUserIds : undefined;

      console.log('📤 푸시 알림 전송 시작');
      console.log('📋 페이로드:', payload);
      console.log('👥 대상 사용자 ID:', userIdsToSend || '전체');

      const startTime = Date.now();

      await sendPush({
        payload,
        user_ids: userIdsToSend
      });

      const duration = Date.now() - startTime;
      console.log(`✅ 푸시 알림 전송 완료 (${duration}ms)`);

      setMessage({
        type: 'success',
        text: userIdsToSend
          ? `${userIdsToSend.length}명에게 푸시 알림을 전송했습니다.`
          : '전체 사용자에게 푸시 알림을 전송했습니다.'
      });

      // 폼 초기화
      setTitle('');
      setBody('');
      setUrl('/');
      setTag('notification');
      setSelectedUserIds([]);
      setSendTarget('all');
    } catch (error: any) {
      console.error('❌ 푸시 전송 실패:', error);
      console.error('에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || '푸시 알림 전송에 실패했습니다.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const presetNotifications = [
    {
      title: '새로운 공지사항',
      body: '새로운 공지사항이 등록되었습니다.',
      url: '/news',
      tag: 'bulletin'
    },
    {
      title: '새로운 설교',
      body: '새로운 설교 영상이 업로드되었습니다.',
      url: '/sermon',
      tag: 'sermon'
    },
    {
      title: '기도 응답',
      body: '회원님의 기도 제목에 새로운 응답이 있습니다.',
      url: '/home',
      tag: 'prayer'
    }
  ];

  const applyPreset = (preset: typeof presetNotifications[0]) => {
    setTitle(preset.title);
    setBody(preset.body);
    setUrl(preset.url);
    setTag(preset.tag);
  };

  return (
    <div className="admin-container">
      <div className="admin-container-inner">
        <div className="admin-header">
          <h1>📢 푸시 알림 관리</h1>
        </div>

        {message && (
          <div className={`push-message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div className="preset-section">
          <h3>빠른 템플릿</h3>
          <div className="preset-buttons">
            {presetNotifications.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => applyPreset(preset)}
                className="preset-button"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="notification-form-card">
          <h2>푸시 알림 작성</h2>
          
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
              maxLength={50}
              required
            />
            <span className="char-count">{title.length}/50</span>
          </div>

          <div className="form-group">
            <label htmlFor="body">내용 *</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={4}
              maxLength={200}
              required
            />
            <span className="char-count">{body.length}/200</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="url">이동 URL</label>
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/news"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tag">태그</label>
              <input
                id="tag"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="notification"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="icon">아이콘 URL</label>
            <input
              id="icon"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="/chambitcc/pwa-192x192.png"
            />
          </div>

          <div className="form-group">
            <label>전송 대상</label>
            <div className="send-target-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="sendTarget"
                  value="all"
                  checked={sendTarget === 'all'}
                  onChange={() => setSendTarget('all')}
                />
                전체 발송
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sendTarget"
                  value="selected"
                  checked={sendTarget === 'selected'}
                  onChange={() => setSendTarget('selected')}
                />
                선택 발송
                {sendTarget === 'selected' && selectedUserIds.length > 0 && (
                  <span className="selected-count">{selectedUserIds.length}명 선택</span>
                )}
              </label>
            </div>
          </div>

          {sendTarget === 'selected' && (
            <div className="user-select-section">
              <div className="user-search-bar">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 아이디로 검색..."
                  className="user-search-input"
                />
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="select-all-btn"
                >
                  {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0
                    ? '전체 해제'
                    : '전체 선택'}
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="user-list-loading">사용자 목록을 불러오는 중...</div>
              ) : (
                <div className="user-list-container">
                  {filteredUsers.length === 0 ? (
                    <div className="user-list-empty">
                      {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <label
                        key={user.id}
                        className={`user-list-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                        <div className="user-info">
                          <span className="user-name">
                            {user.full_name || user.username}
                          </span>
                          <span className="user-meta">
                            @{user.username}
                            {user.is_admin && <span className="admin-badge">관리자</span>}
                            {!user.is_active && <span className="inactive-badge">비활성</span>}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="preview-section">
            <h3>미리보기</h3>
            <div className="notification-preview">
              <div className="preview-icon">
                <img src={icon || '/chambitcc/pwa-192x192.png'} alt="icon" />
              </div>
              <div className="preview-content">
                <div className="preview-title">{title || '알림 제목'}</div>
                <div className="preview-body">{body || '알림 내용'}</div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSending}
              className="btn-primary"
            >
              {isSending ? '전송 중...' : '푸시 알림 전송'}
            </button>
          </div>
        </form>

        <div className="info-section">
          <h3>ℹ️ 안내사항</h3>
          <ul>
            <li>푸시 알림은 프로필 페이지에서 "알림 받기"를 활성화한 사용자에게만 전송됩니다.</li>
            <li>사용자 ID를 지정하지 않으면 모든 구독자에게 전송됩니다.</li>
            <li>웹 브라우저(Chrome, Firefox, Edge)와 모바일에서 모두 수신 가능합니다.</li>
            <li>제목은 최대 50자, 내용은 최대 200자까지 입력 가능합니다.</li>
          </ul>
          
          <h3>⚠️ 푸시 전송 실패 시</h3>
          <ul>
            <li><strong>"failed: 1"</strong> 에러가 나면 대상 사용자가 구독하지 않았거나 구독이 만료된 것입니다.</li>
            <li>사용자에게 프로필 페이지에서 <strong>"알림 받기"</strong> 버튼을 다시 눌러 재구독하도록 안내하세요.</li>
            <li>VAPID 키가 변경된 경우, 모든 사용자가 재구독해야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
