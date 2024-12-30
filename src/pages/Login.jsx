import React, { useState } from 'react';
import { apiService } from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css'; // Thêm file CSS nếu cần

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slideAnimation, setSlideAnimation] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      if (isLogin) {
        const response = await apiService.login(formData);
        console.log('Login response:', response); // Debug response
  
        if (response.status === 'success') {
          // Lưu token
          localStorage.setItem('token', response.tokens.accessToken);
          
          // Lưu thông tin user
          if (response.user) {
            localStorage.setItem('userName', response.user.name);
            localStorage.setItem('userRole', response.user.role);
            console.log('Saved user role:', response.user.role); // Debug role
          }
  
          navigate('/', { 
            replace: true,
            state: { showToast: true }
          });
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
        console.error('Login error:', error);
        toast.error('Đăng nhập thất bại!');
      } finally {
        setLoading(false);
      }
  };

  const handleToggle = (isLoginMode) => {
    setSlideAnimation(!isLoginMode);
    setIsLogin(isLoginMode);
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box">
          <h2 className={`text-3xl font-bold text-center mb-6 title-text ${slideAnimation ? 'slide' : ''}`}>
            {isLogin ? 'Login Form' : 'Signup Form'}
          </h2>
          
          <div className="button-box">
            <div id="btn"></div>
            <button 
              type="button" 
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => handleToggle(true)}
            >
              Login
            </button>
            <button 
              type="button" 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => handleToggle(false)}
            >
              Signup
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`input-group ${slideAnimation ? 'slide' : ''}`}>
            {error && (
              <div className="text-red-500 text-sm text-center mb-4">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="input-field">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="input-field">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-field">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forgot-password">
              <a href="#" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign up')}
            </button>
          </form>

          <div className="register-link">
            <p>
              {isLogin ? "Not a member? " : "Already have an account? "}
              <button
                onClick={() => handleToggle(!isLogin)}
                className="text-blue-600 hover:underline"
              >
                {isLogin ? "Signup now" : "Login now"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;