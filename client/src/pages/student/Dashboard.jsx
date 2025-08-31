import Layout from "../../components/Layout";

export default function StudentDashboard() {
  return (
    <Layout role="student">
      <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">📄 Resume Upload</div>
        <div className="bg-white p-6 rounded-xl shadow">🎤 Mock Interview</div>
        <div className="bg-white p-6 rounded-xl shadow">💻 Coding Battleground</div>
      </div>
    </Layout>
  );
}
