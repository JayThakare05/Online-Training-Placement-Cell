import DashboardLayout from "../../components/DashboardLayout";

export default function JobApplications() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
        <p className="text-gray-600">Track and manage your job applications.</p>

        <table className="w-full mt-6 border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Date Applied</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">—</td>
              <td className="p-3">—</td>
              <td className="p-3">—</td>
              <td className="p-3">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}