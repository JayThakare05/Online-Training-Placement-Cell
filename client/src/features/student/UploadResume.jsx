import DashboardLayout from "../../components/DashboardLayout";

export default function UploadResume() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
        <p className="text-gray-600">Upload and manage your latest resume.</p>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full p-3 border rounded-lg"
        />

        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          Upload
        </button>
      </div>
    </DashboardLayout>
  );
}