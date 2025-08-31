import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Download, Calendar, Filter, TrendingUp, 
  Users, Briefcase, GraduationCap, BarChart3 
} from 'lucide-react';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [reportData, setReportData] = useState({});

  const reportTypes = [
    { id: 'overview', name: 'Platform Overview', icon: BarChart3 },
    { id: 'students', name: 'Student Analytics', icon: GraduationCap },
    { id: 'recruiters', name: 'Recruiter Activity', icon: Briefcase },
    { id: 'placements', name: 'Placement Reports', icon: TrendingUp },
    { id: 'engagement', name: 'User Engagement', icon: Users }
  ];

  useEffect(() => {
    // Mock report data - replace with API calls
    const mockData = {
      overview: {
        totalUsers: 1504,
        activeUsers: 892,
        newSignups: 127,
        placementRate: 78.5,
        topSkills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
        monthlyGrowth: 12.3
      },
      students: {
        totalStudents: 1250,
        activeStudents: 734,
        completionRate: 65.8,
        averageScore: 7.4,
        popularCourses: [
          { name: 'Full Stack Development', enrollments: 456 },
          { name: 'Data Science', enrollments: 234 },
          { name: 'Mobile App Development', enrollments: 189 }
        ]
      }
    };
    setReportData(mockData);
  }, [selectedReport, dateRange]);

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last period
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
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={data.totalUsers?.toLocaleString() || '0'}
            change={data.monthlyGrowth}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Users"
            value={data.activeUsers?.toLocaleString() || '0'}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <StatCard
            title="New Signups"
            value={data.newSignups || '0'}
            icon={GraduationCap}
            color="bg-purple-500"
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
              {data.topSkills?.map((skill, index) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-gray-900">{skill}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${90 - (index * 15)}%`}}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{90 - (index * 15)}%</span>
                  </div>
                </div>
              )) || <p className="text-gray-500">No data available</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trend</h3>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart visualization</p>
                <p className="text-sm text-gray-500">Integration needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentReport = () => {
    const data = reportData.students || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={data.totalStudents?.toLocaleString() || '0'}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Students"
            value={data.activeStudents?.toLocaleString() || '0'}
            icon={GraduationCap}
            color="bg-green-500"
          />
          <StatCard
            title="Completion Rate"
            value={`${data.completionRate || 0}%`}
            icon={TrendingUp}
            color="bg-purple-500"
          />
                    <StatCard
            title="Average Score"
            value={data.averageScore || 0}
            icon={BarChart3}
            color="bg-orange-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Courses</h3>
          <div className="space-y-3">
            {data.popularCourses?.map((course) => (
              <div key={course.name} className="flex items-center justify-between">
                <span className="text-gray-900">{course.name}</span>
                <span className="text-sm text-gray-600">{course.enrollments} enrollments</span>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                  isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200'
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
