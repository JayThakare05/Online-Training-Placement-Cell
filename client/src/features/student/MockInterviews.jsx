import DashboardLayout from "../../components/DashboardLayout";

export default function MockInterviews() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Mock Interviews</h1>
        <p className="text-gray-600">Schedule and practice interview sessions.</p>

        <div className="mt-6">
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Schedule Interview
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}