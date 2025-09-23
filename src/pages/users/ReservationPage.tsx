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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with Navigation Tabs */}
      <UserHeader 
        username={user?.username || 'User'} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <span className="ml-2 text-gray-600">Loading reservations...</span>
            </div>
          )}

          {/* No Membership */}
          {!loading && !membership && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Membership Found</h3>
              <p className="text-gray-600">You need an active membership to make reservations.</p>
            </div>
          )}

          {/* Main Content */}
          {!loading && membership && (
            <>
              {/* Current Reservations */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Current Reservations</h2>
                </div>
                
                <div className="overflow-x-auto">
                  {reservations.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Book Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reserved Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expiry Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map(reservation => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {reservation.bookTitle}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {formatDate(reservation.reservationDate)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                                {reservation.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {reservation.expiryDate ? formatDate(reservation.expiryDate) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations</h3>
                      <p className="mt-1 text-sm text-gray-500">You haven't made any book reservations yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Books for Reservation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Reserve Books</h2>
                  <p className="text-sm text-gray-600 mt-1">Books currently unavailable for immediate borrowing</p>
                </div>
                
                <div className="p-6">
                  {loadingBooks ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading books...</span>
                    </div>
                  ) : availableBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableBooks.map(book => (
                        <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium text-gray-900 mb-1">{book.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                          <p className="text-xs text-gray-500 mb-3">{book.genre}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-red-600">Not Available</span>
                            <button
                              onClick={() => handleReserveBook(book)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                              Reserve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">All books available</h3>
                      <p className="mt-1 text-sm text-gray-500">All books are currently available for borrowing.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Reserve Confirmation Modal */}
      {showReserveModal && selectedBook && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 relative">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Reserve Book</h3>
                <button onClick={cancelReservation} className="text-white hover:text-gray-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">{selectedBook.title}</h4>
                <p className="text-sm text-gray-600">by {selectedBook.author}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedBook.publisher}</p>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This book is currently unavailable. By reserving it, you'll be notified when it becomes available for borrowing.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelReservation}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReservation}
                  disabled={reserving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
                >
                  {reserving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Confirm Reservation
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