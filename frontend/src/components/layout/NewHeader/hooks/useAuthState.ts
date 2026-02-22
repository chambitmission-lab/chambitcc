import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isAdmin } from '../../../../utils/auth'

export const useAuthState = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
    setIsAdminUser(isAdmin())
  }, [location])

  return {
    isLoggedIn,
    isAdminUser,
    setIsLoggedIn,
    setIsAdminUser
  }
}
