// D:\Webathon\project-root\client\src\pages\recruiter\Dashboard.jsx
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

export default function RecruiterDashboard() {
  return (
    <DashboardLayout role="recruiter">
      <h1 className="text-2xl font-bold text-primary">Recruiter Dashboard</h1>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <Link
          to="/recruiter/post-job"
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
        >
          ➕ Post a Job
        </Link>
        <div className="bg-white p-6 rounded-xl shadow">🔍 Search Candidates</div>
      </div>
    </DashboardLayout>
  );
}
