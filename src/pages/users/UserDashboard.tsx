import React, { useState, useEffect } from 'react';
import UserHeader from '../../components/users/UserHeader';
import { showToast } from '../../utils/toast';
import {
  Book,
  Calendar,
  Star,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface BookStats {
  totalBooks: number;
  availableBooks: number;
}

interface BookStatsResponse {
  data: BookStats;
  message: string;
  status: number;
  success: boolean;
}

interface MembershipResponse {
  data: number;
  message: string;
  status: number;
  success: boolean;
}

interface DocumentData {
  id: number;
  url: string | null;
  document: null;
  documentType: string;
  fileName: string;
  createdAt: string;
}

interface BookData {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
  isAvailable: boolean;
  documents: DocumentData[];
  createdAt: string;
  updatedAt: string;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface DiscoverBooksResponse {
  data: {
    content: BookData[];
    page: PageInfo;
  };
  message: string;
  status: number;
  success: boolean;
}

const UserDashboard: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [bookStats, setBookStats] = useState<BookStats | null>(null);
  const [totalMembership, setTotalMembership] = useState<number>(0);
  const [featuredBooks, setFeaturedBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentUrls, setDocumentUrls] = useState<Record<number, string>>({});

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Fetch book statistics
  const fetchBookStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8080/book/total-books', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BookStatsResponse = await response.json();

      if (result.success) {
        setBookStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch book statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch book statistics';
      showToast.error(errorMessage);
    }
  };

  // Fetch total membership
  const fetchTotalMembership = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8080/membership/total-membership', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MembershipResponse = await response.json();

      if (result.success) {
        setTotalMembership(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch membership data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch membership data';
      showToast.error(errorMessage);
    }
  };

  // Fetch featured books
  const fetchFeaturedBooks = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: '1',
        size: '6',
        query: '',
        sortBy: 'createdAt'
      });

      const response = await fetch(`http://localhost:8080/book/discover?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DiscoverBooksResponse = await response.json();

      if (result.success) {
        setFeaturedBooks(result.data.content.slice(0, 6)); // Take first 6 books
      } else {
        throw new Error(result.message || 'Failed to fetch featured books');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured books';
      showToast.error(errorMessage);
    }
  };

  const fetchDocumentUrl = async (documentId: number): Promise<string | null> => {
    // Check if we already have the URL cached
    if (documentUrls[documentId]) {
      return documentUrls[documentId];
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/api/document/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.url) {
        // Cache the URL
        setDocumentUrls(prev => ({
          ...prev,
          [documentId]: result.data.url
        }));
        return result.data.url;
      }
    } catch (err) {
      console.error('Failed to fetch document URL:', err);
    }

    return null;
  };

  const getCoverImageUrl = (book: BookData): string | null => {
    const coverDocument = book.documents?.find(doc => 
      doc.documentType.includes('cover') || doc.documentType === '"cover"'
    );
    
    if (coverDocument) {
      // If URL is already available in the document, use it
      if (coverDocument.url) {
        return coverDocument.url;
      }
      
      // Otherwise, check if we have it cached
      if (documentUrls[coverDocument.id]) {
        return documentUrls[coverDocument.id];
      }
      
      // Fetch the document URL asynchronously
      fetchDocumentUrl(coverDocument.id);
    }
    
    return null;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBookStats(),
        fetchTotalMembership(),
        fetchFeaturedBooks()
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  // Generate book color based on genre
  const getBookColor = (genre: string) => {
    const colors = {
      'Horror': 'from-red-500 to-red-600',
      'Classic Fiction': 'from-blue-500 to-indigo-600',
      'Epic Poetry': 'from-purple-500 to-purple-600',
      'Science Fiction': 'from-green-500 to-teal-600',
      'Dystopian': 'from-gray-600 to-gray-700',
      'Existential Fiction': 'from-orange-500 to-orange-600',
      'default': 'from-slate-500 to-slate-600'
    };
    return colors[genre as keyof typeof colors] || colors.default;
  };

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
          {/* User Welcome Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome to Your Library Portal</h2>
              <p className="text-gray-600 mb-6">
                Browse books, manage reservations, and track your borrowing activity all from one place.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-blue-900">Account Information</h3>
                    <div className="mt-2 text-sm text-blue-800">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>You are logged in as: <span className="font-semibold">{user?.username}</span></li>
                        <li>Your role: <span className="font-semibold">{user?.roles?.join(', ')}</span></li>
                        <li>Membership: <span className="font-semibold">Active</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading dashboard data...</span>
            </div>
          )}

          {/* Dashboard Quick Stats */}
          {!loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold text-gray-900">{bookStats?.totalBooks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Available Books</p>
                    <p className="text-2xl font-bold text-gray-900">{bookStats?.availableBooks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{totalMembership}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Library Activity</p>
                    <p className="text-2xl font-bold text-gray-900">Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Featured Books Section */}
          {!loading && featuredBooks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Featured Books</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBooks.map((book) => {
                  const coverUrl = getCoverImageUrl(book);
                  
                  return (
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-72 bg-gradient-to-r ${getBookColor(book.genre)} flex items-center justify-center overflow-hidden`}>
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`Cover of ${book.title}`}
                            className="w-full h-full object-contain bg-white"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const iconDiv = document.createElement('div');
                                iconDiv.className = 'flex items-center justify-center w-full h-full fallback-icon';
                                iconDiv.innerHTML = '<svg class="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"></path></svg>';
                                parent.appendChild(iconDiv);
                              }
                            }}
                          />
                        ) : (
                          <Book className="h-16 w-16 text-white" />
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {book.genre}
                          </span>
                          <span className="text-sm text-gray-500">
                            {book.availableCopies}/{book.totalCopies} available
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Publisher:</span> {book.publisher}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${book.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {book.isAvailable ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Available
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Unavailable
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className={`mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors ${book.isAvailable
                            ? 'text-white bg-blue-600 hover:bg-blue-700'
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            }`}
                          disabled={!book.isAvailable}
                        >
                          {book.isAvailable ? 'View Details' : 'Not Available'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => window.location.href = '/user/books'}
                className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Book className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Browse Books</span>
              </button>

              <button
                onClick={() => window.location.href = '/user/borrows'}
                className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">My Borrows</span>
              </button>

              <button
                onClick={() => window.location.href = '/user/reservation'}
                className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Clock className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-900">Reservations</span>
              </button>

              <button
                onClick={() => window.location.href = '/user/recommendations'}
                className="flex items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <Star className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-900">Recommendations</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;