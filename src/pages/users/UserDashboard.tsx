import React from 'react';
import UserHeader from '../../components/users/UserHeader';
import { 
  Book, 
  Calendar, 
  Star, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
        {/* User Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Welcome to Your Library Portal</h2>
            <p className="text-gray-600 mb-4">
              Browse books, manage reservations, and track your borrowing activity all from one place.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Account Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You are logged in as: <span className="font-semibold">{user?.username}</span></li>
                      <li>Your role: <span className="font-semibold">{user?.roles?.join(', ')}</span></li>
                      <li>Membership: <span className="font-semibold">Standard</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <Book className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Books Borrowed</dt>
                      <dd className="text-lg font-semibold text-gray-900">2</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Reservations</dt>
                      <dd className="text-lg font-semibold text-gray-900">1</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Book Ratings</dt>
                      <dd className="text-lg font-semibold text-gray-900">8</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Membership Until</dt>
                      <dd className="text-lg font-semibold text-gray-900">Jan 15, 2026</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Recommended Books */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-2">
            
            {/* Recent Activities Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activities</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest library transactions.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="bg-gray-50 px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    {/* Activity 1 */}
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">The Great Gatsby</h4>
                          <p className="text-sm text-gray-500">Borrowed on: Oct 15, 2023</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Due in 3 days
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Return by: Oct 29, 2023
                      </div>
                    </div>
                    
                    {/* Activity 2 */}
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">To Kill a Mockingbird</h4>
                          <p className="text-sm text-gray-500">Borrowed on: Oct 5, 2023</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Returned
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Returned on: Oct 19, 2023
                      </div>
                    </div>

                    {/* Activity 3 */}
                    <div>
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-base font-medium text-gray-900">1984</h4>
                          <p className="text-sm text-gray-500">Reservation made: Oct 21, 2023</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          Ready for Pickup
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Available until: Oct 28, 2023
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommended Books Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recommended Books</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Based on your reading history.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="bg-gray-50 px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    {/* Book 1 */}
                    <div className="flex items-center border-b border-gray-200 pb-4">
                      <div className="flex-shrink-0 h-16 w-12 bg-gray-300 rounded">
                        <div className="h-full w-full flex items-center justify-center text-gray-500">
                          <Book className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900">The Catcher in the Rye</h4>
                        <p className="text-sm text-gray-500">J.D. Salinger</p>
                        <div className="flex mt-1">
                          <div className="flex">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <Star
                                key={rating}
                                className={`h-4 w-4 ${rating < 4 ? "text-yellow-400" : "text-gray-300"}`}
                                fill={rating < 4 ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-xs text-gray-500">(4.0)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Book 2 */}
                    <div className="flex items-center border-b border-gray-200 pb-4">
                      <div className="flex-shrink-0 h-16 w-12 bg-gray-300 rounded">
                        <div className="h-full w-full flex items-center justify-center text-gray-500">
                          <Book className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900">Brave New World</h4>
                        <p className="text-sm text-gray-500">Aldous Huxley</p>
                        <div className="flex mt-1">
                          <div className="flex">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <Star
                                key={rating}
                                className={`h-4 w-4 ${rating < 5 ? "text-yellow-400" : "text-gray-300"}`}
                                fill={rating < 5 ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-xs text-gray-500">(4.8)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Book 3 */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-12 bg-gray-300 rounded">
                        <div className="h-full w-full flex items-center justify-center text-gray-500">
                          <Book className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900">The Alchemist</h4>
                        <p className="text-sm text-gray-500">Paulo Coelho</p>
                        <div className="flex mt-1">
                          <div className="flex">
                            {[0, 1, 2, 3, 4].map((rating) => (
                              <Star
                                key={rating}
                                className={`h-4 w-4 ${rating < 4 ? "text-yellow-400" : "text-gray-300"}`}
                                fill={rating < 4 ? "currentColor" : "none"}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-xs text-gray-500">(4.2)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Featured Books Grid */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Featured Books</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Book Card 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <Book className="h-16 w-16 text-white" />
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Pride and Prejudice</h3>
                <p className="mt-1 text-sm text-gray-500">Jane Austen</p>
                <div className="mt-4 flex items-center">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-5 w-5 ${rating < 4 ? "text-yellow-400" : "text-gray-300"}`}
                        fill={rating < 4 ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">(4.2 - 328 reviews)</span>
                </div>
                <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Reserve Book
                </button>
              </div>
            </div>

            {/* Book Card 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-40 bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                <Book className="h-16 w-16 text-white" />
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">The Hobbit</h3>
                <p className="mt-1 text-sm text-gray-500">J.R.R. Tolkien</p>
                <div className="mt-4 flex items-center">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-5 w-5 ${rating < 5 ? "text-yellow-400" : "text-gray-300"}`}
                        fill={rating < 5 ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">(4.8 - 492 reviews)</span>
                </div>
                <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  Reserve Book
                </button>
              </div>
            </div>

            {/* Book Card 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-40 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Book className="h-16 w-16 text-white" />
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">The Little Prince</h3>
                <p className="mt-1 text-sm text-gray-500">Antoine de Saint-Exupéry</p>
                <div className="mt-4 flex items-center">
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-5 w-5 ${rating < 5 ? "text-yellow-400" : "text-gray-300"}`}
                        fill={rating < 5 ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-500">(4.7 - 412 reviews)</span>
                </div>
                <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                  Reserve Book
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