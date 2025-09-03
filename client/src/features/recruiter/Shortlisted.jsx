import DashboardLayout from "../../components/DashboardLayout";
export default function Shortlisted() {
  const shortlisted = [
    { name: "Ananya Sharma", role: "Frontend Developer" },
    { name: "Ravi Kumar", role: "Data Scientist" }
  ];

  return (
    <DashboardLayout>
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Shortlisted Candidates</h2>
      <div className="space-y-3">
        {shortlisted.map((cand, i) => (
          <div key={i} className="p-4 border rounded shadow-sm bg-green-50">
            <h3 className="font-semibold">{cand.name}</h3>
            <p className="text-gray-600">{cand.role}</p>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}
