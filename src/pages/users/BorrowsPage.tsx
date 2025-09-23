import React from 'react';
import UserHeader from '../../components/users/UserHeader';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BorrowsPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Sample borrowing data
  const currentBorrows = [
    {
      id: 1,
      title: "1984",
      author: "George Orwell",
      borrowDate: "Sep 10, 2025",
      dueDate: "Sep 24, 2025",
      isOverdue: false
    },
    {
      id: 2,
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      borrowDate: "Sep 5, 2025",
      dueDate: "Sep 19, 2025",
      isOverdue: true
    }
  ];

  const borrowHistory = [
    {
      id: 3,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      borrowDate: "Aug 1, 2025",
      returnDate: "Aug 15, 2025",
      onTime: true
    },
    {
      id: 4,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      borrowDate: "Jul 15, 2025",
      returnDate: "Jul 28, 2025",
      onTime: false,
      lateFee: "$2.50"
    },
    {
      id: 5,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      borrowDate: "Jun 20, 2025",
      returnDate: "Jul 4, 2025",
      onTime: true
    }
  ];

  // Calculate days remaining
  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation Tabs */}
      <UserHeader 
        username={user?.username || 'User'} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Borrowed Books</h2>
            
            {/* Borrowing Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-blue-600">Currently Borrowed</p>
                    <p className="text-2xl font-semibold text-blue-800">{currentBorrows.length} books</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-green-600">Returned On Time</p>
                    <p className="text-2xl font-semibold text-green-800">{borrowHistory.filter(item => item.onTime).length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle size={24} className="text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-red-600">Overdue</p>
                    <p className="text-2xl font-semibold text-red-800">{currentBorrows.filter(item => item.isOverdue).length}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Borrows Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Borrowed Books</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrow Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentBorrows.map(book => {
                      const daysRemaining = calculateDaysRemaining(book.dueDate);
                      
                      return (
                        <tr key={book.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {book.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.author}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.borrowDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.dueDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {book.isOverdue ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle size={12} className="mr-1" /> Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {daysRemaining} days left
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              Renew
                            </button>
                            <button className="ml-4 text-green-600 hover:text-green-900">
                              Return
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {currentBorrows.length === 0 && (
                <p className="text-gray-500 text-center py-4">You don't have any books currently borrowed.</p>
              )}
            </div>
            
            {/* Borrowing History Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Borrowing History</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrow Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowHistory.map(book => (
                      <tr key={book.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {book.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {book.author}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {book.borrowDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {book.returnDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {book.onTime ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Returned on time
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late - Fee: {book.lateFee}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {borrowHistory.length === 0 && (
                <p className="text-gray-500 text-center py-4">You don't have any borrowing history yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BorrowsPage;