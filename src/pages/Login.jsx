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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return; // Prevent double submission
    
    setIsProcessing(true);
    setProcessingMessage(isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...');

    try {
      if (isLogin) {
        const response = await apiService.login(formData);
        if (response.status === 'success') {
          localStorage.setItem('token', response.tokens.accessToken);
          if (response.user) {
            localStorage.setItem('userName', response.user.name);
            localStorage.setItem('userRole', response.user.role);
          }
          navigate('/', { replace: true, state: { showToast: true } });
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
      console.error('Error:', error);
      toast.error(isLogin ? 'Đăng nhập thất bại!' : 'Đăng ký thất bại!');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
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
              disabled={isProcessing}
              className={`
                w-full py-3 mt-4 
                bg-blue-600 hover:bg-blue-700 
                text-white font-medium rounded-lg
                transition-all duration-200
                flex items-center justify-center
                ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
              )}
            </button>
          </form>

          <div className="register-link">
            <p>
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button
                onClick={() => !isProcessing && handleToggle(!isLogin)}
                className={`text-blue-600 hover:underline ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isProcessing}
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;