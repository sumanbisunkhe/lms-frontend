import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import UserHeader from '../../components/users/UserHeader';
import { Star, Book, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface BookRecommendation {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecommendationResponse {
  data: BookRecommendation[];
  message: string;
  status: number;
  success: boolean;
}

const RecommendationPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fetchRecommendations = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/recommendation/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RecommendationResponse = await response.json();
      
      if (result.success) {
        setRecommendations(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvailabilityStatus = (book: BookRecommendation) => {
    if (!book.isAvailable) {
      return {
        status: 'Not Available',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: AlertCircle
      };
    }
    if (book.availableCopies === 0) {
      return {
        status: 'All Borrowed',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Clock
      };
    }
    return {
      status: 'Available',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle
    };
  };

  // Group recommendations by genre
  const recommendationsByGenre = recommendations.reduce((acc, book) => {
    if (!acc[book.genre]) {
      acc[book.genre] = [];
    }
    acc[book.genre].push(book);
    return acc;
  }, {} as Record<string, BookRecommendation[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Navigation Tabs */}
      <UserHeader 
        username={user?.username || 'User'} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommendations for You</h1> */}
            <p className="text-gray-600 text-center">Discover books tailored to your reading preferences</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 flex items-center shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <span className="ml-3 text-red-700 flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 relative" />
              </div>
              <span className="mt-4 text-gray-600 font-medium">Finding books you'll love...</span>
            </div>
          )}

          {/* Recommendations Summary */}
          {!loading && recommendations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-3">
                    <Book className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{recommendations.length}</div>
                  <div className="text-sm text-gray-700 font-medium">Total Recommendations</div>
                </div>
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mb-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {recommendations.filter(book => book.isAvailable && book.availableCopies > 0).length}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">Available Now</div>
                </div>
                <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg mb-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {recommendations.filter(book => book.isAvailable && book.availableCopies === 0).length}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">All Borrowed</div>
                </div>
                <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mb-3">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {Object.keys(recommendationsByGenre).length}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">Genres</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations by Genre */}
          {!loading && recommendations.length > 0 && (
            <div className="space-y-6">
              {Object.entries(recommendationsByGenre).map(([genre, books]) => (
                <div key={genre} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <Star className="h-6 w-6 mr-3" />
                      {genre}
                    </h2>
                    <p className="text-indigo-100 text-sm mt-1">{books.length} books recommended for you</p>
                  </div>
                  
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {books.map((book) => {
                        const availability = getAvailabilityStatus(book);
                        const IconComponent = availability.icon;
                        
                        return (
                          <div key={book.id} className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-4 right-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${availability.color}`}>
                                <IconComponent className="w-3 h-3 mr-1" />
                                {availability.status}
                              </span>
                            </div>
                            
                            <div className="mb-4">
                              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
                                <Book className="h-6 w-6 text-white" />
                              </div>
                              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg leading-tight pr-20">
                                {book.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-1 font-medium">by {book.author}</p>
                              <p className="text-xs text-gray-500 mb-4">{book.publisher}</p>
                            </div>
                            
                            <div className="space-y-2 mb-4 bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">ISBN:</span>
                                <span className="font-bold text-gray-900">{book.isbn}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">Total Copies:</span>
                                <span className="font-bold text-gray-900">{book.totalCopies}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">Available:</span>
                                <span className={`font-bold ${
                                  book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {book.availableCopies} copies
                                </span>
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5 mr-1" />
                                <span>Added {formatDate(book.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Recommendations */}
          {!loading && recommendations.length === 0 && !error && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
                <Star className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Recommendations Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start borrowing and rating books to get personalized recommendations!
              </p>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-gray-900 mb-4">How to get recommendations:</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">Borrow books from our collection</span>
                  </div>
                  <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">Rate and review books you've read</span>
                  </div>
                  <div className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 font-medium">Get recommendations based on your preferences</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecommendationPage;