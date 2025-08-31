import DashboardLayout from '../../components/DashboardLayout';
import { Users, UserCheck, FileText, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  // This would come from API calls
  const stats = {
    totalStudents: 1250,
    totalRecruiters: 89,
    pendingVerifications: 12,
    totalPlacements: 450
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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