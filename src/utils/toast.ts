import toast from 'react-hot-toast';

// Custom toast utility functions for consistent messaging
export const showToast = {
  // Success messages
  success: (message: string) => toast.success(message),
  
  // Error messages
  error: (message: string) => toast.error(message),
  
  // Warning messages
  warning: (message: string) => toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  }),
  
  // Info messages
  info: (message: string) => toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  }),

  // Loading toast with promise
  loading: (message: string) => toast.loading(message),
  
  // Dismiss all toasts
  dismiss: () => toast.dismiss(),

  // Promise-based toast for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => toast.promise(promise, messages),

  // Common auth messages
  auth: {
    loginSuccess: () => toast.success('Login successful! Welcome back.'),
    loginError: (message?: string) => toast.error(message || 'Login failed. Please try again.'),
    registerSuccess: () => toast.success('Account created successfully!'),
    registerError: (message?: string) => toast.error(message || 'Registration failed. Please try again.'),
    logoutSuccess: () => toast.success('Logged out successfully.'),
    sessionExpired: () => toast.error('Session expired. Please log in again.'),
    invalidCredentials: () => toast.error('Invalid credentials. Please check your email and password.'),
    networkError: () => toast.error('Unable to connect to the server. Please check your internet connection.'),
    serverError: () => toast.error('Server error. Please try again later.'),
  },

  // Common validation messages
  validation: {
    required: (field: string) => toast.error(`${field} is required.`),
    invalidEmail: () => toast.error('Please enter a valid email address.'),
    passwordTooShort: (minLength: number = 6) => toast.error(`Password must be at least ${minLength} characters long.`),
    passwordMismatch: () => toast.error('Passwords do not match.'),
    invalidPhone: () => toast.error('Please enter a valid phone number.'),
  },
};

export default showToast;