import { request, type UntypedJson } from './utils/request'

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
  return request<PostsResponse>('/community/posts', {
    query: { page, limit, sort },
    errorMessage: '피드를 불러오지 못했습니다',
  })
}

// 게시물 작성
export const createPost = async (content: string, image?: string) => {
  return request<UntypedJson>('/community/posts', {
    method: 'POST',
    auth: 'required',
    json: { content, image },
    errorMessage: '게시물 작성에 실패했습니다',
  })
}

// 좋아요 토글
export const toggleLike = async (postId: number) => {
  return request<UntypedJson>(`/community/posts/${postId}/like`, {
    method: 'POST',
    auth: 'required',
    json: {},
    errorMessage: '좋아요 처리에 실패했습니다',
  })
}

// 리트윗 토글
export const toggleRetweet = async (postId: number) => {
  return request<UntypedJson>(`/community/posts/${postId}/retweet`, {
    method: 'POST',
    auth: 'required',
    json: {},
    errorMessage: '리트윗 처리에 실패했습니다',
  })
}

// 댓글 목록 조회
export const getReplies = async (postId: number, page = 1, limit = 20) => {
  return request<UntypedJson>(`/community/posts/${postId}/replies`, {
    query: { page, limit },
    errorMessage: '댓글을 불러오지 못했습니다',
  })
}

// 댓글 작성
export const createReply = async (postId: number, content: string) => {
  return request<UntypedJson>(`/community/posts/${postId}/replies`, {
    method: 'POST',
    auth: 'required',
    json: { content },
    errorMessage: '댓글 작성에 실패했습니다',
  })
}

// 게시물 삭제
export const deletePost = async (postId: number) => {
  return request<UntypedJson>(`/community/posts/${postId}`, {
    method: 'DELETE',
    auth: 'required',
    errorMessage: '게시물 삭제에 실패했습니다',
  })
}
