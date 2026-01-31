# 커뮤니티 피드 기능 API 요청 명세서

## 개요
교회 홈페이지에 트위터/X 스타일의 소셜 피드 기능을 추가하려고 합니다.
교인들이 간증, 기도제목, 행사 후기 등을 자유롭게 공유하고 소통할 수 있는 기능입니다.

---

## 1. 필요한 API 엔드포인트

### 1.1 피드 목록 조회
```
GET /api/community/posts
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 게시물 수 (기본값: 10)
- `sort` (optional): 정렬 기준 (latest, popular) (기본값: latest)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "author": {
          "id": 123,
          "name": "김은혜",
          "username": "grace_kim",
          "avatar": "https://example.com/avatar.jpg" // 또는 이모지
        },
        "content": "오늘 새벽기도회 너무 은혜로웠어요! 시편 23편 말씀이 마음에 깊이 와닿았습니다.",
        "image": "https://example.com/image.jpg", // optional
        "createdAt": "2025-01-31T08:30:00Z",
        "likes": 24,
        "retweets": 5,
        "replies": 8,
        "isLiked": false,
        "isRetweeted": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalPosts": 100,
      "hasNext": true
    }
  }
}
```

---

### 1.2 피드 작성
```
POST /api/community/posts
```

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "content": "오늘 새벽기도회 너무 은혜로웠어요!",
  "image": "base64_encoded_image" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "author": {
      "id": 123,
      "name": "김은혜",
      "username": "grace_kim",
      "avatar": "👩"
    },
    "content": "오늘 새벽기도회 너무 은혜로웠어요!",
    "image": null,
    "createdAt": "2025-01-31T08:30:00Z",
    "likes": 0,
    "retweets": 0,
    "replies": 0,
    "isLiked": false,
    "isRetweeted": false
  }
}
```

---

### 1.3 좋아요 토글
```
POST /api/community/posts/{postId}/like
```

**Headers:**
- `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 25
  }
}
```

---

### 1.4 리트윗 토글
```
POST /api/community/posts/{postId}/retweet
```

**Headers:**
- `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isRetweeted": true,
    "retweetsCount": 6
  }
}
```

---

### 1.5 댓글 목록 조회
```
GET /api/community/posts/{postId}/replies
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 댓글 수 (기본값: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "replies": [
      {
        "id": 1,
        "author": {
          "id": 456,
          "name": "이성도",
          "username": "faithful_lee",
          "avatar": "👨"
        },
        "content": "아멘! 함께 기도하겠습니다 🙏",
        "createdAt": "2025-01-31T09:00:00Z",
        "likes": 5
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalReplies": 23,
      "hasNext": true
    }
  }
}
```

---

### 1.6 댓글 작성
```
POST /api/community/posts/{postId}/replies
```

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "content": "아멘! 함께 기도하겠습니다 🙏"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "author": {
      "id": 456,
      "name": "이성도",
      "username": "faithful_lee",
      "avatar": "👨"
    },
    "content": "아멘! 함께 기도하겠습니다 🙏",
    "createdAt": "2025-01-31T09:00:00Z",
    "likes": 0
  }
}
```

---

### 1.7 게시물 삭제
```
DELETE /api/community/posts/{postId}
```

**Headers:**
- `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "게시물이 삭제되었습니다."
}
```

---

## 2. 데이터베이스 스키마 제안

### 2.1 posts 테이블
```sql
CREATE TABLE community_posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  likes_count INT DEFAULT 0,
  retweets_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
);
```

### 2.2 post_likes 테이블
```sql
CREATE TABLE post_likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_like (post_id, user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);
```

### 2.3 post_retweets 테이블
```sql
CREATE TABLE post_retweets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_retweet (post_id, user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);
```

### 2.4 post_replies 테이블
```sql
CREATE TABLE post_replies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

---

## 3. 추가 고려사항

### 3.1 인증/권한
- 로그인한 사용자만 게시물 작성, 좋아요, 리트윗, 댓글 가능
- 본인이 작성한 게시물만 삭제 가능
- 관리자는 모든 게시물 삭제 가능

### 3.2 이미지 업로드
- 이미지 파일 크기 제한: 5MB
- 허용 포맷: JPG, PNG, GIF
- 이미지 리사이징 권장 (최대 1200px)
- S3 또는 CDN 사용 권장

### 3.3 컨텐츠 제한
- 게시물 최대 길이: 500자
- 댓글 최대 길이: 300자
- 욕설/비방 필터링 고려

### 3.4 성능 최적화
- 좋아요/리트윗 수는 캐시 사용 권장 (Redis)
- 피드 목록은 페이지네이션 필수
- 인덱스 최적화 필요

### 3.5 실시간 업데이트 (선택사항)
- WebSocket 또는 Server-Sent Events로 실시간 피드 업데이트
- 새 게시물 알림 기능

---

## 4. 프론트엔드 연동 예시

### 4.1 API 호출 함수 (TypeScript)
```typescript
// src/api/community.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface Post {
  id: number;
  author: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  isLiked: boolean;
  isRetweeted: boolean;
}

// 피드 목록 조회
export const getPosts = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/api/community/posts`, {
    params: { page, limit }
  });
  return response.data;
};

// 게시물 작성
export const createPost = async (content: string, image?: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/community/posts`,
    { content, image },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return response.data;
};

// 좋아요 토글
export const toggleLike = async (postId: number) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/community/posts/${postId}/like`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return response.data;
};

// 리트윗 토글
export const toggleRetweet = async (postId: number) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/community/posts/${postId}/retweet`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  );
  return response.data;
};
```

---

## 5. 우선순위

### Phase 1 (필수)
1. 피드 목록 조회 API
2. 피드 작성 API
3. 좋아요 기능
4. 기본 데이터베이스 스키마

### Phase 2 (중요)
1. 댓글 기능
2. 리트윗 기능
3. 이미지 업로드
4. 게시물 삭제

### Phase 3 (선택)
1. 실시간 업데이트
2. 알림 기능
3. 해시태그 기능
4. 멘션 기능

---

## 6. 참고 화면

현재 프론트엔드에 구현된 UI:
- 타임라인 형식의 피드 레이아웃
- 프로필 아바타 (이모지 또는 이미지)
- 게시물 내용 (최대 500자)
- 이미지 첨부 (선택사항)
- 좋아요/리트윗/댓글 카운트 및 버튼
- 작성 시간 표시 (상대 시간: "2시간 전")

---

## 문의사항
구현 중 궁금한 점이나 추가 요구사항이 있으면 언제든 연락주세요!
