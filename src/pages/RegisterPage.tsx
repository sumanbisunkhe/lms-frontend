import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import RegisterForm from '../components/RegisterForm';
import authService from '../services/authService';
import type { RegisterRequest, RegisterResponse } from '../types/auth';

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (userData: RegisterRequest) => {
    setLoading(true);
    setSuccess(false);

    try {
      // Dismiss any existing toasts first
      showToast.dismiss();
      
      const response: RegisterResponse = await authService.register(userData);
      
      if (response.success && response.status === 201) {
        // Show only one success toast
        showToast.success('Account created successfully!');
        setSuccess(true);
        // Redirect to login page after showing success
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Please log in with your credentials.'
            }
          });
        }, 2000);
      } else {
        // Show only one error toast with a simplified message
        showToast.error('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Determine the most appropriate error message based on error type
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.status === 409) {
        errorMessage = 'Username or email already exists. Please try different credentials.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      // Show only one error toast
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="bg-white p-12 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Success!</h2>
            <p className="text-gray-600">
              Your account has been successfully created. You will be redirected to the login page shortly.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-gray-600">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center text-white px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Join LMS Today</h1>
            <p className="text-xl text-blue-100 mb-8">Start your learning journey with us</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Access Quality Courses</h3>
                <p className="text-blue-100 text-sm">Learn from expert instructors</p>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Earn Certificates</h3>
                <p className="text-blue-100 text-sm">Get recognized for your achievements</p>
              </div>
            </div>
            
            <div className="flex items-center text-left">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Join Community</h3>
                <p className="text-blue-100 text-sm">Connect with fellow learners</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-start justify-center px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <RegisterForm 
            onSubmit={handleRegister}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;