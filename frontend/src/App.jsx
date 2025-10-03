import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Flight from './pages/Flight/Flight'
import Talk from './pages/Talk/Talk'
import Translate from './pages/Translate/Translate'
import VerifyWait from './pages/VerifyWait/VerifyWait'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { getCookie, getCookieExp } from './utils/helper'
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';

const App = () => {
  const {t, i18n} = useTranslation();
  const navigate = useNavigate();
  const token = getCookie('token');

  useEffect(() => {
    let language = getCookie("languagePreference") ?? "en";
    i18n.changeLanguage(language);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/', {replace: true});
    }

    if (token) {
      const expiration = getCookieExp(token);

      if (!expiration || expiration < new Date()) {
        document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
        navigate('/', {replace: true});
      }
    }
  }, [navigate, token])

  return (
    <div>
      <Routes>
        <Route path='/' element={<Login/>} />
        <Route path='verify-wait' element={<VerifyWait/>} />
        <Route
          path='/home' 
          element={
            <ProtectedRoute>
              <Home/>
            </ProtectedRoute>
          }/>
        <Route path='/flight' element={<Flight/>} />
        <Route path='/talk' element={<Talk/>} />
        <Route path='/translate' element={<Translate/>} />
      </Routes>
    </div>
  )
}

export default App
