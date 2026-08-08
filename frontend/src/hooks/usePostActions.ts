import { useState } from 'react'
import { toggleLike, toggleRetweet, type Post } from '../api/community'
import type { ApiError } from '../types/queryCache'
import { showToast } from '../utils/toast'

interface UsePostActionsProps {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}

interface UsePostActionsReturn {
  handleLike: (postId: number) => Promise<void>
  handleRetweet: (postId: number) => Promise<void>
  isProcessing: boolean
}

/**
 * 게시물 액션(좋아요, 리트윗) 관리 훅
 */
export const usePostActions = ({ posts, setPosts }: UsePostActionsProps): UsePostActionsReturn => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleLike = async (postId: number) => {
    const currentPost = posts.find(p => p.id === postId)
    
    if (currentPost?.isLiked) {
      showToast('이미 좋아요를 누르셨습니다.', 'error')
      return
    }
    
    try {
      setIsProcessing(true)
      const response = await toggleLike(postId)
      
      if (response.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: true, likes: post.likes + 1 }
            : post
        ))
      }
    } catch (err) {
      console.error('좋아요 실패:', err)
      const e = err as ApiError

      if (e.response?.status === 401) {
        showToast('로그인이 필요합니다.', 'error')
      } else if (e.response?.status === 400) {
        const errorMsg = e.response?.data?.detail || e.response?.data?.message
        if (errorMsg?.includes('already liked')) {
          showToast('이미 좋아요를 누르셨습니다.', 'error')
          setPosts(posts.map(post => 
            post.id === postId ? { ...post, isLiked: true } : post
          ))
        } else if (errorMsg?.includes('not found')) {
          showToast('게시물을 찾을 수 없습니다.', 'error')
        } else {
          showToast('좋아요 처리 중 오류가 발생했습니다.', 'error')
        }
      } else {
        showToast('좋아요 처리 중 오류가 발생했습니다.', 'error')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetweet = async (postId: number) => {
    const currentPost = posts.find(p => p.id === postId)
    
    if (currentPost?.isRetweeted) {
      showToast('이미 리트윗하셨습니다.', 'error')
      return
    }
    
    try {
      setIsProcessing(true)
      const response = await toggleRetweet(postId)
      
      if (response.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isRetweeted: true, retweets: post.retweets + 1 }
            : post
        ))
      }
    } catch (err) {
      console.error('리트윗 실패:', err)
      const e = err as ApiError

      if (e.response?.status === 401) {
        showToast('로그인이 필요합니다.', 'error')
      } else if (e.response?.status === 400) {
        const errorMsg = e.response?.data?.detail || e.response?.data?.message
        if (errorMsg?.includes('already')) {
          showToast('이미 리트윗하셨습니다.', 'error')
          setPosts(posts.map(post => 
            post.id === postId ? { ...post, isRetweeted: true } : post
          ))
        } else if (errorMsg?.includes('not found')) {
          showToast('게시물을 찾을 수 없습니다.', 'error')
        } else {
          showToast('리트윗 처리 중 오류가 발생했습니다.', 'error')
        }
      } else {
        showToast('리트윗 처리 중 오류가 발생했습니다.', 'error')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    handleLike,
    handleRetweet,
    isProcessing
  }
}
