import DashboardLayout from "../../components/DashboardLayout";

export default function StudentDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome to your learning portal</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Resume Upload</h3>
                <p className="text-sm text-gray-600">Manage your resume</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">🎤</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mock Interview</h3>
                <p className="text-sm text-gray-600">Practice interviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <span className="text-2xl">💻</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Coding Battleground</h3>
                <p className="text-sm text-gray-600">Coding challenges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional sections can go here */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <p className="text-gray-600">No recent activities to display.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}