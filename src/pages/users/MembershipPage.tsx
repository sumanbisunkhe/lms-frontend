import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
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
      toast.error(errorMessage);
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
        toast.success('Membership created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create membership');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create membership';
      toast.error(errorMessage);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />

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
            <h1 className="text-3xl font-bold text-gray-900">Your Membership</h1>
            <p className="mt-2 text-gray-600">Manage your library membership and view benefits</p>
          </div> */}

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
              <span className="ml-2 text-gray-600">Loading membership information...</span>
            </div>
          )}

          {/* No Membership Found */}
          {!loading && !membership && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Membership Found</h3>
              <p className="text-gray-600 mb-6">You don't have an active membership. Create one to start borrowing books!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Membership
              </button>
            </div>
          )}

          {/* Membership Details */}
          {!loading && membership && (
            <>
              {/* Membership Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-blue-200 text-sm mb-1">Membership ID</div>
                      <div className="text-xl font-semibold mb-4">LIB-{membership.id.toString().padStart(6, '0')}</div>
                      
                      <div className="text-blue-200 text-sm mb-1">Member Name</div>
                      <div className="text-lg font-medium mb-4">{user?.username || 'User'}</div>
                      
                      <div className="flex space-x-8">
                        <div>
                          <div className="text-blue-200 text-sm">Valid From</div>
                          <div>{formatDate(membership.dateOfIssue)}</div>
                        </div>
                        <div>
                          <div className="text-blue-200 text-sm">Valid Until</div>
                          <div>{formatDate(membership.expiryDate)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(membership.membershipStatus)}`}>
                          {membership.membershipStatus}
                        </span>
                      </div>
                      <div className="text-sm text-blue-100">Membership Type</div>
                      <div className="text-xl font-bold">{membership.membershipType}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Membership Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Membership Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-4">Borrowing Privileges</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Maximum borrow limit:</span>
                        <span className="font-medium text-gray-900">{membership.borrowingLimit} books</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Membership Type:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMembershipTypeColor(membership.membershipType)}`}>
                          {membership.membershipType}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-4">Membership Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date of Issue:</span>
                        <span className="font-medium text-gray-900">{formatDate(membership.dateOfIssue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Expiry Date:</span>
                        <span className="font-medium text-gray-900">{formatDate(membership.expiryDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(membership.membershipStatus)}`}>
                          {membership.membershipStatus}
                        </span>
                      </div>
                      {membership.updatedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="font-medium text-gray-900">{formatDate(membership.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Membership Benefits</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Access to physical and digital library resources</li>
                    <li>Participation in book clubs and literary events</li>
                    <li>Early access to new book releases</li>
                    <li>Extended borrowing periods for research materials</li>
                    {membership.membershipType === 'PREMIUM' && (
                      <li>Priority access to academic resources and journals</li>
                    )}
                    {membership.membershipType === 'STUDENT' && (
                      <li>Access to study rooms and group discussion areas</li>
                    )}
                    {membership.membershipType === 'REGULAR' && (
                      <li>Standard library privileges and services</li>
                    )}
                  </ul>
                </div>

                {/* Membership Status Alert */}
                {membership.membershipStatus === 'EXPIRED' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700 font-medium">Membership Expired</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      Your membership expired on {formatDate(membership.expiryDate)}. Please renew to continue borrowing books.
                    </p>
                  </div>
                )}

                {/* Days until expiry */}
                {membership.membershipStatus === 'ACTIVE' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-blue-700 font-medium">
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
            </>
          )}
        </div>
      </main>

      {/* Create Membership Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-100 relative" style={{ zIndex: 10000 }}>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">Create Membership</h3>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type
                </label>
                <select
                  value={selectedMembershipType}
                  onChange={(e) => setSelectedMembershipType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="STUDENT">Student (5 books limit)</option>
                  <option value="REGULAR">Regular (3 books limit)</option>
                  <option value="PREMIUM">Premium (10 books limit)</option>
                </select>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Membership Details</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Valid for 1 year from creation date</li>
                  <li>• Full access to library resources</li>
                  <li>• Borrowing limit: {selectedMembershipType === 'STUDENT' ? '5' : selectedMembershipType === 'PREMIUM' ? '10' : '3'} books</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createMembership}
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Membership
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