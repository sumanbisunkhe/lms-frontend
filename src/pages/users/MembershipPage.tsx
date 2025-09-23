import React from 'react';
import UserHeader from '../../components/users/UserHeader';

const MembershipPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Sample membership data
  const membershipData = {
    type: "Standard",
    status: "Active",
    startDate: "Jan 15, 2025",
    expiryDate: "Jan 15, 2026",
    borrowLimit: 5,
    currentBorrows: 2,
    reservationLimit: 3,
    currentReservations: 1
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
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Membership</h2>
            
            {/* Membership Card */}
            <div className="max-w-xl mx-auto bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg text-white p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-blue-200 text-sm mb-1">Membership ID</div>
                  <div className="text-xl font-semibold mb-4">LIB-{(user?.username || 'USER').toUpperCase()}-2025</div>
                  
                  <div className="text-blue-200 text-sm mb-1">Member Name</div>
                  <div className="text-lg font-medium mb-4">{user?.username || 'User'}</div>
                  
                  <div className="flex space-x-8">
                    <div>
                      <div className="text-blue-200 text-sm">Valid From</div>
                      <div>{membershipData.startDate}</div>
                    </div>
                    <div>
                      <div className="text-blue-200 text-sm">Valid Until</div>
                      <div>{membershipData.expiryDate}</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {membershipData.status}
                    </span>
                  </div>
                  <div className="text-sm text-blue-100">Membership Type</div>
                  <div className="text-xl font-bold">{membershipData.type}</div>
                </div>
              </div>
            </div>
            
            {/* Membership Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Borrowing Privileges</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Maximum borrow limit:</span>
                      <span className="font-medium">{membershipData.borrowLimit} books</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Currently borrowed:</span>
                      <span className="font-medium">{membershipData.currentBorrows} books</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium">{membershipData.borrowLimit - membershipData.currentBorrows} books</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(membershipData.currentBorrows / membershipData.borrowLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Reservation Privileges</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Maximum reservation limit:</span>
                      <span className="font-medium">{membershipData.reservationLimit} books</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Currently reserved:</span>
                      <span className="font-medium">{membershipData.currentReservations} books</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium">{membershipData.reservationLimit - membershipData.currentReservations} books</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(membershipData.currentReservations / membershipData.reservationLimit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">Additional Benefits</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Access to digital library resources</li>
                  <li>Participation in book clubs and literary events</li>
                  <li>Early access to new book releases</li>
                  <li>Discounted rates for special collections</li>
                </ul>
              </div>
              
              <div className="mt-8 text-right">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Upgrade Membership
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembershipPage;