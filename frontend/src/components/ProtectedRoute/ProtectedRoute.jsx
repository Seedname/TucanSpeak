import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCookie } from '../../helper/helper'

const ProtectedRoute = ({children}) => {
  const token = getCookie('token');
  const location = useLocation();

  if(!token) {
    return <Navigate to="/" state={{from: location}} replace/>
  }

  return children;
}

export default ProtectedRoute;