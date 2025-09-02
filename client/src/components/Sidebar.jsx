import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, FileText, BarChart, Settings, 
  UserCheck, Briefcase, BookOpen, Trophy,
  Calendar, MessageSquare, Search, Upload,
  GraduationCap,Book   // ✅ add this
} from 'lucide-react';


// Navigation configs for different roles
const navigationConfig = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'Manage Training', path: '/admin/training', icon: BookOpen },
    { name: "Manage Students", path: "/admin/manage-students", icon: GraduationCap },
    { name: 'Verify Recruiters', path: '/admin/verify', icon: UserCheck },
    // { name: 'Monitor Data', path: '/admin/monitor', icon: BarChart },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ],
  recruiter: [
    { name: 'Dashboard', path: '/recruiter/dashboard', icon: Home },
    { name: 'Post Jobs', path: '/recruiter/post-job', icon: Briefcase },
    { name: 'Search Candidates', path: '/recruiter/search', icon: Search },
    { name: 'Shortlisted', path: '/recruiter/shortlisted', icon: Users },
    { name: 'Job Fair', path: '/recruiter/jobfair', icon: Calendar },
    { name: 'Messages', path: '/recruiter/messages', icon: MessageSquare }
  ],
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Upload Resume', path: '/student/resume', icon: Upload },
    { name: 'Coding Battle', path: '/student/coding', icon: Trophy },
    { name: 'Courses', path: '/student/courses', icon: Book},
    { name: 'Mock Interviews', path: '/student/interviews', icon: MessageSquare },
    { name: 'Job Applications', path: '/student/applications', icon: Briefcase },
    { name: 'Profile', path: '/student/profile', icon: Users }
  ]
};

export default function Sidebar({ isOpen, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = navigationConfig[user.role] || [];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => {}} // Handle mobile close
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0'} lg:w-64
        bg-white shadow-lg border-r border-gray-200
        flex flex-col
      `}>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CT</span>
            </div>
            <span className="font-semibold text-gray-800">Career Training</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  text-left transition-colors duration-200
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}