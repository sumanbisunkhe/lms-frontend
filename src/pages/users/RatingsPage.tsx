import React from 'react';
import UserHeader from '../../components/users/UserHeader';
import { Star } from 'lucide-react';

const RatingsPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Sample ratings data
  const yourRatings = [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      rating: 4,
      review: "A masterpiece of American literature. The prose is beautiful and the story is captivating.",
      date: "Aug 15, 2025"
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      rating: 5,
      review: "One of the most impactful books I've ever read. The characters are incredibly well-developed.",
      date: "Jul 28, 2025"
    }
  ];

  // Sample to-rate books
  const toRateBooks = [
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      returnDate: "Sep 18, 2025"
    },
    {
      id: 4,
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      returnDate: "Sep 20, 2025"
    }
  ];

  // Generate star rating component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation Tabs */}
      <UserHeader 
        username={user?.username || 'User'} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Book Ratings & Reviews</h2>
            
            {/* Books to Rate Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Books to Rate</h3>
              
              {toRateBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {toRateBooks.map(book => (
                    <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800">{book.title}</h4>
                      <p className="text-sm text-gray-500 mb-3">by {book.author}</p>
                      <p className="text-sm text-gray-500 mb-4">Returned on {book.returnDate}</p>
                      
                      <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
                        Rate this book
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You have no books waiting to be rated.</p>
              )}
            </div>
            
            {/* Your Ratings Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Ratings</h3>
              
              {yourRatings.length > 0 ? (
                <div className="space-y-6">
                  {yourRatings.map(review => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">{review.title}</h4>
                          <p className="text-sm text-gray-500">by {review.author}</p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{review.review}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Reviewed on {review.date}</span>
                        <div className="space-x-2">
                          <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                          <button className="text-xs text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You haven't rated any books yet.</p>
              )}
            </div>
            
            {/* Rating Statistics */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Rating Statistics</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{yourRatings.length}</p>
                  <p className="text-sm text-blue-600">Total Reviews</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {yourRatings.length > 0 
                      ? (yourRatings.reduce((sum, item) => sum + item.rating, 0) / yourRatings.length).toFixed(1) 
                      : "0.0"}
                  </p>
                  <p className="text-sm text-blue-600">Average Rating</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{toRateBooks.length}</p>
                  <p className="text-sm text-blue-600">Pending Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RatingsPage;