import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {

  const {url, setToken} = useContext(AppContext)
  const [currState, setCurrState] = useState("Login");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home', {replace: true});
    }
  }, [navigate])

  const [data, setData] = useState({
    fullName: "", 
    email: "",
    password: ""
  })

  const onChangeHandler = (event) => {
    const fullName = event.target.name
    const value = event.target.value
    setData(data=>({...data, [fullName]:value}))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    let newUrl = url;
    if(currState==="Login") {
      newUrl += "auth/login"
      try {
        const response = await axios.post(newUrl, data);
        if (response.data.token) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          const from = location.state?.from?.pathname || '/home';
          navigate(from, {replace: true});
          navigate("/home");
        } else {
          alert(response.data.message)
        }
      } catch (e) {
        if (e.response && e.response.status === 400 ) {
          alert(e.response.data.message);
        } else {
          alert("An error occured. Please try again.");
        }
      }
    } else {
      newUrl += "auth/register"
      try {
        const response = await axios.post(newUrl, data);
        if (response.data.success) {
          navigate('/verify-wait', {state: {email: data.email }, replace: true});
        } else {
          alert(response.data.message);
        }
      } catch (e) {
        alert('Registration failed. Please try again.')
      }
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