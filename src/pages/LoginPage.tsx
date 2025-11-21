import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../utils/toast';
import LoginForm from '../components/LoginForm';
import authService from '../services/authService';
import type { LoginRequest, LoginResponse } from '../types/auth';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a success message from registration
    if (location.state?.message) {
      showToast.success(location.state.message);
      // Clear the location state immediately to prevent showing the message again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleLogin = async (credentials: LoginRequest) => {
    setLoading(true);

    try {
      const response: LoginResponse = await authService.login(credentials);
      
      if (response.success) {
        // Store the user data and token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Show success toast using the predefined method
        showToast.auth.loginSuccess();
        
        // Redirect based on user role immediately without delay
        if (response.data.roles && response.data.roles.includes("USER")) {
          navigate('/user/dashboard', { replace: true });
        } else if (response.data.roles && response.data.roles.includes("ADMIN")) {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        showToast.error(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex">
      {/* Left Side - Welcome Content */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-8 py-12">
        <div className="text-white max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4">Book Recommendation System</h3>
            {/* <p className="text-xl text-white/90 mb-8">
              Empower your learning journey with our comprehensive platform
            </p> */}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-white/90">Interactive Learning Materials</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-white/90">Progress Tracking</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-white/90">Expert Instructors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <LoginForm 
            onSubmit={handleLogin}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;