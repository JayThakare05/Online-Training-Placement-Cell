import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Download, Calendar, Filter, TrendingUp, 
  Users, Briefcase, GraduationCap, BarChart3, 
  CheckCircle, Clock, Building
} from 'lucide-react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    { id: 'overview', name: 'Platform Overview', icon: BarChart3 },
    { id: 'students', name: 'Student Analytics', icon: GraduationCap },
    { id: 'recruiters', name: 'Recruiter Activity', icon: Briefcase },
    { id: 'placements', name: 'Placement Reports', icon: TrendingUp },
    { id: 'engagement', name: 'User Engagement', icon: Users }
  ];

  // Function to get date range filter for SQL queries
  const getDateFilter = () => {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'last7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return startDate.toISOString().split('T')[0];
  };

  // Fetch platform overview data
  const fetchOverviewData = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = getDateFilter();
      
      const response = await fetch(`http://localhost:5000/api/reports/overview?startDate=${startDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch overview data');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching overview data:', error);
      throw error;
    }
  };

  // Fetch student analytics data
  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = getDateFilter();
      
      const response = await fetch(`http://localhost:5000/api/reports/students?startDate=${startDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch student data');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching student data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data = {};
        
        if (selectedReport === 'overview') {
          data.overview = await fetchOverviewData();
        } else if (selectedReport === 'students') {
          data.students = await fetchStudentData();
        }
        
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [selectedReport, dateRange]);

  const StatCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from previous period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const renderOverviewReport = () => {
    const data = reportData.overview || {};
    
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={data.totalUsers?.toLocaleString() || '0'}
            change={data.userGrowth}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Verified Recruiters"
            value={data.verifiedRecruiters?.toLocaleString() || '0'}
            icon={CheckCircle}
            color="bg-green-500"
            subtitle="Active companies"
          />
          <StatCard
            title="New Registrations"
            value={data.newSignups || '0'}
            icon={GraduationCap}
            color="bg-purple-500"
            subtitle={`Last ${dateRange.replace('last', '').replace('days', ' days')}`}
          />
          <StatCard
            title="Placement Rate"
            value={`${data.placementRate || 0}%`}
            icon={Briefcase}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills in Demand</h3>
            <div className="space-y-3">
              {data.topSkills?.length > 0 ? data.topSkills.map((skill, index) => (
                <div key={skill.skill} className="flex items-center justify-between">
                  <span className="text-gray-900">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${skill.percentage}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{skill.count} jobs</span>
                  </div>
                </div>
              )) : <p className="text-gray-500">No data available</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Students</span>
                <span className="text-blue-600 font-semibold">{data.studentRegistrations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Recruiters</span>
                <span className="text-green-600 font-semibold">{data.recruiterRegistrations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Admins</span>
                <span className="text-purple-600 font-semibold">{data.adminRegistrations || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentReport = () => {
    const data = reportData.students || {};
    
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Students"
            value={data.totalStudents?.toLocaleString() || '0'}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Placed Students"
            value={data.placedStudents?.toLocaleString() || '0'}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Job Ready"
            value={data.jobReadyStudents?.toLocaleString() || '0'}
            icon={TrendingUp}
            color="bg-purple-500"
            subtitle="With resume & skills"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Departments</h3>
            <div className="space-y-3">
              {data.topDepartments?.length > 0 ? data.topDepartments.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <span className="text-gray-900">{dept.department || 'Not specified'}</span>
                  <span className="text-sm text-gray-600">{dept.count} students</span>
                </div>
              )) : <p className="text-gray-500">No data available</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Colleges</h3>
            <div className="space-y-3">
              {data.topColleges?.length > 0 ? data.topColleges.map((college) => (
                <div key={college.college} className="flex items-center justify-between">
                  <span className="text-gray-900">{college.college || 'Not specified'}</span>
                  <span className="text-sm text-gray-600">{college.count} students</span>
                </div>
              )) : <p className="text-gray-500">No data available</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (error) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600">Error loading report data: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'students':
        return renderStudentReport();
      default:
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 text-center">
            Report view for <strong>{selectedReport}</strong> is under construction.
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Analyze platform and user performance</p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>

            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="flex space-x-4 overflow-x-auto">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isActive = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border whitespace-nowrap ${
                  isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{report.name}</span>
              </button>
            );
          })}
        </div>

        {/* Report Content */}
        <div>
          {renderReport()}
        </div>
      </div>
    </DashboardLayout>
  );
}