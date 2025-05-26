import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../Context/User.context'

const Userauth = ({ children }) => {
  const { user } = useContext(UserContext) // Access user context
  const [loading, setLoading] = useState(true) // State to handle loading status
  const token = localStorage.getItem('token') // Retrieve token from local storage
  
  const navigate = useNavigate() // Hook for navigation

  useEffect(() => {
    
    if (user) {
      setLoading(false) // Set loading to false if user exists
    }

    if (!token) {
      navigate('/login') // Redirect to login if token is missing
    }

    if (!user) {
      navigate('/login') // Redirect to login if user is not available
    }
  }, []) // Empty dependency array means this runs only on mount

  if (loading) {
    return <div>Loading...</div> // Show loading message while checking authentication
  }

  return (
    <>
      {children} {/* Render children components if authentication passes */}
    </>
  )
}

export default Userauth
