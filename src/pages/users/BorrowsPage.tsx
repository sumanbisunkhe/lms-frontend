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
  bookId: number;
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
  const [showPayFineModal, setShowPayFineModal] = useState(false);
  const [selectedFinePayment, setSelectedFinePayment] = useState<{
    borrowId: number;
    fineAmount: number;
    bookTitle: string;
  } | null>(null);
  const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
  const [pendingReturnBookId, setPendingReturnBookId] = useState<number | null>(null);

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

      const response = await fetch(`http://localhost:8080/rating/book/${selectedBookForRating.bookId}`, {
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
    setPendingReturnBookId(borrowId);
    setShowReturnConfirmModal(true);
  };

  const confirmReturnBook = () => {
    if (pendingReturnBookId) {
      returnBook(pendingReturnBookId);
    }
    setShowReturnConfirmModal(false);
    setPendingReturnBookId(null);
  };

  const cancelReturnBook = () => {
    setShowReturnConfirmModal(false);
    setPendingReturnBookId(null);
  };

  const handleRateBook = async (borrow: BorrowData) => {
    // Fetch full borrow details to get the book ID
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/borrow/${borrow.id}`, {
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
        // Set the borrow with the correct book ID from the detailed response
        const enrichedBorrow: BorrowData = {
          ...borrow,
          bookId: result.data.books.id
        };
        setSelectedBookForRating(enrichedBorrow);
        setRating(0);
        setHoverRating(0);
        setReview('');
        setShowRatingModal(true);
      } else {
        throw new Error(result.message || 'Failed to fetch borrow details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch borrow details';
      showToast.error(errorMessage);
    }
  };

  const handlePayFine = (borrowId: number, fineAmount: number, bookTitle: string) => {
    if (fineAmount <= 0) {
      showToast.error('No fine amount to pay');
      return;
    }

    setSelectedFinePayment({ borrowId, fineAmount, bookTitle });
    setShowPayFineModal(true);
  };

  const confirmPayFine = async () => {
    if (!selectedFinePayment) return;

    setPayingBorrowId(selectedFinePayment.borrowId);

    try {
      const result = await paymentService.initiatePayment(selectedFinePayment.borrowId);

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
      setShowPayFineModal(false);
      setSelectedFinePayment(null);
    }
  };

  const cancelPayFine = () => {
    setShowPayFineModal(false);
    setSelectedFinePayment(null);
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
            <p className="text-gray-600 text-center">Track your current borrows and borrowing history</p>
          </div>

          {/* Borrowing Summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Currently Borrowed</p>
                  <p className="text-3xl font-bold text-gray-900">{currentBorrows.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">On-Time Returns</p>
                  <p className="text-3xl font-bold text-gray-900">{onTimeReturns}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 font-medium">Overdue Books</p>
                  <p className="text-3xl font-bold text-gray-900">{overdueCount}</p>
                </div>
              </div>
            </div>
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
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative" />
              </div>
              <span className="mt-4 text-gray-600 font-medium">Loading borrowed books...</span>
            </div>
          )}

          {/* Current Borrows Section */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Book className="h-6 w-6 mr-3" />
                  Currently Borrowed Books
                </h2>
                <p className="text-blue-100 text-sm mt-1">Books you need to return</p>
              </div>

              <div className="overflow-x-auto">
                {currentBorrows.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Book Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Borrow Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Fine Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentBorrows.map(borrow => {
                        const daysRemaining = calculateDaysRemaining(borrow.dueDate);
                        const isBookOverdue = isOverdue(borrow.dueDate, borrow.isReturned);

                        return (
                          <tr key={borrow.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                            <td className="px-6 py-5">
                              <div className="flex items-center">
                                <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-4">
                                  <Book className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{borrow.title}</div>
                                  <div className="text-sm text-gray-600 font-medium">by {borrow.author}</div>
                                  <div className="text-xs text-gray-500">{borrow.publisher} • {borrow.isbn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                              {formatDate(borrow.borrowDate)}
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                              {formatDate(borrow.dueDate)}
                            </td>
                            <td className="px-6 py-5">
                              {isBookOverdue ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                  Overdue ({Math.abs(daysRemaining)} days)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-sm">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  {daysRemaining} days left
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-sm font-bold text-gray-900">
                              {borrow.fineAmount ? (
                                <span className="text-red-600">${borrow.fineAmount}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewDetails(borrow.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReturnBook(borrow.id)}
                                  disabled={returningBookId === borrow.id}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
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
                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
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
                  <div className="text-center py-16 px-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No borrowed books</h3>
                    <p className="text-gray-600 max-w-sm mx-auto">You don't have any books currently borrowed. Visit the books page to start borrowing!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Borrowing History Section */}
          {!loading && borrowHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Calendar className="h-6 w-6 mr-3" />
                  Borrowing History
                </h2>
                <p className="text-indigo-100 text-sm mt-1">Your past book returns and ratings</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Book Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Borrow Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Return Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {borrowHistory.map(borrow => (
                      <tr key={borrow.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center mr-4">
                              <Book className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{borrow.title}</div>
                              <div className="text-sm text-gray-600 font-medium">by {borrow.author}</div>
                              <div className="text-xs text-gray-500">{borrow.publisher}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                          {formatDate(borrow.borrowDate)}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                          {borrow.returnDate ? formatDate(borrow.returnDate) : '-'}
                        </td>
                        <td className="px-6 py-5">
                          {borrow.fineAmount && borrow.fineAmount > 0 ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                              Late - Fine: ${borrow.fineAmount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-800 shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Returned on time
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRateBook(borrow)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Rate Book"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            {borrow.fineAmount && borrow.fineAmount > 0 && (
                              <button
                                onClick={() => handlePayFine(borrow.id, borrow.fineAmount!, borrow.title)}
                                disabled={payingBorrowId === borrow.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
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
            <div className="flex items-center justify-center bg-white px-6 py-4 border border-gray-100 rounded-2xl mt-8 shadow-lg">
              <nav className="flex items-center space-x-2" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

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
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all ${i === currentPage
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
                  className="relative inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 flex items-center justify-center p-4  bg-opacity-50  animate-in fade-in duration-300" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-100 relative max-h-[90vh] overflow-y-auto transform transition-all animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                    <Book className="h-6 w-6 text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Borrow Details</h3>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Book Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    <Book className="h-5 w-5 mr-2 text-blue-600" />
                    Book Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Title</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.books.title}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Author</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.books.author}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Publisher</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.books.publisher}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">ISBN</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.books.isbn}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Genre</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                          {selectedBorrow.books.genre}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Borrow Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Borrow Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Borrow Date</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{formatDate(selectedBorrow.borrowDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Due Date</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{formatDate(selectedBorrow.dueDate)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Return Date</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {selectedBorrow.returnDate ? formatDate(selectedBorrow.returnDate) : 'Not returned yet'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Status</label>
                      <div className="mt-2">
                        {selectedBorrow.isReturned ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-800 shadow-sm">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Returned
                          </span>
                        ) : isOverdue(selectedBorrow.dueDate, selectedBorrow.isReturned) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 shadow-sm">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Fine Amount</label>
                      <p className="text-sm font-bold mt-1">
                        {selectedBorrow.fineAmount !== null && selectedBorrow.fineAmount > 0
                          ? <span className="text-red-600">${selectedBorrow.fineAmount.toFixed(2)}</span>
                          : <span className="text-green-600">No fine</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Borrower Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Full Name</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.users.fullName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Username</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.users.username}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Phone Number</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.users.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase">Address</label>
                      <p className="text-sm text-gray-900 font-medium mt-1">{selectedBorrow.users.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!selectedBorrow.isReturned && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md"
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
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                  >
                    {returningBookId === currentBorrowId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Returning...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Return Book
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBookForRating && (
        <div className="fixed inset-0 flex items-center justify-center p-2 animate-in fade-in duration-300" style={{ zIndex: 9999 }}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto border border-gray-100 relative transform transition-all animate-in zoom-in-95 duration-300 flex flex-col justify-center"
            style={{ minHeight: 'auto', maxHeight: '410px' }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-2">
                  <Star className="h-5 w-5 text-gray-900" />
                </div>
                <h3 className="text-lg font-bold text-white">Rate Book</h3>
              </div>
              <button
                onClick={closeRatingModal}
                className="text-white hover:bg-gray-500 hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="px-6 py-4 flex flex-col gap-3 flex-1">
              {/* Book Info */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200 flex flex-col gap-1">
                <h4 className="font-bold text-gray-900 text-base truncate">{selectedBookForRating.title}</h4>
                <p className="text-xs text-gray-700 font-medium truncate">by {selectedBookForRating.author}</p>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center justify-center space-x-1 bg-gray-50 rounded-lg p-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-all transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-all ${star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current drop-shadow-md'
                          : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center font-medium">Click to rate</p>
              </div>

              {/* Review */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none font-medium text-xs"
                  placeholder="Share your thoughts..."
                  maxLength={500}
                  style={{ minHeight: '40px', maxHeight: '60px' }}
                />
                <p className="text-xs text-gray-400 mt-1 font-medium text-right">{review.length}/500</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={closeRatingModal}
                  className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || submittingRating}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-1" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Fine Confirmation Modal */}
      {showPayFineModal && selectedFinePayment && (
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-300" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 relative max-h-[90vh] flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-3 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 rounded-t-2xl sm:rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-7 w-7 sm:h-9 sm:w-9 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <HandCoins className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Pay Fine</h3>
                </div>
                <button
                  onClick={cancelPayFine}
                  className="text-white hover:bg-gray-400 rounded-lg p-1 sm:p-1.5 transition-colors"
                >
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-3 sm:p-5 md:p-6 overflow-y-auto flex-1">
              {/* Book Info */}
              <div className="mb-3 sm:mb-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-200">
                <div className="flex items-start">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                    <Book className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base break-words line-clamp-2">{selectedFinePayment.bookTitle}</h4>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium">Overdue fine payment</p>
                  </div>
                </div>
              </div>

              {/* Fine Amount */}
              <div className="mb-3 sm:mb-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-red-200">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-red-700 font-medium mb-1">Amount Due</p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600">
                    ${selectedFinePayment.fineAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200">
                <h4 className="text-xs sm:text-sm font-bold text-blue-900 mb-2 flex items-center">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>Payment Information</span>
                </h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2 font-medium">
                  <li className="flex items-start">
                    <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                    <span className="leading-tight">You will be redirected to Khalti payment gateway</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                    <span className="leading-tight">Payment is secure and encrypted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                    <span className="leading-tight">Your fine will be cleared after successful payment</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 sm:p-5 md:p-6 pt-0 border-t border-gray-100">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={cancelPayFine}
                  disabled={payingBorrowId === selectedFinePayment.borrowId}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPayFine}
                  disabled={payingBorrowId === selectedFinePayment.borrowId}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {payingBorrowId === selectedFinePayment.borrowId ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1.5 sm:mr-2" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <HandCoins className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span>Proceed to Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Book Confirmation Modal */}
      {showReturnConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-[99999]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <RotateCcw className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Return Book</h3>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to return this book?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelReturnBook}
                className="px-5 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmReturnBook}
                className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowsPage;