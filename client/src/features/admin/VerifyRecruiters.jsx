import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Search, Check, X, User } from 'lucide-react';

export default function VerifyRecruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    const mockRecruiters = [
      { id: 1, name: 'TechCorp HR', email: 'hr@techcorp.com', company: 'TechCorp', status: 'pending', registered: '2024-01-15' },
      { id: 2, name: 'Innovate Ltd.', email: 'contact@innovate.com', company: 'Innovate Ltd', status: 'pending', registered: '2024-01-12' },
      { id: 3, name: 'Global Solutions', email: 'recruit@globalsolutions.com', company: 'Global Solutions', status: 'approved', registered: '2024-01-10' },
    ];

    setTimeout(() => {
      setRecruiters(mockRecruiters);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRecruiters = recruiters.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (id) => {
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id) => {
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Recruiters</h1>
          <p className="text-gray-600">Approve or reject recruiter accounts before they post jobs.</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recruiters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Recruiter List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading recruiters...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Recruiter</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Registered</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecruiters.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{r.name}</span>
                    </td>
                    <td className="py-4 px-4">{r.company}</td>
                    <td className="py-4 px-4">{r.email}</td>
                    <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-4">{r.registered}</td>
                    <td className="py-4 px-4 flex space-x-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
