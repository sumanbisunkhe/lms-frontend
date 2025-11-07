import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toast';
import UserHeader from '../../components/users/UserHeader';
import { Calendar, CheckCircle, AlertCircle, User, CreditCard, Loader2, Plus } from 'lucide-react';

interface MembershipData {
  id: number;
  membershipType: string;
  membershipStatus: string;
  dateOfIssue: string;
  expiryDate: string;
  borrowingLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface MembershipResponse {
  data: MembershipData;
  message: string;
  status: number;
  success: boolean;
}

const MembershipPage: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMembershipType, setSelectedMembershipType] = useState<string>('STUDENT');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const fetchMembership = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8080/membership/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // No membership found
        setMembership(null);
        setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const createMembership = async () => {
    if (!user?.id) return;

    setCreating(true);

    try {
      const token = localStorage.getItem('authToken');
      const membershipData = {
        membershipType: selectedMembershipType,
        membershipStatus: 'ACTIVE',
        dateOfIssue: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        borrowingLimit: selectedMembershipType === 'STUDENT' ? 5 : selectedMembershipType === 'PREMIUM' ? 10 : 3
      };

      const response = await fetch(`http://localhost:8080/membership/create/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(membershipData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MembershipResponse = await response.json();
      
      if (result.success) {
        setMembership(result.data);
        setShowCreateModal(false);
        showToast.success('Membership created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create membership');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create membership';
      showToast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'STUDENT': return 'bg-blue-100 text-blue-800';
      case 'PREMIUM': return 'bg-green-100 text-green-800';
      case 'REGULAR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Membership</h1> */}
            <p className="text-gray-600 text-center">Manage your library membership and view benefits</p>
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
              <span className="mt-4 text-gray-600 font-medium">Loading membership information...</span>
            </div>
          )}

          {/* No Membership Found */}
          {!loading && !membership && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                <CreditCard className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Membership Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">You don't have an active membership yet. Create one now to start borrowing books and accessing library resources!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Membership
              </button>
            </div>
          )}

          {/* Membership Details */}
          {!loading && membership && (
            <div className="space-y-6">
              {/* Membership Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-xl">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-6">
                        <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm shadow-lg">
                          <CreditCard className="h-7 w-7 text-black drop-shadow-md" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold mb-1 drop-shadow-sm">Membership ID</div>
                          <div className="text-2xl font-bold tracking-wide drop-shadow-md">LIB-{membership.id.toString().padStart(6, '0')}</div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-white text-sm font-semibold mb-2 drop-shadow-sm">Member Name</div>
                        <div className="text-xl font-bold flex items-center drop-shadow-md">
                          <User className="h-5 w-5 mr-2 drop-shadow-sm" />
                          {user?.username || 'User'}
                        </div>
                      </div>
                      
                      <div className="flex space-x-8">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-white border-opacity-30">
                          <div className="text-black text-xs font-semibold mb-1 flex items-center drop-shadow-sm">
                            <Calendar className="h-3.5 w-3.5 mr-1 drop-shadow-sm" />
                            Valid From
                          </div>
                          <div className="font-bold text-md drop-shadow-md text-black">{formatDate(membership.dateOfIssue)}</div>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-white border-opacity-30">
                          <div className="text-black text-xs font-semibold mb-1 flex items-center drop-shadow-sm">
                            <Calendar className="h-3.5 w-3.5 mr-1 drop-shadow-sm " />
                            Valid Until
                          </div>
                          <div className="font-bold text-md drop-shadow-md text-black">{formatDate(membership.expiryDate)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getStatusColor(membership.membershipStatus)}`}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {membership.membershipStatus}
                        </span>
                      </div>
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-5 py-4 shadow-lg border border-white border-opacity-30">
                        <div className="text-black text-xs font-semibold mb-1 drop-shadow-sm">Membership Type</div>
                        <div className="text-2xl font-bold drop-shadow-md text-black">{membership.membershipType}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Membership Details */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <CreditCard className="h-6 w-6 mr-3" />
                    Membership Details
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">Your membership information and privileges</p>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        Borrowing Privileges
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-gray-600 font-medium">Maximum borrow limit</span>
                          <span className="font-bold text-gray-900 text-lg">{membership.borrowingLimit} books</span>
                        </div>
                        <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-gray-600 font-medium">Membership Type</span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getMembershipTypeColor(membership.membershipType)}`}>
                            {membership.membershipType}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <h4 className="font-bold text-gray-900 mb-5 text-lg flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        Membership Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-gray-600 font-medium">Date of Issue</span>
                          <span className="font-bold text-gray-900">{formatDate(membership.dateOfIssue)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-gray-600 font-medium">Expiry Date</span>
                          <span className="font-bold text-gray-900">{formatDate(membership.expiryDate)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-gray-600 font-medium">Status</span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getStatusColor(membership.membershipStatus)}`}>
                            {membership.membershipStatus}
                          </span>
                        </div>
                        {membership.updatedAt && (
                          <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                            <span className="text-gray-600 font-medium">Last Updated</span>
                            <span className="font-bold text-gray-900">{formatDate(membership.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                      <div className="h-8 w-8 bg-gradient-to-br from-gray-700 to-slate-800 rounded-lg flex items-center justify-center mr-3">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      Membership Benefits
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">Access to physical and digital library resources</span>
                      </li>
                      <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">Participation in book clubs and literary events</span>
                      </li>
                      <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">Early access to new book releases</span>
                      </li>
                      <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">Extended borrowing periods for research materials</span>
                      </li>
                      {membership.membershipType === 'PREMIUM' && (
                        <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">Priority access to academic resources and journals</span>
                        </li>
                      )}
                      {membership.membershipType === 'STUDENT' && (
                        <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">Access to study rooms and group discussion areas</span>
                        </li>
                      )}
                      {membership.membershipType === 'REGULAR' && (
                        <li className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">Standard library privileges and services</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Membership Status Alert */}
                  {membership.membershipStatus === 'EXPIRED' && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-r-xl shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="text-red-900 font-bold text-lg">Membership Expired</span>
                      </div>
                      <p className="text-red-700 ml-11 font-medium">
                        Your membership expired on {formatDate(membership.expiryDate)}. Please renew to continue borrowing books and accessing library resources.
                      </p>
                    </div>
                  )}

                  {/* Days until expiry */}
                  {membership.membershipStatus === 'ACTIVE' && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-blue-900 font-bold text-lg">
                          {(() => {
                            const today = new Date();
                            const expiry = new Date(membership.expiryDate);
                            const diffTime = expiry.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays <= 0) return 'Membership has expired';
                            if (diffDays <= 30) return `Membership expires in ${diffDays} days`;
                            return `Membership valid for ${diffDays} more days`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Membership Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-300" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 relative transform transition-all animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Create Membership</h3>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Select Membership Type
                </label>
                <select
                  value={selectedMembershipType}
                  onChange={(e) => setSelectedMembershipType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium transition-all hover:border-gray-300"
                >
                  <option value="STUDENT">Student (5 books limit)</option>
                  <option value="REGULAR">Regular (3 books limit)</option>
                  <option value="PREMIUM">Premium (10 books limit)</option>
                </select>
              </div>

              <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Membership Details
                </h4>
                <ul className="text-sm text-blue-800 space-y-2 font-medium">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Valid for 1 year from creation date</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Full access to library resources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Borrowing limit: {selectedMembershipType === 'STUDENT' ? '5' : selectedMembershipType === 'PREMIUM' ? '10' : '3'} books</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={createMembership}
                  disabled={creating}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Membership
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

export default MembershipPage;