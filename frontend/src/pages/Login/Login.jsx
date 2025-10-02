import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie, setCookie } from '../../utils/helper' // Make sure setCookie is imported

const Login = () => {

  const { url } = useContext(AppContext)
  const [currState, setCurrState] = useState("Login");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (getCookie('token')) {
      navigate('/home', {replace: true});
    }
  }, [navigate])

  const [data, setData] = useState({
    fullName: "", 
    email: "",
    password: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name // Fixed: was 'fullName', should be 'name'
    const value = event.target.value
    setData(data=>({...data, [name]:value}))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    
    try {
      if(currState === "Login") {
        const response = await axios.post(`${url}auth/login`, data);
        
        if (response?.data?.success) {
          // CRITICAL: Store the token from the response
          if (response.data.token) {
            console.log(response.data);
            setCookie('token', response.data.token, 7); // Store token for 7 days
          }
          
          // Navigate only once to the intended destination
          const from = location.state?.from?.pathname || '/home';
          navigate(from, {replace: true});
          
        } else {
          alert(response.data.message || 'Login failed');
        }
        return;
      } 

      // Registration flow
      const response = await axios.post(`${url}auth/register`, data);
      if (response?.data?.success) {
        navigate('/verify-wait', {state: {email: data.email }, replace: true});
      } else {
        alert(response.data.message || 'Registration failed');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Network error. Please try again.');
    }
  }

  return (
    <div className='absolute z-[1] w-full h-full grid bg-gradient-to-b	from-lime-300 to-lime-800'>
      <form onSubmit={onSubmit} className='place-self-center w-[max(23vw,330px)] text-[#808080] bg-white flex flex-col gap-6 px-6 py-[30px] rounded-lg text-sm '>
        <div className='flex justify-center items-center text-black text-3xl font-bold'>
          <h2>{currState}</h2>
        </div>
        <div className='flex flex-col gap-5'>
          {currState==="Login"?<></>:<input className='outline-none border border-solid border-[#c9c9c9] p-[10px] rounded-sm' type='text' placeholder='Full Name' name='fullName' onChange={onChangeHandler} value={data.fullName} required />}
          <input className='outline-none border border-solid border-[#c9c9c9] p-[10px] rounded-sm' type="email" placeholder='Email' name='email' onChange={onChangeHandler} value={data.email} required/>
          <input className='outline-none border border-solid border-[#c9c9c9] p-[10px] rounded-sm' type="password" placeholder='Password' name='password' onChange={onChangeHandler} value={data.password} required/>
        </div>
        <button type='submit' className='border-none p-[10px] rounded-sm text-white bg-lime-600 text-sm cursor-pointer'>{currState==="Sign Up"?"Create Account":"Login"}</button>
        <div className='flex items-start gap-2 -mt-[15px]'>
          <input className='mt-[5px] cursor-pointer' type="checkbox" required/>
          <p>By continuing, I agree to the Terms of Use & Privacy Policy.</p>
        </div>
        {currState==="Login"?<p>Create a new account? <span className='text-black font-medium cursor-pointer underline' onClick={()=>setCurrState("Sign Up")}>Click Here</span></p>:<p>Already have an account? <span className='text-black font-medium cursor-pointer underline' onClick={()=>setCurrState("Login")}>Login Here</span></p>}
      </form>
    </div>
  )
}

export default Login