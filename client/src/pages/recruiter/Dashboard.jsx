import DashboardLayout from "../../components/DashboardLayout";

export default function RecruiterDashboard() {
  return (
    <DashboardLayout role="recruiter">
      <h1 className="text-2xl font-bold text-primary">Recruiter Dashboard</h1>
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">➕ Post a Job</div>
        <div className="bg-white p-6 rounded-xl shadow">🔍 Search Candidates</div>
      </div>
    </DashboardLayout>
  );
}
