import DashboardLayout from "../../components/DashboardLayout";

export default function CodingBattle() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto bg-white shadow-sm border border-gray-200 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Coding Battleground</h1>
        <p className="text-gray-600">Participate in coding challenges and practice problems.</p>

        <div className="mt-6">
          <p className="text-gray-500 italic">No challenges available right now.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}