import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login/Login'
import Home from './pages/Home/Home'
import Flight from './pages/Flight/Flight'
import Talk from './pages/Talk/Talk'
import Translate from './pages/Translate/Translate'
import VerifyWait from './pages/VerifyWait/VerifyWait'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { getCookie } from './helper/helper'
import { useTranslation } from "react-i18next";

const App = () => {
  const {t, i18n} = useTranslation();

  useEffect(() => {
    let language = getCookie("languagePreference") ?? "en";
    i18n.changeLanguage(language);
  }, []);

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
        {/* We remove the /draw route from here */}
        <Route path='/talk' element={<Talk/>} />
        <Route path='/translate' element={<Translate/>} />
      </Routes>
    </div>
  )
}

export default App
