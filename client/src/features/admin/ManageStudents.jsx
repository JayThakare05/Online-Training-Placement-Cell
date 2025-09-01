import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, GraduationCap, Loader, Edit, Trash2, Save, X } from "lucide-react";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.student_id);
    setEditData({ ...student });
  };

  const handleChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/auth/admin/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editData,
          isPlaced: editData.isPlaced === "Yes" || editData.isPlaced === 1 ? 1 : 0,
        }),
      });

      if (res.ok) {
        fetchStudents();
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error updating student:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/auth/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setStudents(students.filter((s) => s.student_id !== id));
      }
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <GraduationCap className="w-6 h-6 text-orange-600" />
          Manage Students
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg shadow-md">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">College</th>
                  <th className="px-4 py-2 border">Dept</th>
                  <th className="px-4 py-2 border">Year</th>
                  <th className="px-4 py-2 border">CGPA</th>
                  <th className="px-4 py-2 border">Skills</th>
                  <th className="px-4 py-2 border">Resume</th>
                  <th className="px-4 py-2 border">Placed?</th>
                  <th className="px-4 py-2 border">Registered</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      {editingId === s.student_id ? (
                        <>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.name}
                              onChange={(e) => handleChange(e, "name")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.email}
                              onChange={(e) => handleChange(e, "email")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.college}
                              onChange={(e) => handleChange(e, "college")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.department}
                              onChange={(e) => handleChange(e, "department")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.year_of_study}
                              onChange={(e) => handleChange(e, "year_of_study")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.cgpa}
                              onChange={(e) => handleChange(e, "cgpa")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            <input
                              value={editData.skills}
                              onChange={(e) => handleChange(e, "skills")}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            {s.resume_url ? (
                              <a
                                href={s.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                View Resume
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-2 border">
                            <select
                              value={editData.isPlaced ? "Yes" : "No"}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  isPlaced: e.target.value,
                                })
                              }
                              className="border p-1"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 border">
                            {new Date(s.registered).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 border flex gap-2">
                            <button
                              onClick={() => handleSave(s.student_id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 border">{s.name}</td>
                          <td className="px-4 py-2 border">{s.email}</td>
                          <td className="px-4 py-2 border">{s.college}</td>
                          <td className="px-4 py-2 border">{s.department}</td>
                          <td className="px-4 py-2 border">{s.year_of_study}</td>
                          <td className="px-4 py-2 border">{s.cgpa}</td>
                          <td className="px-4 py-2 border">
                            {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}
                          </td>
                          <td className="px-4 py-2 border">
                            {s.resume_url ? (
                              <a
                                href={s.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                View Resume
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-2 border">
                            {s.isPlaced ? (
                              <span className="text-green-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-red-600 font-semibold">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2 border">
                            {new Date(s.registered).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 border flex gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.student_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-gray-500">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
