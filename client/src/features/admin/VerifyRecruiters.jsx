import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Search, Check, X, User, Trash2, Eye, AlertCircle } from 'lucide-react';

export default function VerifyRecruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // API base URL - adjust according to your backend
// Instead of '/api/auth', use your full backend URL
const API_BASE = 'http://localhost:5000/api/auth'; // or your backend URL

  // Fetch recruiters from API
  useEffect(() => {
    fetchRecruiters();
  }, []);

const fetchRecruiters = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    
    // Check if token exists
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      return;
    }
    
    console.log('Making request to:', `${API_BASE}/admin/recruiters`);
    console.log('Token exists:', !!token);
    
    const response = await fetch(`${API_BASE}/admin/recruiters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      // Get the error message from response
      const errorData = await response.text();
      console.error('Response error:', errorData);
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Fetched recruiters:', data);
    
    // Ensure data is an array
    if (Array.isArray(data)) {
      setRecruiters(data);
    } else {
      console.error('Expected array but got:', typeof data);
      setError('Invalid data format received from server');
    }
  } catch (err) {
    console.error('Error fetching recruiters:', err);
    setError(`Failed to fetch recruiters: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const filteredRecruiters = recruiters.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (recruiterId) => {
    try {
      setActionLoading(recruiterId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/admin/recruiters/${recruiterId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve recruiter');
      }

      // Update local state
      setRecruiters(prev => prev.map(r => 
        r.recruiter_id === recruiterId 
          ? { ...r, status: 'approved', isVerified: 1 } 
          : r
      ));
    } catch (err) {
      console.error('Error approving recruiter:', err);
      setError('Failed to approve recruiter. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (recruiterId) => {
    try {
      setActionLoading(recruiterId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/admin/recruiters/${recruiterId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject recruiter');
      }

      // Update local state
      setRecruiters(prev => prev.map(r => 
        r.recruiter_id === recruiterId 
          ? { ...r, status: 'rejected', isVerified: -1 } 
          : r
      ));
    } catch (err) {
      console.error('Error rejecting recruiter:', err);
      setError('Failed to reject recruiter. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (recruiterId) => {
    if (!window.confirm('Are you sure you want to delete this recruiter? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(recruiterId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/admin/recruiters/${recruiterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete recruiter');
      }

      // Remove from local state
      setRecruiters(prev => prev.filter(r => r.recruiter_id !== recruiterId));
    } catch (err) {
      console.error('Error deleting recruiter:', err);
      setError('Failed to delete recruiter. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchRecruiters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Recruiters</h1>
          <p className="text-gray-600">Approve, reject, or manage recruiter accounts.</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recruiters by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {recruiters.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending Verification</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {recruiters.filter(r => r.status === 'approved').length}
            </div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {recruiters.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Recruiter List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading recruiters...</p>
            </div>
          ) : filteredRecruiters.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recruiters found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Recruiter</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Registered</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecruiters.map((r) => (
                    <tr key={r.recruiter_id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{r.name}</div>
                            {r.recruiter_name && r.recruiter_name !== r.name && (
                              <div className="text-xs text-gray-500">({r.recruiter_name})</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{r.company || 'N/A'}</div>
                        {r.industry_type && (
                          <div className="text-xs text-gray-500">{r.industry_type}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">{r.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{r.contact_number || 'N/A'}</td>
                      <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{formatDate(r.registered)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(r.recruiter_id)}
                                disabled={actionLoading === r.recruiter_id}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve recruiter"
                              >
                                {actionLoading === r.recruiter_id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(r.recruiter_id)}
                                disabled={actionLoading === r.recruiter_id}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject recruiter"
                              >
                                {actionLoading === r.recruiter_id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(r.recruiter_id)}
                            disabled={actionLoading === r.recruiter_id}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete recruiter permanently"
                          >
                            {actionLoading === r.recruiter_id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          {r.website && (
                            <a
                              href={r.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Visit company website"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}