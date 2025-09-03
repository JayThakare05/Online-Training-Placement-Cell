import DashboardLayout from "../../components/DashboardLayout";
export default function JobFair() {
  const jobFairs = [
    { title: "Tech Hiring Drive 2025", date: "10 Sep 2025", location: "Mumbai" },
    { title: "AI & Data Science Fair", date: "20 Sep 2025", location: "Bangalore" }
  ];

  return (
    <DashboardLayout>
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Upcoming Job Fairs</h2>
      <div className="space-y-3">
        {jobFairs.map((fair, i) => (
          <div key={i} className="p-4 border rounded shadow-sm">
            <h3 className="font-semibold">{fair.title}</h3>
            <p className="text-gray-600">📅 {fair.date}</p>
            <p className="text-gray-600">📍 {fair.location}</p>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}
