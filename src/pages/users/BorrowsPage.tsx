import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import UserHeader from '../../components/users/UserHeader';
import { Calendar, CheckCircle, XCircle, AlertCircle, Book, Loader2, ChevronLeft, ChevronRight, RotateCcw, Eye, Star, HandCoins } from 'lucide-react';
import { paymentService } from '../../services/paymentService';

interface BookDetails {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  genre: string;
}

interface UserDetails {
  id: number;
  fullName: string;
  phoneNumber: string;
  address: string;
  username: string;
}

interface BorrowDetailData {
  id: number | null;
  borrowDate: string;
  returnDate: string | null;
  books: BookDetails;
  users: UserDetails;
  dueDate: string;
  isReturned: boolean;
  fineAmount: number | null;
}

interface BorrowDetailResponse {
  data: BorrowDetailData;
  message: string;
  status: number;
  success: boolean;
}

interface BorrowData {
  id: number;
  borrowDate: string;
  returnDate: string | null;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  userName: string;
  dueDate: string;
  isReturned: boolean;
  fineAmount: number | null;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface BorrowsResponse {
  data: {
    content: BorrowData[];
    page: PageInfo;
  };
  message: string;
  status: number;
  success: boolean;
}

interface RatingRequest {
  rating: number;
  review: string;
}

interface RatingResponse {
  data: any;
  message: string;
  status: number;
  success: boolean;
}

const BorrowsPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [borrows, setBorrows] = useState<BorrowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [returningBookId, setReturningBookId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowDetailData | null>(null);
  const [currentBorrowId, setCurrentBorrowId] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBookForRating, setSelectedBookForRating] = useState<BorrowData | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [payingBorrowId, setPayingBorrowId] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fetchBorrows = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const safePage = Math.max(1, Math.floor(Number(page)) || 1);

      const params = new URLSearchParams({
        page: safePage.toString(), 
        size: pageSize.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const token = localStorage.getItem('authToken');
      const url = `http://localhost:8080/borrow?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BorrowsResponse = await response.json();

      if (result.success) {
        setBorrows(result.data.content);
        setPageInfo(result.data.page);
      } else {
        throw new Error(result.message || 'Failed to fetch borrows');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch borrows';
      setError(errorMessage);
      showToast.error(errorMessage);
      setBorrows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows(currentPage);
  }, [currentPage]);

  const getBorrowById = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/borrow/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: BorrowDetailResponse = await response.json();
      
      if (result.success) {
        setSelectedBorrow(result.data);
        setCurrentBorrowId(id);
        setShowDetailModal(true);
      } else {
        throw new Error(result.message || 'Failed to fetch borrow details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch borrow details';
      showToast.error(errorMessage);
    }
  };

  const returnBook = async (id: number) => {
    setReturningBookId(id);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/borrow/return/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        showToast.success('Book returned successfully!');
        fetchBorrows(currentPage);
      } else {
        throw new Error(result.message || 'Failed to return book');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to return book';
      showToast.error(errorMessage);
    } finally {
      setReturningBookId(null);
    }
  };

  const submitRating = async () => {
    if (!selectedBookForRating || rating === 0) {
      showToast.error('Please select a rating');
      return;
    }

    setSubmittingRating(true);

    try {
      const token = localStorage.getItem('authToken');
      const ratingData: RatingRequest = {
        rating,
        review: review.trim()
      };

      const response = await fetch(`http://localhost:8080/rating/book/${selectedBookForRating.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RatingResponse = await response.json();
      
      if (result.success) {
        showToast.success('Rating submitted successfully!');
        setShowRatingModal(false);
        setSelectedBookForRating(null);
        setRating(0);
        setHoverRating(0);
        setReview('');
      } else {
        throw new Error(result.message || 'Failed to submit rating');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      showToast.error(errorMessage);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleViewDetails = (borrowId: number) => {
    getBorrowById(borrowId);
  };

  const handleReturnBook = (borrowId: number) => {
    returnBook(borrowId);
  };

  const handleRateBook = (borrow: BorrowData) => {
    setSelectedBookForRating(borrow);
    setRating(0);
    setHoverRating(0);
    setReview('');
    setShowRatingModal(true);
  };

  const handlePayFine = async (borrowId: number, fineAmount: number, bookTitle: string) => {
    if (fineAmount <= 0) {
      showToast.error('No fine amount to pay');
      return;
    }

    if (!window.confirm(`Pay fine of $${fineAmount} for "${bookTitle}"?`)) {
      return;
    }

    setPayingBorrowId(borrowId);

    try {
      const result = await paymentService.initiatePayment(borrowId);
      
      if (result.success && result.data.payment_url) {
        showToast.success('Redirecting to payment gateway...');
        // Redirect to Khalti payment page
        window.location.href = result.data.payment_url;
      } else {
        throw new Error(result.message || 'Failed to initiate payment');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      showToast.error(errorMessage);
    } finally {
      setPayingBorrowId(null);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedBorrow(null);
    setCurrentBorrowId(null);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedBookForRating(null);
    setRating(0);
    setHoverRating(0);
    setReview('');
  };

  // Calculate days remaining or overdue
  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (dueDate: string, isReturned: boolean) => {
    if (isReturned) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return today > due;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Separate current borrows and history
  const currentBorrows = borrows.filter(borrow => !borrow.isReturned);
  const borrowHistory = borrows.filter(borrow => borrow.isReturned);

  // Calculate statistics
  const overdueCount = currentBorrows.filter(borrow => isOverdue(borrow.dueDate, borrow.isReturned)).length;
  const onTimeReturns = borrowHistory.filter(borrow => borrow.fineAmount === null || borrow.fineAmount === 0).length;

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
            <h1 className="text-3xl font-bold text-gray-900">My Borrowed Books</h1>
            <p className="mt-2 text-gray-600">Track your current borrows and borrowing history</p>
          </div> */}

          {/* Borrowing Summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Currently Borrowed</p>
                  <p className="text-2xl font-bold text-gray-900">{currentBorrows.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">On-Time Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{onTimeReturns}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Overdue Books</p>
                  <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

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
              <span className="ml-2 text-gray-600">Loading borrowed books...</span>
            </div>
          )}

          {/* Current Borrows Section */}
          {!loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Currently Borrowed Books</h2>
              </div>
              
              <div className="overflow-x-auto">
                {currentBorrows.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Book Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Borrow Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fine Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentBorrows.map(borrow => {
                        const daysRemaining = calculateDaysRemaining(borrow.dueDate);
                        const isBookOverdue = isOverdue(borrow.dueDate, borrow.isReturned);
                        
                        return (
                          <tr key={borrow.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{borrow.title}</div>
                                <div className="text-sm text-gray-500">by {borrow.author}</div>
                                <div className="text-xs text-gray-400">{borrow.publisher} • ISBN: {borrow.isbn}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(borrow.borrowDate)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(borrow.dueDate)}
                            </td>
                            <td className="px-6 py-4">
                              {isBookOverdue ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Overdue ({Math.abs(daysRemaining)} days)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {daysRemaining} days left
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {borrow.fineAmount ? `$${borrow.fineAmount}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewDetails(borrow.id)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReturnBook(borrow.id)}
                                  disabled={returningBookId === borrow.id}
                                  className="text-green-600 hover:text-green-900 flex items-center disabled:opacity-50"
                                  title="Return Book"
                                >
                                  
                                  {returningBookId === borrow.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-4 h-4" />
                                  )}
                                </button>
                                {borrow.fineAmount && borrow.fineAmount > 0 && (
                                  <button
                                    onClick={() => handlePayFine(borrow.id, borrow.fineAmount!, borrow.title)}
                                    disabled={payingBorrowId === borrow.id}
                                    className="text-yellow-600 hover:text-yellow-900 flex items-center disabled:opacity-50"
                                    title="Pay Fine"
                                  >
                                    {payingBorrowId === borrow.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <HandCoins className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Book className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowed books</h3>
                    <p className="mt-1 text-sm text-gray-500">You don't have any books currently borrowed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Borrowing History Section */}
          {!loading && borrowHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Borrowing History</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrow Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowHistory.map(borrow => (
                      <tr key={borrow.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{borrow.title}</div>
                            <div className="text-sm text-gray-500">by {borrow.author}</div>
                            <div className="text-xs text-gray-400">{borrow.publisher}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(borrow.borrowDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {borrow.returnDate ? formatDate(borrow.returnDate) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {borrow.fineAmount && borrow.fineAmount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late - Fine: ${borrow.fineAmount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Returned on time
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRateBook(borrow)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center"
                              title="Rate Book"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            {borrow.fineAmount && borrow.fineAmount > 0 && (
                              <button
                                onClick={() => handlePayFine(borrow.id, borrow.fineAmount!, borrow.title)}
                                disabled={payingBorrowId === borrow.id}
                                className="text-green-600 hover:text-green-900 flex items-center disabled:opacity-50"
                                title="Pay Fine"
                              >
                                {payingBorrowId === borrow.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <HandCoins className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center bg-white px-4 py-3 border border-gray-200 rounded-lg mt-8">
              <nav className="flex items-center space-x-1" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers logic similar to BooksPage */}
                {(() => {
                  const pages = [];
                  const totalPages = pageInfo.totalPages;
                  let startPage = Math.max(1, currentPage - 2);
                  let endPage = Math.min(totalPages, currentPage + 2);

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

                <button
                  onClick={() => setCurrentPage(Math.min(pageInfo.totalPages, currentPage + 1))}
                  disabled={currentPage >= pageInfo.totalPages}
                  className="relative inline-flex items-center px-2 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      {/* Borrow Detail Modal */}
      {showDetailModal && selectedBorrow && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-100 relative max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Book className="h-5 w-5 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">Borrow Details</h3>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Book Information */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Book Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Title</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.books.title}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Author</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.books.author}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Publisher</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.books.publisher}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">ISBN</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.books.isbn}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Genre</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.books.genre}</p>
                    </div>
                  </div>
                </div>

                {/* Borrow Information */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Borrow Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Borrow Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBorrow.borrowDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Due Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedBorrow.dueDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Return Date</label>
                      <p className="text-sm text-gray-900">
                        {selectedBorrow.returnDate ? formatDate(selectedBorrow.returnDate) : 'Not returned yet'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        {selectedBorrow.isReturned ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Returned
                          </span>
                        ) : isOverdue(selectedBorrow.dueDate, selectedBorrow.isReturned) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Calendar className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Fine Amount</label>
                      <p className="text-sm text-gray-900">
                        {selectedBorrow.fineAmount !== null && selectedBorrow.fineAmount > 0 
                          ? `$${selectedBorrow.fineAmount.toFixed(2)}` 
                          : 'No fine'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Borrower Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Full Name</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.users.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Username</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.users.username}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Phone Number</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.users.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Address</label>
                      <p className="text-sm text-gray-900">{selectedBorrow.users.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!selectedBorrow.isReturned && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (currentBorrowId) {
                        handleReturnBook(currentBorrowId);
                        closeDetailModal();
                      }
                    }}
                    disabled={!currentBorrowId || returningBookId === currentBorrowId}
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {returningBookId === currentBorrowId ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Return Book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBookForRating && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-white mr-2" />
                  <h3 className="text-lg font-bold text-white">Rate Book</h3>
                </div>
                <button
                  onClick={closeRatingModal}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Book Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-1">{selectedBookForRating.title}</h4>
                <p className="text-sm text-gray-600">by {selectedBookForRating.author}</p>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-colors"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Click to rate</p>
              </div>

              {/* Review */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  placeholder="Share your thoughts about this book..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{review.length}/500 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeRatingModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || submittingRating}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
                >
                  {submittingRating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Star className="w-4 h-4 mr-2" />
                  )}
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowsPage;