import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with closed on mobile
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // 🔹 Fetch user details from backend
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // send token
          },
        });
        const data = await res.json();
        if (res.ok) {
          setUser({
            id: data.id,   // ✅ keep user id
            name: data.name,
            email: data.email,
            role: data.role,
            avatar: data.avatar || null, // if you plan to add avatar later
          });
        } else {
          // if token invalid, redirect to login
          localStorage.clear();
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.clear();
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // Keep sidebar closed by default on all screen sizes
  // Remove the resize listener since we want consistent behavior

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
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
      <Sidebar 
        isOpen={sidebarOpen} 
        user={user} 
        onClose={closeSidebar}
      />
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