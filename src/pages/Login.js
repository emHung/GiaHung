import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/apiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await apiService.login(formData);
        if (response.status === 'success') {
          localStorage.setItem('token', response.tokens.accessToken);
          toast.success('Đăng nhập thành công!');
          navigate('/', { replace: true });
        } else {
          toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
        }
      } else {
        const response = await apiService.register(formData);
        if (response.user && response.tokens) {
          toast.success('Đăng ký thành công!');
          setIsLogin(true);
        } else {
          toast.error('Đăng ký thất bại. Vui lòng thử lại!');
        }
      }
    } catch (error) {
      console.error(isLogin ? 'Login error:' : 'Signup error:', error);
      toast.error(isLogin ? 'Đăng nhập thất bại!' : 'Đăng ký thất bại!');
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="wrapper">
        <div className="form-box">
          <div className="button-box">
            <button 
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`input-group ${isLogin ? 'active' : ''}`}>
            <div className="input-field">
              <input 
                type="email" 
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
            <div className="input-field">
              <input 
                type="password" 
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
            {isLogin && (
              <div className="forgot-password">
                <a href="#">Forgot Password?</a>
              </div>
            )}
            <button type="submit" className="submit-btn">
              {isLogin ? 'Login' : 'Sign up'}
            </button>
          </form>

          <form onSubmit={handleSubmit} className={`input-group ${!isLogin ? 'active' : ''}`}>
            <div className="input-field">
              <input 
                type="text" 
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="input-field">
              <input 
                type="email" 
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
            <div className="input-field">
              <input 
                type="password" 
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
            <button type="submit" className="submit-btn">Sign up</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;