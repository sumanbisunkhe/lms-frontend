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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Navigation Tabs */}
      <UserHeader 
        username={user?.username || 'User'} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          {/* <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Recommendations for You</h1>
            <p className="mt-2 text-gray-600">Discover books tailored to your reading preferences</p>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Finding books you'll love...</span>
            </div>
          )}

          {/* Recommendations Summary */}
          {!loading && recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
                  <div className="text-sm text-gray-600">Total Recommendations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {recommendations.filter(book => book.isAvailable && book.availableCopies > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Available Now</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {recommendations.filter(book => book.isAvailable && book.availableCopies === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">All Borrowed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(recommendationsByGenre).length}
                  </div>
                  <div className="text-sm text-gray-600">Genres</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations by Genre */}
          {!loading && recommendations.length > 0 && (
            <div className="space-y-8">
              {Object.entries(recommendationsByGenre).map(([genre, books]) => (
                <div key={genre} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{genre}</h2>
                    <p className="text-sm text-gray-600 mt-1">{books.length} books recommended</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {books.map((book) => {
                        const availability = getAvailabilityStatus(book);
                        const IconComponent = availability.icon;
                        
                        return (
                          <div key={book.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                  {book.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">by {book.author}</p>
                                <p className="text-xs text-gray-500">{book.publisher}</p>
                              </div>
                              <div className="ml-3">
                                <Book className="h-8 w-8 text-blue-500" />
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>ISBN:</span>
                                <span className="font-medium">{book.isbn}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Total Copies:</span>
                                <span className="font-medium">{book.totalCopies}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Available:</span>
                                <span className={`font-medium ${
                                  book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {book.availableCopies} copies
                                </span>
                              </div>
                            </div>
                            
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${availability.color}`}>
                              <IconComponent className="w-3 h-3 mr-1" />
                              {availability.status}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Added {formatDate(book.createdAt)}
                              </p>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
              <p className="text-gray-600 mb-6">
                Start borrowing and rating books to get personalized recommendations!
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Borrow books from our collection</p>
                <p>• Rate and review books you've read</p>
                <p>• Get recommendations based on your preferences</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecommendationPage;