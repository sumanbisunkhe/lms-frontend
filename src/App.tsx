import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/users/UserDashboard';
import BooksPage from './pages/users/BooksPage';
import ReservationPage from './pages/users/ReservationPage';
import MembershipPage from './pages/users/MembershipPage';
import RatingsPage from './pages/users/RecommendationPage';
import BorrowsPage from './pages/users/BorrowsPage';
import './App.css'
import RecommendationPage from './pages/users/RecommendationPage';

function App() {
  return (
    <Router>
      <div className="w-full h-full">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/books" element={<BooksPage />} />
          <Route path="/user/reservation" element={<ReservationPage />} />
          <Route path="/user/membership" element={<MembershipPage />} />
          <Route path="/user/recommendations" element={<RecommendationPage />} />
          <Route path="/user/borrows" element={<BorrowsPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App
