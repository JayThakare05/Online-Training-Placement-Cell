import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from localStorage or API
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // You'll replace this with actual API call to get user details
    setUser({
      name: 'John Doe', // Will come from API
      email: 'john@example.com', // Will come from API
      role: role,
      avatar: null // Will come from API or default
    });
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          user={user} 
          onToggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
