import React, {useState, useEffect, useContext} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const VerifyWait = () => {
  const {url} = useContext(AppContext);
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await axios.post(url+'auth/check-verification', {email});
        if (response.data.isVerified) {
          setIsVerified(true);
        }
      } catch (e) {
        console.error('Error check verification status:', e);
      }
    };

    const interval = setInterval(checkVerification, 5000);

    return () => clearInterval(interval);
  }, [email])

  useEffect(()=> {
    if (isVerified) {
      const timer = setTimeout(() => {
        navigate('/', {replace: true});
      }, 3000);
    }
  }, [isVerified, navigate])
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Please Verify Your Email</h1>
      <p className="text-gray-600 mb-4">
        We've sent a verification email to {email}. Please check your inbox and click the verification link.
      </p>
      <p className="text-gray-500">
        Once verified, you'll be redirected to the login page.
      </p>
    </div>
  );
};

export default VerifyWait