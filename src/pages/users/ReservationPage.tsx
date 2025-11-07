import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import UserHeader from '../../components/users/UserHeader';
import { CheckCircle, AlertCircle, BookOpen, Loader2, Plus, X } from 'lucide-react';

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

interface ReservationData {
  id: number;
  bookId: number;
  bookTitle: string;
  memberId: number;
  memberName: string;
  reservationDate: string;
  notificationDate: string | null;
  expiryDate: string | null;
  status: string;
}

interface ReservationResponse {
  data: ReservationData;
  message: string;
  status: number;
  success: boolean;
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
}

interface BooksResponse {
  data: {
    content: BookData[];
    page: {
      size: number;
      number: number;
      totalElements: number;
      totalPages: number;
    };
  };
  message: string;
  status: number;
  success: boolean;
}

interface ReservationsListResponse {
  data: ReservationData[];
  message: string;
  status: number;
  success: boolean;
}

const ReservationPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [availableBooks, setAvailableBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
      } else {
        throw new Error(result.message || 'Failed to fetch membership');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch membership';
      setError(errorMessage);
      showToast.error(errorMessage);
    }
  };

  const fetchAvailableBooks = async () => {
    setLoadingBooks(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: '1',
        size: '50',
        sortBy: 'title',
        sortOrder: 'asc'
      });

      const response = await fetch(`http://localhost:8080/book?${params}`, {
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
        // Filter books that are not available for immediate borrowing
        const unavailableBooks = result.data.content.filter(book => 
          !book.isAvailable || (book.availableCopies !== null && book.availableCopies === 0)
        );
        setAvailableBooks(unavailableBooks);
      } else {
        throw new Error(result.message || 'Failed to fetch books');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
      showToast.error(errorMessage);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchUserReservations = async () => {
    if (!membership) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/reservation/member/${membership.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ReservationsListResponse = await response.json();
      
      if (result.success) {
        setReservations(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch reservations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reservations';
      console.error('Failed to fetch reservations:', errorMessage);
      // Don't show toast error for reservations as it's not critical
    }
  };

  const createReservation = async (bookId: number) => {
    if (!membership) {
      showToast.error('No valid membership found');
      return;
    }

    setReserving(true);

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
        setReservations(prev => [...prev, result.data]);
        setShowReserveModal(false);
        setSelectedBook(null);
      } else {
        throw new Error(result.message || 'Failed to reserve book');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve book';
      showToast.error(errorMessage);
    } finally {
      setReserving(false);
    }
  };

  const handleReserveBook = (book: BookData) => {
    setSelectedBook(book);
    setShowReserveModal(true);
  };

  const confirmReservation = () => {
    if (selectedBook) {
      createReservation(selectedBook.id);
    }
  };

  const cancelReservation = () => {
    setShowReserveModal(false);
    setSelectedBook(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'CLAIMED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      await fetchMembership();
      setLoading(false);
    };

    initializePage();
  }, [user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (membership) {
        await Promise.all([
          fetchUserReservations(),
          fetchAvailableBooks()
        ]);
      }
    };

    fetchData();
  }, [membership]);

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
          {/* Page Title */}
          <div className="mb-8">
            <p className="text-gray-600 text-center">Reserve books and manage your waiting list</p>
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
                <X className="h-5 w-5" />
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
              <span className="mt-4 text-gray-600 font-medium">Loading reservations...</span>
            </div>
          )}

          {/* No Membership */}
          {!loading && !membership && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <AlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Membership Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">You need an active membership to make reservations. Please contact the library to get started.</p>
            </div>
          )}

          {/* Main Content */}
          {!loading && membership && (
            <div className="space-y-8">
              {/* Current Reservations */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <BookOpen className="h-6 w-6 mr-3" />
                    Current Reservations
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Track your reserved books and their status</p>
                </div>
                
                <div className="overflow-x-auto">
                  {reservations.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Book Title
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Reserved Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Expiry Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {reservations.map(reservation => (
                          <tr key={reservation.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                            <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                {reservation.bookTitle}
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700">
                              {formatDate(reservation.reservationDate)}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(reservation.status)} shadow-sm`}>
                                {reservation.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                              {reservation.expiryDate ? formatDate(reservation.expiryDate) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-16 px-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                        <BookOpen className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No reservations yet</h3>
                      <p className="text-gray-600 max-w-sm mx-auto">Start reserving unavailable books to get notified when they become available.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Books for Reservation */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Plus className="h-6 w-6 mr-3" />
                    Reserve Books
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">Books currently unavailable for immediate borrowing</p>
                </div>
                
                <div className="p-8">
                  {loadingBooks ? (
                    <div className="flex flex-col justify-center items-center py-12">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <Loader2 className="h-10 w-10 animate-spin text-purple-600 relative" />
                      </div>
                      <span className="mt-4 text-gray-600 font-medium">Loading books...</span>
                    </div>
                  ) : availableBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {availableBooks.map(book => (
                        <div key={book.id} className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1">
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 shadow-sm">
                              Not Available
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg leading-tight">{book.title}</h4>
                            <p className="text-sm text-gray-600 mb-1 font-medium">by {book.author}</p>
                            <p className="text-xs text-gray-500 mb-4">{book.publisher}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 font-medium">
                                {book.genre}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleReserveBook(book)}
                            className="w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center group-hover:scale-105"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Reserve Book
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">All books available</h3>
                      <p className="text-gray-600 max-w-sm mx-auto">Great news! All books are currently available for borrowing. Check the borrowing page to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reserve Confirmation Modal */}
      {showReserveModal && selectedBook && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto border border-gray-100 relative transform transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Reserve Book</h3>
                </div>
                <button 
                  onClick={cancelReservation} 
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2 text-xl">{selectedBook.title}</h4>
                <p className="text-sm text-gray-700 font-medium mb-1">by {selectedBook.author}</p>
                <p className="text-xs text-gray-500">{selectedBook.publisher}</p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                    {selectedBook.genre}
                  </span>
                </div>
              </div>
              
              <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 leading-relaxed">
                    This book is currently unavailable. By reserving it, you'll be notified when it becomes available for borrowing.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelReservation}
                  className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReservation}
                  disabled={reserving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  {reserving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Reserving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Reservation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationPage;