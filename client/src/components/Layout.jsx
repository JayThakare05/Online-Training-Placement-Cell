import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children, role }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar at top */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar on left */}
        <Sidebar role={role} />

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
