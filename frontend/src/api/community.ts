import axios from 'axios'
import { API_V1 } from '../config/api'
import { logout } from '../utils/auth'

// Axios 인터셉터 설정 - 401 에러 자동 처리
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 현재 페이지 저장
      const currentPath = window.location.pathname + window.location.search
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirect_after_login', currentPath)
      }
      
      // 로그아웃 처리 (캐시 초기화 포함)
      logout()
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
