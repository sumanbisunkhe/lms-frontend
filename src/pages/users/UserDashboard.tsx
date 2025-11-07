import React, { useState, useEffect } from 'react';
import UserHeader from '../../components/users/UserHeader';
import { showToast } from '../../utils/toast';
import {
  Book,
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  TrendingUp,
  Loader2,
  ArrowRight,
  Sparkles
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
      'Horror': 'from-red-500 via-red-600 to-red-700',
      'Classic Fiction': 'from-blue-500 via-blue-600 to-indigo-700',
      'Epic Poetry': 'from-purple-500 via-purple-600 to-indigo-600',
      'Science Fiction': 'from-green-500 via-teal-600 to-cyan-600',
      'Dystopian': 'from-gray-600 via-gray-700 to-slate-800',
      'Existential Fiction': 'from-orange-500 via-orange-600 to-red-600',
      'default': 'from-slate-500 via-slate-600 to-slate-700'
    };
    return colors[genre as keyof typeof colors] || colors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header with Navigation Tabs */}
      <UserHeader
        username={user?.username || 'User'}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Welcome Section */}
          <div className="mb-10">
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/10 rounded-full mix-blend-overlay filter blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
              
              <div className="relative px-8 py-12">
                <div className="flex items-start justify-between flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 mb-4 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                      <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                      <span className="text-sm font-bold text-white">Welcome back!</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                      Hello, <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">{user?.username || 'User'}</span>
                    </h1>
                    <p className="text-blue-50 text-lg max-w-2xl mb-8 leading-relaxed">
                      Discover new books, manage your reading list, and explore your library journey all in one place. Your next great read awaits!
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="group bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-5 py-3 hover:bg-white/30 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          <span className="text-sm font-bold text-white">Active Member</span>
                        </div>
                      </div>
                      <div className="group bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-5 py-3 hover:bg-white/30 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-300" />
                          <span className="text-sm font-bold text-white capitalize">
                            {user?.roles?.[0] || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                      <div className="relative w-40 h-40 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-300">
                        <Book className="h-20 w-20 text-white group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <Loader2 className="relative h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                </div>
                <span className="text-gray-700 font-semibold">Loading your dashboard...</span>
              </div>
            </div>
          )}

          {/* Ultimate Premium Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
              {/* Total Books Card */}
              <div className="group relative bg-white rounded-3xl shadow-lg border border-slate-200/60 p-7 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Book className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors duration-300">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-2">Total Books</p>
                  <p className="text-4xl font-black text-gray-900 mb-2">{bookStats?.totalBooks || 0}</p>
                  <p className="text-xs text-gray-400 font-medium">In library collection</p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>

              {/* Available Books Card */}
              <div className="group relative bg-white rounded-3xl shadow-lg border border-slate-200/60 p-7 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors duration-300">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-2">Available Books</p>
                  <p className="text-4xl font-black text-gray-900 mb-2">{bookStats?.availableBooks || 0}</p>
                  <p className="text-xs text-gray-400 font-medium">Ready to borrow</p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>

              {/* Total Members Card */}
              <div className="group relative bg-white rounded-3xl shadow-lg border border-slate-200/60 p-7 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-2">Total Members</p>
                  <p className="text-4xl font-black text-gray-900 mb-2">{totalMembership}</p>
                  <p className="text-xs text-gray-400 font-medium">Active readers</p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>

              {/* Status Card */}
              <div className="group relative bg-white rounded-3xl shadow-lg border border-slate-200/60 p-7 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors duration-300">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 mb-2">Your Status</p>
                  <p className="text-4xl font-black text-gray-900 mb-2">Active</p>
                  <p className="text-xs text-gray-400 font-medium">Premium member</p>
                  <div className="mt-4 h-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
              </div>
            </div>
          )}

          {/* Featured Books Section */}
          {!loading && featuredBooks.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Featured Books</h2>
                  <p className="text-base text-gray-500">Discover our handpicked collection just for you</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/user/books'}
                  className="group flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700">View All Books</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBooks.map((book) => {
                  const coverUrl = getCoverImageUrl(book);
                  
                  return (
                    <div key={book.id} className="group relative bg-white rounded-3xl shadow-lg border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-500">
                      {/* Book Cover */}
                      <div className={`relative h-72 bg-gradient-to-br ${getBookColor(book.genre)} flex items-center justify-center overflow-hidden`}>
                        {/* Floating Genre Badge */}
                        <div className="absolute top-5 left-5 z-10">
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-black bg-white/95 backdrop-blur-md text-gray-900 shadow-xl border border-white/20">
                            {book.genre}
                          </span>
                        </div>
                        
                        {/* Availability Badge */}
                        <div className="absolute top-5 right-5 z-10">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xl ${
                            book.isAvailable
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            <div className={`w-2 h-2 rounded-full bg-white animate-pulse shadow-lg`}></div>
                            {book.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={`Cover of ${book.title}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const iconDiv = document.createElement('div');
                                iconDiv.className = 'flex items-center justify-center w-full h-full fallback-icon';
                                iconDiv.innerHTML = '<svg class="h-24 w-24 text-white drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"></path></svg>';
                                parent.appendChild(iconDiv);
                              }
                            }}
                          />
                        ) : (
                          <Book className="h-24 w-24 text-white group-hover:scale-125 transition-transform duration-500 drop-shadow-2xl" />
                        )}
                      </div>
                      
                      {/* Book Details */}
                      <div className="p-7">
                        <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-5 font-medium">by {book.author}</p>
                        
                        <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
                          <div className="text-xs text-gray-500">
                            <span className="font-bold text-gray-700">{book.publisher}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5 text-slate-600" />
                            <span className="text-xs font-black text-gray-700">
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          className={`w-full inline-flex justify-center items-center gap-2.5 px-5 py-3.5 text-sm font-black rounded-2xl transition-all duration-300 ${
                            book.isAvailable
                              ? 'text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 active:scale-95 hover:-translate-y-0.5'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                          disabled={!book.isAvailable}
                        >
                          {book.isAvailable ? (
                            <>
                              <span>View Details</span>
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              <span>Not Available</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ultimate Quick Actions Grid */}
          <div className="relative bg-white rounded-3xl shadow-lg border border-slate-200/60 p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Quick Actions</h3>
                <p className="text-base text-gray-500">Navigate to your favorite sections with ease</p>
              </div>
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => window.location.href = '/user/books'}
                  className="group relative flex items-center gap-5 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 hover:from-blue-100 hover:via-indigo-100 hover:to-blue-100 rounded-2xl transition-all duration-500 border-2 border-blue-200/50 hover:border-blue-400 hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="relative text-left">
                    <p className="text-sm font-black text-gray-900 mb-0.5">Browse Books</p>
                    <p className="text-xs text-gray-500 font-semibold">Explore collection</p>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/user/borrows'}
                  className="group relative flex items-center gap-5 p-6 bg-gradient-to-br from-green-50 via-teal-50 to-green-50 hover:from-green-100 hover:via-teal-100 hover:to-green-100 rounded-2xl transition-all duration-500 border-2 border-green-200/50 hover:border-green-400 hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="relative text-left">
                    <p className="text-sm font-black text-gray-900 mb-0.5">My Borrows</p>
                    <p className="text-xs text-gray-500 font-semibold">Track history</p>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/user/reservation'}
                  className="group relative flex items-center gap-5 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 hover:from-purple-100 hover:via-pink-100 hover:to-purple-100 rounded-2xl transition-all duration-500 border-2 border-purple-200/50 hover:border-purple-400 hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="relative text-left">
                    <p className="text-sm font-black text-gray-900 mb-0.5">Reservations</p>
                    <p className="text-xs text-gray-500 font-semibold">Manage queue</p>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/user/recommendations'}
                  className="group relative flex items-center gap-5 p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 hover:from-yellow-100 hover:via-orange-100 hover:to-yellow-100 rounded-2xl transition-all duration-500 border-2 border-yellow-200/50 hover:border-yellow-400 hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="relative text-left">
                    <p className="text-sm font-black text-gray-900 mb-0.5">Recommendations</p>
                    <p className="text-xs text-gray-500 font-semibold">For you</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;