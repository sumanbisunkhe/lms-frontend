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
            <h1 className="text-3xl font-bold text-gray-900">Browse Books</h1>
            <p className="mt-2 text-gray-600">Discover and borrow books from our collection</p>
          </div> */}

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 text-gray-900">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by title, author, or ISBN..."
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="author">Sort by Author</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Info */}
          {pageInfo && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {pageInfo.size * (pageInfo.number - 1) + 1} - {Math.min(pageInfo.size * pageInfo.number, pageInfo.totalElements)} of {pageInfo.totalElements} books
              </p>
            </div>
          )}

          {/* Error Message - Keep for critical errors */}
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
              <span className="ml-2 text-gray-600">Loading books...</span>
            </div>
          )}

          {/* Books Grid */}
          {!loading && books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => {
                const coverUrl = getCoverImageUrl(book);
                
                return (
                  <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                    <div className="h-64 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center rounded-t-lg overflow-hidden">
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
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                      <p className="text-xs text-gray-500 mb-3">{book.publisher}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Genre:</span>
                          <span className="font-medium">{book.genre}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>ISBN:</span>
                          <span className="font-medium">{book.isbn}</span>
                        </div>
                        {book.totalCopies !== null && (
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Available:</span>
                            <span className={`font-medium ${book.availableCopies! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {book.availableCopies}/{book.totalCopies} copies
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {/* Primary Action Button */}
                        <button
                          onClick={() => handleBorrowClick(book.id)}
                          disabled={!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)}
                          className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Borrow Book' : 'Not Available'}
                        </button>
                        
                        {/* Reserve Button - Show when book is not available */}
                        {(!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)) && membership && (
                          <button
                            onClick={() => reserveBook(book.id)}
                            disabled={reservingBookId === book.id}
                            className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                        
                        {/* No Membership Message */}
                        {(!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)) && !membership && (
                          <p className="text-xs text-gray-500 text-center">
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
            <div className="text-center py-12">
              <Book className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Numerical Pagination */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <nav className="flex items-center space-x-1" aria-label="Pagination">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Previous</span>
                </button>

                {/* First Page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* Page Numbers */}
                {(() => {
                  const pages = [];
                  const totalPages = pageInfo.totalPages;
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, currentPage + 2);

                  // Adjust range if we're near the beginning or end
                  if (currentPage <= 3) {
                    endPage = Math.min(5, totalPages);
                  }
                  if (currentPage >= totalPages - 2) {
                    startPage = Math.max(1, totalPages - 4);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          i === currentPage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}

                {/* Last Page */}
                {currentPage < pageInfo.totalPages - 2 && (
                  <>
                    {currentPage < pageInfo.totalPages - 3 && (
                      <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(pageInfo.totalPages)}
                      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      {pageInfo.totalPages}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={() => {
                    const newPage = Math.min(pageInfo.totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage >= pageInfo.totalPages}
                  className="relative inline-flex items-center px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 relative" style={{ zIndex: 10000, overflow: 'visible' }}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center">
                <Book className="h-6 w-6 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Borrow Book</h3>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6" style={{ overflow: 'visible' }}>
              <div className="mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Please select when you plan to return this book. Remember to return it on time to avoid late fees.
                </p>
              </div>
              
              <div className="mb-6" style={{ overflow: 'visible' }}>
                <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  Return Date <span className="text-red-500 ml-1">*</span>
                </label>
                
                <div className="relative" style={{ zIndex: 10003, overflow: 'visible' }}>
                  <DatePicker
                    selected={selectedReturnDate}
                    onChange={(date: Date | null) => setSelectedReturnDate(date)}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                    dateFormat="EEEE, MMMM dd, yyyy"
                    placeholderText="Click to select return date"
                    className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium text-center"
                    wrapperClassName="w-full"
                    todayButton="Select Today"
                    showPopperArrow={false}
                    popperClassName="!z-[10004] !important"
                    popperPlacement="bottom"
                    fixedHeight
                    onCalendarOpen={() => {
                      // Ensure calendar is above everything
                      const calendar = document.querySelector('.react-datepicker');
                      if (calendar) {
                        (calendar as HTMLElement).style.zIndex = '10005';
                      }
                    }}
                  />
                </div>
                
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Maximum borrowing period is 90 days from today
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleBorrowCancel}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBorrowConfirm}
                  disabled={!selectedReturnDate}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-lg hover:shadow-xl disabled:shadow-none"
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