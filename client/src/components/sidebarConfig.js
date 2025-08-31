const sidebarConfig = {
  student: [
    { name: "Dashboard", path: "/student/dashboard", icon: "🏠" },
    { name: "Resume Upload", path: "/student/resume", icon: "📄" },
    { name: "Mock Interview", path: "/student/interview", icon: "🎤" },
    { name: "Coding Battleground", path: "/student/coding", icon: "💻" },
  ],
  recruiter: [
    { name: "Dashboard", path: "/recruiter/dashboard", icon: "🏠" },
    { name: "Post Job", path: "/recruiter/jobs", icon: "➕" },
    { name: "Search Candidates", path: "/recruiter/search", icon: "🔍" },
  ],
  admin: [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { name: "Manage Content", path: "/admin/content", icon: "📝" },
    { name: "Monitor Users", path: "/admin/users", icon: "👥" },
  ],
};

export default sidebarConfig;
