import { useState, useEffect } from 'react'
import { getPosts, type Post } from '../api/community'

interface UseCommunityFeedReturn {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 커뮤니티 피드 데이터 관리 훅
 */
export const useCommunityFeed = (): UseCommunityFeedReturn => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getPosts(1, 10, 'latest')
      if (response.success) {
        setPosts(response.data.posts)
      }
    } catch (err) {
      console.error('피드 로딩 실패:', err)
      setError('피드를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return {
    posts,
    setPosts,
    loading,
    error,
    refetch: fetchPosts
  }
}
