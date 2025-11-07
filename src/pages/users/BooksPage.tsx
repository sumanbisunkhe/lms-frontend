import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { showToast } from '../../utils/toast';
import UserHeader from '../../components/users/UserHeader';
import { Search, Filter, Book, ChevronLeft, ChevronRight, Loader2, AlertCircle, Calendar } from 'lucide-react';

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
  totalCopies: number | null;
  availableCopies: number | null;
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

interface BooksResponse {
  data: {
    content: BookData[];
    page: PageInfo;
  };
  message: string;
  status: number;
  success: boolean;
}

interface MembershipData {
  id: number;
  membershipType: string;
  membershipStatus: string;
  dateOfIssue: string;
  expiryDate: string;
  borrowingLimit: number;
  createdAt: string | null;
  updatedAt: string;
}

interface MembershipResponse {
  data: MembershipData;
  message: string;
  status: number;
  success: boolean;
}

interface ReservationResponse {
  data: {
    id: number;
    bookId: number;
    bookTitle: string;
    memberId: number;
    memberName: string;
    reservationDate: string;
    notificationDate: string | null;
    expiryDate: string | null;
    status: string;
  };
  message: string;
  status: number;
  success: boolean;
}

const BooksPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState('createdAt');
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [returnDate, setReturnDate] = useState('');
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [reservingBookId, setReservingBookId] = useState<number | null>(null);
  const [documentUrls, setDocumentUrls] = useState<Record<number, string>>({});

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fetchBooks = async (page: number = 1, query: string = '', sort: string = 'createdAt') => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure all parameters are valid
      const safePage = Math.max(1, Math.floor(Number(page)) || 1);
      const safePageSize = Math.max(1, Math.floor(Number(pageSize)) || 12);
      
      console.log('Fetching books with params:', { 
        originalPage: page, 
        safePage, 
        pageSize: safePageSize,
        query: query || '', 
        sort: sort || 'createdAt' 
      });
      
      const params = new URLSearchParams({
        page: safePage.toString(), // Send 1-based page directly
        size: safePageSize.toString(),
        sortBy: sort || 'createdAt',
        sortOrder: 'desc'
      });
      
      if (query.trim()) {
        params.append('query', query.trim());
      }
      
      const token = localStorage.getItem('authToken');
      const url = `http://localhost:8080/book?${params}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: BooksResponse = await response.json();
      
      if (result.success) {
        setBooks(result.data.content);
        setPageInfo(result.data.page);
      } else {
        throw new Error(result.message || 'Failed to fetch books');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
      setError(errorMessage);
      showToast.error(errorMessage);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembership = async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/membership/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        setMembership(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MembershipResponse = await response.json();
      
      if (result.success) {
        setMembership(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch membership:', err);
    }
  };

  const reserveBook = async (bookId: number) => {
    if (!membership) {
      showToast.error('No valid membership found');
      return;
    }

    setReservingBookId(bookId);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/reservation/book/${bookId}/member/${membership.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ReservationResponse = await response.json();
      
      if (result.success) {
        showToast.success('Book reserved successfully!');
      } else {
        throw new Error(result.message || 'Failed to reserve book');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve book';
      showToast.error(errorMessage);
    } finally {
      setReservingBookId(null);
    }
  };

  const handleBorrowConfirm = async () => {
    if (!selectedBookId || !selectedReturnDate) {
      const errorMessage = 'Please select a return date';
      setError(errorMessage);
      showToast.error(errorMessage);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const borrowData = {
        returnDate: selectedReturnDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        books: {
          id: selectedBookId
        },
        users: {
          id: user?.id || parseInt(user?.userId || '0')
        }
      };

      console.log('Borrowing book with data:', borrowData);

      const response = await fetch(`http://localhost:8080/borrow/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(borrowData)
      });
      
      if (response.ok) {
        setShowBorrowModal(false);
        setSelectedBookId(null);
        setReturnDate('');
        setSelectedReturnDate(null);
        setError(null); // Clear any previous errors
        showToast.success('Book borrowed successfully!');
        // Refresh books after successful borrow
        fetchBooks(currentPage, searchQuery, sortBy);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to borrow book');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to borrow book';
      setError(errorMessage);
      showToast.error(errorMessage);
    }
  };

  const handleBorrowCancel = () => {
    setShowBorrowModal(false);
    setSelectedBookId(null);
    setReturnDate('');
    setSelectedReturnDate(null);
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
    // Ensure we start with a valid page number
    const validPage = Math.max(1, currentPage);
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    } else {
      fetchBooks(validPage, searchQuery, sortBy);
    }
  }, [currentPage, sortBy]);

  useEffect(() => {
    fetchMembership();
  }, [currentPage, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks(1, searchQuery, sortBy);
  };

  const handleBorrowClick = (bookId: number) => {
    setSelectedBookId(bookId);
    setReturnDate('');
    setSelectedReturnDate(null);
    setShowBorrowModal(true);
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
          {/* Page Header */}
          <div className="mb-8">
            <p className="text-base text-gray-500 text-center">Discover and borrow books from our extensive collection</p>
          </div>

          {/* Premium Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-12 pr-28 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 font-medium"
                    placeholder="Search by title, author, or ISBN..."
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <Filter className="h-5 w-5 text-slate-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold text-gray-900 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="author">Author A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Info */}
          {pageInfo && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-600">
                Showing <span className="text-blue-600">{pageInfo.size * (pageInfo.number - 1) + 1} - {Math.min(pageInfo.size * pageInfo.number, pageInfo.totalElements)}</span> of <span className="text-blue-600">{pageInfo.totalElements}</span> books
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    fetchBooks(1, '', sortBy);
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-red-700 font-medium flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <Loader2 className="relative h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                </div>
                <span className="text-gray-700 font-semibold">Loading books...</span>
              </div>
            </div>
          )}

          {/* Premium Books Grid */}
          {!loading && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {books.map((book) => {
                const coverUrl = getCoverImageUrl(book);
                
                return (
                  <div key={book.id} className="group bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden hover:shadow-2xl transition-all duration-500">
                    {/* Book Cover */}
                    <div className="relative h-64 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden">
                      {/* Availability Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black shadow-lg ${
                          book.isAvailable && (book.availableCopies === null || book.availableCopies > 0)
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                          {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Available' : 'Unavailable'}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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
                              iconDiv.innerHTML = '<svg class="h-20 w-20 text-white drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z"></path></svg>';
                              parent.appendChild(iconDiv);
                            }
                          }}
                        />
                      ) : (
                        <Book className="h-20 w-20 text-white group-hover:scale-125 transition-transform duration-500 drop-shadow-2xl" />
                      )}
                    </div>
                    
                    {/* Book Details */}
                    <div className="p-5">
                      <h3 className="text-lg font-black text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{book.title}</h3>
                      <p className="text-sm text-gray-500 mb-1 font-medium">by {book.author}</p>
                      <p className="text-xs text-gray-400 mb-4">{book.publisher}</p>
                      
                      {/* Book Info */}
                      <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">Genre</span>
                          <span className="text-xs font-bold text-gray-900 bg-slate-100 px-2.5 py-1 rounded-lg">{book.genre}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">ISBN</span>
                          <span className="text-xs font-mono font-bold text-gray-700">{book.isbn}</span>
                        </div>
                        {book.totalCopies !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Copies</span>
                            <span className={`text-xs font-black ${book.availableCopies! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleBorrowClick(book.id)}
                          disabled={!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)}
                          className="w-full py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95"
                        >
                          {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Borrow Book' : 'Not Available'}
                        </button>
                        
                        {(!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)) && membership && (
                          <button
                            onClick={() => reserveBook(book.id)}
                            disabled={reservingBookId === book.id}
                            className="w-full py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95"
                          >
                            {reservingBookId === book.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Reserving...
                              </>
                            ) : (
                              'Reserve Book'
                            )}
                          </button>
                        )}
                        
                        {(!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)) && !membership && (
                          <p className="text-xs text-gray-500 text-center font-medium bg-gray-50 py-2 rounded-lg">
                            Membership required to reserve
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && books.length === 0 && !error && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                <Book className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No books found</h3>
              <p className="text-base text-gray-500 mb-6">Try adjusting your search criteria or filters</p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    fetchBooks(1, '', sortBy);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Premium Pagination */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center bg-white px-6 py-4 border-2 border-slate-200 rounded-2xl shadow-lg">
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-bold"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="px-2 text-gray-400 font-bold">...</span>
                    )}
                  </>
                )}

                {(() => {
                  const pages = [];
                  const totalPages = pageInfo.totalPages;
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, currentPage + 2);

                  if (currentPage <= 3) endPage = Math.min(5, totalPages);
                  if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                          i === currentPage
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}

                {currentPage < pageInfo.totalPages - 2 && (
                  <>
                    {currentPage < pageInfo.totalPages - 3 && (
                      <span className="px-2 text-gray-400 font-bold">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(pageInfo.totalPages)}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    >
                      {pageInfo.totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setCurrentPage(Math.min(pageInfo.totalPages, currentPage + 1))}
                  disabled={currentPage >= pageInfo.totalPages}
                  className="relative inline-flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-bold"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {/* Premium Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 relative overflow-hidden">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-8 py-6 relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>
              <div className="relative flex items-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-3">
                  <Book className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Borrow Book</h3>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-8">
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                  Please select your planned return date. Remember to return on time to avoid late fees and help other members access our collection.
                </p>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center text-sm font-black text-gray-900 mb-3">
                  <Calendar className="h-5 w-5 mr-2 text-orange-500" />
                  Return Date <span className="text-red-500 ml-1">*</span>
                </label>
                
                <div className="relative">
                  <DatePicker
                    selected={selectedReturnDate}
                    onChange={(date: Date | null) => setSelectedReturnDate(date)}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                    dateFormat="EEEE, MMMM dd, yyyy"
                    placeholderText="Click to select return date"
                    className="w-full px-5 py-4 text-gray-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-bold text-center hover:border-orange-300"
                    wrapperClassName="w-full"
                    todayButton="Select Today"
                    showPopperArrow={false}
                    popperClassName="!z-[10004]"
                    popperPlacement="bottom"
                    fixedHeight
                  />
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-800 flex items-center font-semibold">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Maximum borrowing period is 90 days from today
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t-2 border-gray-100">
                <button
                  onClick={handleBorrowCancel}
                  className="flex-1 px-6 py-3.5 text-sm font-black text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBorrowConfirm}
                  disabled={!selectedReturnDate}
                  className="flex-1 px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-xl hover:shadow-2xl disabled:shadow-none active:scale-95"
                >
                  Confirm Borrow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal container for DatePicker */}
      <div id="date-picker-portal"></div>
    </div>
  );
};

export default BooksPage;