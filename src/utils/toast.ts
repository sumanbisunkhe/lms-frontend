import toast from 'react-hot-toast';

// Default toast options with 2-second duration and close button
const defaultToastOptions = {
  duration: 2000, // 2 seconds
  style: {
    background: '#fff',
    color: '#374151',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
    style: {
      border: '1px solid #10b981',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
    style: {
      border: '1px solid #ef4444',
    },
  },
};

// Custom toast utility functions for consistent messaging
export const showToast = {
  // Success messages - dismiss existing toasts of same type before showing new one
  success: (message: string) => {
    toast.remove();
    setTimeout(() => {
      return toast.success(message, defaultToastOptions);
    }, 50);
  },
  
  // Error messages - dismiss existing toasts of same type before showing new one
  error: (message: string) => {
    toast.remove();
    setTimeout(() => {
      return toast.error(message, defaultToastOptions);
    }, 50);
  },
  
  // Warning messages
  warning: (message: string) => {
    toast.remove();
    setTimeout(() => {
      return toast(message, {
        ...defaultToastOptions,
        icon: '⚠️',
        style: {
          ...defaultToastOptions.style,
          background: '#f59e0b',
          color: '#fff',
        },
      });
    }, 50);
  },
  
  // Info messages
  info: (message: string) => {
    toast.remove();
    setTimeout(() => {
      return toast(message, {
        ...defaultToastOptions,
        icon: 'ℹ️',
        style: {
          ...defaultToastOptions.style,
          background: '#3b82f6',
          color: '#fff',
        },
      });
    }, 50);
  },

  // Loading toast with promise
  loading: (message: string) => toast.loading(message, defaultToastOptions),
  
  // Dismiss all toasts
  dismiss: () => toast.remove(),

  // Promise-based toast for async operations
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => toast.promise(promise, messages, defaultToastOptions),

  // Common auth messages - updated to dismiss previous toasts
  auth: {
    loginSuccess: () => {
      toast.remove();
      setTimeout(() => {
        return toast.success('Login successful! Welcome back.', defaultToastOptions);
      }, 50);
    },
    loginError: (message?: string) => {
      toast.remove();
      setTimeout(() => {
        return toast.error(message || 'Login failed. Please try again.', defaultToastOptions);
      }, 50);
    },
    registerSuccess: () => {
      toast.remove();
      setTimeout(() => {
        return toast.success('Account created successfully!', defaultToastOptions);
      }, 50);
    },
    registerError: (message?: string) => {
      toast.remove();
      setTimeout(() => {
        return toast.error(message || 'Registration failed. Please try again.', defaultToastOptions);
      }, 50);
    },
    logoutSuccess: () => {
      toast.remove();
      setTimeout(() => {
        return toast.success('Logged out successfully.', defaultToastOptions);
      }, 50);
    },
    sessionExpired: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Session expired. Please log in again.', defaultToastOptions);
      }, 50);
    },
    invalidCredentials: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Invalid credentials. Please check your email and password.', defaultToastOptions);
      }, 50);
    },
    networkError: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Unable to connect to the server. Please check your internet connection.', defaultToastOptions);
      }, 50);
    },
    serverError: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Server error. Please try again later.', defaultToastOptions);
      }, 50);
    },
  },

  // Common validation messages
  validation: {
    required: (field: string) => {
      toast.remove();
      setTimeout(() => {
        return toast.error(`${field} is required.`, defaultToastOptions);
      }, 50);
    },
    invalidEmail: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Please enter a valid email address.', defaultToastOptions);
      }, 50);
    },
    passwordTooShort: (minLength: number = 6) => {
      toast.remove();
      setTimeout(() => {
        return toast.error(`Password must be at least ${minLength} characters long.`, defaultToastOptions);
      }, 50);
    },
    passwordMismatch: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Passwords do not match.', defaultToastOptions);
      }, 50);
    },
    invalidPhone: () => {
      toast.remove();
      setTimeout(() => {
        return toast.error('Please enter a valid phone number.', defaultToastOptions);
      }, 50);
    },
  },
};

export default showToast;