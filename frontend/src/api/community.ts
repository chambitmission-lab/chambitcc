import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_V1, refreshOnce } from '../config/api'

// Axios 인터셉터 - 401 시 토큰 갱신 후 1회 재시도.
// (기존에는 401 즉시 로그아웃해서, access token 만 만료돼도 refresh token 이
// 멀쩡한 사용자가 커뮤니티 첫 요청에서 강제 로그아웃되는 문제가 있었다.
// apiFetch 와 동일하게 갱신→재시도하고, 로그아웃 여부는 refreshAccessToken 내부
// 판정(리프레시 토큰 401/403 일 때만)에 맡긴다. 5xx·네트워크 장애는 토큰 보존.)
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined

    if (
      error.response?.status === 401 &&
      config &&
      !config._retried &&
      config.headers?.Authorization
    ) {
      config._retried = true
      const newToken = await refreshOnce()
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`
        return axios(config)
      }

      // 갱신 실패로 로그아웃된 경우(리프레시 토큰 무효)만 복귀 경로를 저장.
      // HashRouter 라우트는 hash에 있다 (#/rooms/3 → /rooms/3)
      if (!localStorage.getItem('refresh_token')) {
        const currentPath = window.location.hash
          ? window.location.hash.slice(1)
          : window.location.pathname + window.location.search
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('redirect_after_login', currentPath)
        }
      }
    }
    return Promise.reject(error)
  }
)

export interface Author {
  id: number
  name: string
  username: string
  avatar: string
}

export interface Post {
  id: number
  author: Author
  content: string
  image: string | null
  createdAt: string
  likes: number
  retweets: number
  replies: number
  isLiked: boolean
  isRetweeted: boolean
}

export interface PostsResponse {
  success: boolean
  data: {
    posts: Post[]
    pagination: {
      currentPage: number
      totalPages: number
      totalPosts: number
      hasNext: boolean
    }
  }
}

// 피드 목록 조회
export const getPosts = async (page = 1, limit = 10, sort = 'latest'): Promise<PostsResponse> => {
  const response = await axios.get(`${API_V1}/community/posts`, {
    params: { page, limit, sort }
  })
  return response.data
}

// 게시물 작성
export const createPost = async (content: string, image?: string) => {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(
    `${API_V1}/community/posts`,
    { content, image },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

// 좋아요 토글
export const toggleLike = async (postId: number) => {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(
    `${API_V1}/community/posts/${postId}/like`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

// 리트윗 토글
export const toggleRetweet = async (postId: number) => {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(
    `${API_V1}/community/posts/${postId}/retweet`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

// 댓글 목록 조회
export const getReplies = async (postId: number, page = 1, limit = 20) => {
  const response = await axios.get(`${API_V1}/community/posts/${postId}/replies`, {
    params: { page, limit }
  })
  return response.data
}

// 댓글 작성
export const createReply = async (postId: number, content: string) => {
  const token = localStorage.getItem('access_token')
  const response = await axios.post(
    `${API_V1}/community/posts/${postId}/replies`,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

// 게시물 삭제
export const deletePost = async (postId: number) => {
  const token = localStorage.getItem('access_token')
  const response = await axios.delete(`${API_V1}/community/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data
}
