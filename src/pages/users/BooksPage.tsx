import React, { useState, useEffect } from 'react';
import UserHeader from '../../components/users/UserHeader';
import { Search, Filter, Book, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

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
      const apiPage = safePage - 1; // API uses 0-based indexing (should be >= 0)
      
      console.log('Fetching books with params:', { 
        originalPage: page, 
        safePage, 
        apiPage, 
        pageSize: safePageSize,
        query: query || '', 
        sort: sort || 'createdAt' 
      });
      
      // Double-check that apiPage is never negative
      const finalApiPage = Math.max(1, apiPage);
      
      const params = new URLSearchParams({
        page: finalApiPage.toString(),
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
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks(1, searchQuery, sortBy);
  };

  const handleBorrowClick = (bookId: number) => {
    setSelectedBookId(bookId);
    setReturnDate('');
    setShowBorrowModal(true);
  };

  const handleBorrowConfirm = async () => {
    if (!selectedBookId || !returnDate) {
      setError('Please select a return date');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const borrowData = {
        returnDate: returnDate,
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
        // Refresh books after successful borrow
        fetchBooks(currentPage, searchQuery, sortBy);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to borrow book');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to borrow book');
    }
  };

  const handleBorrowCancel = () => {
    setShowBorrowModal(false);
    setSelectedBookId(null);
    setReturnDate('');
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
                Showing {pageInfo.size * pageInfo.number + 1} - {Math.min(pageInfo.size * (pageInfo.number + 1), pageInfo.totalElements)} of {pageInfo.totalElements} books
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
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
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center rounded-t-lg">
                    <Book className="h-16 w-16 text-white" />
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
                    
                    <button
                      onClick={() => handleBorrowClick(book.id)}
                      disabled={!book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)}
                      className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {book.isAvailable && (book.availableCopies === null || book.availableCopies > 0) ? 'Borrow Book' : 'Not Available'}
                    </button>
                  </div>
                </div>
              ))}
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Borrow Book</h3>
            <p className="text-sm text-gray-600 mb-6">
              Please select a return date for this book:
            </p>
            
            <div className="mb-6">
              <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-2">
                Return Date
              </label>
              <input
                type="date"
                id="returnDate"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Minimum date is today
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBorrowCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBorrowConfirm}
                disabled={!returnDate}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Confirm Borrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksPage;