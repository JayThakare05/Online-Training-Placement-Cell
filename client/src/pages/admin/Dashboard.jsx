import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Users, UserCheck, FileText, TrendingUp, Loader } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRecruiters: 0,
    pendingVerifications: 0,
    totalPlacements: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Get token from localStorage or wherever you store it
      const token = localStorage.getItem('token'); // Adjust based on your token storage method
      
      console.log('Fetching dashboard stats...');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://localhost:5000/api/auth/admin/dashboard-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed data:', data);
        setStats(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="flex items-center">
              <Loader className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <p className="text-xl font-bold text-gray-400">Loading...</p>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg">Error loading dashboard</p>
            <p className="text-gray-500">{error}</p>
            <button 
              onClick={fetchDashboardStats}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your career training platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Recruiters"
            value={stats.totalRecruiters}
            icon={UserCheck}
            color="bg-green-500"
          />
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={FileText}
            color="bg-orange-500"
          />
          <StatCard
            title="Total Placements"
            value={stats.totalPlacements}
            icon={TrendingUp}
            color="bg-purple-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <p className="font-medium text-blue-900">Manage Training Content</p>
              <p className="text-sm text-blue-600">Add or update training materials</p>
            </button>
                        
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <UserCheck className="h-8 w-8 text-green-600 mb-2" />
              <p className="font-medium text-green-900">Verify Recruiters</p>
              <p className="text-sm text-green-600">Review pending recruiter applications</p>
            </button>
                        
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <p className="font-medium text-purple-900">View Reports</p>
              <p className="text-sm text-purple-600">Analytics and performance metrics</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}