import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, Calendar, Award, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

// Progress Circle Component
const ProgressCircle = ({ count, total, label, color = 'blue' }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${colorClasses[color]}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${colorClasses[color]}`}>{count}/{total}</span>
        </div>
      </div>
      <span className="text-sm text-gray-600 mt-2 text-center">{label}</span>
    </div>
  );
};

// Contribution Graph Component
const ContributionGraph = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();

  // Generate last 6 months of contributions
  const generateContributions = () => {
    const contributions = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const daysInMonth = new Date(2024, monthIndex + 1, 0).getDate();
      const monthData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const level = 0; // start as empty
        monthData.push({ day, level });
      }

      contributions.push({ month: months[monthIndex], days: monthData });
    }
    return contributions;
  };

  const contributions = generateContributions();

  const getLevelColor = (level) => {
    const colors = ['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'];
    return colors[level];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Coding Activity</h3>
      <div className="flex space-x-4 overflow-x-auto">
        {contributions.map((month, monthIndex) => (
          <div key={monthIndex}>
            <div className="text-xs text-gray-500 text-center mb-1">{month.month}</div>
            <div className="grid grid-cols-7 gap-1">
              {month.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)}`}
                  title={`${month.month} ${day.day}: ${day.level} contributions`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [mockInterviews, setMockInterviews] = useState({ completed: 0, total: 5 });

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch profile
        const profileResponse = await fetch('http://localhost:5000/api/auth/profile', { headers });
        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch mock interview history
        const historyResponse = await fetch('http://localhost:5000/api/mockInterview/history', { headers });
        if (!historyResponse.ok) throw new Error('Failed to fetch interview history');
        const historyData = await historyResponse.json();

        // Update mockInterviews state with the count from the API
        const completedCount = historyData.attempts.length;
        setMockInterviews({ completed: completedCount, total: 5 }); // Assuming a total of 5 for now

        // Set recent activities based on fetched history
        const recentActivities = historyData.attempts.slice(0, 5).map(attempt => ({
          id: attempt._id,
          title: `Mock Interview: ${attempt.topic}`,
          type: 'Mock Interview',
          date: new Date(attempt.timestamp).toLocaleDateString(),
          status: 'completed',
          score: attempt.score ? `${attempt.score}/100` : 'N/A',
        }));
        setActivities(recentActivities);

      } catch (err) {
        console.error("Dashboard data fetching error:", err);
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome to your learning portal</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {profile?.profile_photo ? (
                  <img
                    src={`http://localhost:5000/api/auth/profile/photo/${profile.id}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover mb-4"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
                <p className="text-gray-600">{profile?.department}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm">{profile?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm">Roll: {profile?.roll_no}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm">{profile?.year_of_study}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm">CGPA: {profile?.cgpa}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress and Activity Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bars */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Learning Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ProgressCircle count={mockInterviews.completed} total={mockInterviews.total} label="Mock Interviews" color="blue" />
                <ProgressCircle count={0} total={10} label="Coding Battles" color="green" />
                <ProgressCircle count={0} total={20} label="Technical Skills" color="purple" />
                <ProgressCircle count={0} total={100} label="Overall Score" color="orange" />
              </div>
            </div>

            {/* Contribution Graph */}
            <ContributionGraph />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === 'Mock Interview' ? 'bg-blue-100' : 'bg-green-100'
                      }`}
                    >
                      {activity.type === 'Mock Interview' ? '🎤' : '💻'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600">
                        {activity.type} • {activity.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        activity.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {activity.status}
                    </span>
                    {activity.score && (
                      <p className="text-sm text-gray-600 mt-1">Score: {activity.score}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent activities to display.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}