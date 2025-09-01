import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, GraduationCap, Loader, Edit, Trash2, Save, X, Upload, Eye } from "lucide-react";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    setShowModal(true);
  };

  const handleChange = (e, field) => {
    const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
    setEditData({ ...editData, [field]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setEditData({ ...editData, profile_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const convertBlobToBase64 = (blob) => {
    if (!blob) return null;
    // If it's already a base64 string, return as is
    if (typeof blob === 'string' && blob.startsWith('data:')) {
      return blob;
    }
    // Convert blob to base64
    return `data:image/jpeg;base64,${blob}`;
  };

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      
      // Format date properly for MySQL DATE column
      const formattedData = { ...editData };
      if (formattedData.dob) {
        const date = new Date(formattedData.dob);
        formattedData.dob = date.toISOString().split('T')[0];
      }

      // Handle profile photo
      if (selectedImage) {
        formattedData.profile_photo = selectedImage;
      }
      
      const res = await fetch(`http://localhost:5000/api/auth/admin/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formattedData,
          isPlaced: formattedData.isPlaced === "Yes" || formattedData.isPlaced === 1 ? 1 : 0,
        }),
      });

      if (res.ok) {
        fetchStudents();
        setEditingId(null);
        setShowModal(false);
        setSelectedImage(null);
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

  const closeModal = () => {
    setEditingId(null);
    setShowModal(false);
    setSelectedImage(null);
    setEditData({});
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
                  <th className="px-4 py-2 border">Photo</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">DOB</th>
                  <th className="px-4 py-2 border">Gender</th>
                  <th className="px-4 py-2 border">Contact</th>
                  <th className="px-4 py-2 border">Roll No</th>
                  <th className="px-4 py-2 border">College</th>
                  <th className="px-4 py-2 border">Dept</th>
                  <th className="px-4 py-2 border">Year</th>
                  <th className="px-4 py-2 border">CGPA</th>
                  <th className="px-4 py-2 border">10th %</th>
                  <th className="px-4 py-2 border">12th %</th>
                  <th className="px-4 py-2 border">Backlogs</th>
                  <th className="px-4 py-2 border">Skills</th>
                  <th className="px-4 py-2 border">Resume</th>
                  <th className="px-4 py-2 border">Job Roles</th>
                  <th className="px-4 py-2 border">Locations</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Placed?</th>
                  <th className="px-4 py-2 border">Registered</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.student_id} className="hover:bg-gray-50">
                      {/* Profile Photo */}
                      <td className="px-4 py-2 border">
                        {s.profile_photo ? (
                          <img
                            src={convertBlobToBase64(s.profile_photo)}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 border">{s.name}</td>
                      <td className="px-4 py-2 border">{s.email}</td>
                      <td className="px-4 py-2 border">
                        {s.dob ? new Date(s.dob).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 border">{s.gender || 'N/A'}</td>
                      <td className="px-4 py-2 border">{s.contact || 'N/A'}</td>
                      <td className="px-4 py-2 border">{s.roll_no || 'N/A'}</td>
                      <td className="px-4 py-2 border">{s.college}</td>
                      <td className="px-4 py-2 border">{s.department}</td>
                      <td className="px-4 py-2 border">{s.year_of_study}</td>
                      <td className="px-4 py-2 border">{s.cgpa}</td>
                      <td className="px-4 py-2 border">{s.marks_10 || 'N/A'}</td>
                      <td className="px-4 py-2 border">{s.marks_12 || 'N/A'}</td>
                      <td className="px-4 py-2 border">{s.backlogs || 0}</td>
                      <td className="px-4 py-2 border max-w-xs">
                        <div className="truncate" title={s.skills}>
                          {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}
                        </div>
                      </td>
                      <td className="px-4 py-2 border">
                        {s.resume_url ? (
                          <a
                            href={s.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-2 border max-w-xs">
                        <div className="truncate" title={s.job_roles}>
                          {s.job_roles || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-2 border max-w-xs">
                        <div className="truncate" title={s.job_locations}>
                          {s.job_locations || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-2 border">{s.placement_status || 'N/A'}</td>
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
                      <td className="px-4 py-2 border">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Student"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.student_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Student"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="22" className="text-center py-4 text-gray-500">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

                {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto m-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Student Details</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* --- same grid you already had --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Photo */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {(selectedImage || editData.profile_photo) && (
                      <img
                        src={selectedImage || convertBlobToBase64(editData.profile_photo)}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                    )}
                    <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    value={editData.name || ''}
                    onChange={(e) => handleChange(e, "name")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleChange(e, "email")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange(e, "dob")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => handleChange(e, "gender")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                  <input
                    value={editData.contact || ''}
                    onChange={(e) => handleChange(e, "contact")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Roll Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    value={editData.roll_no || ''}
                    onChange={(e) => handleChange(e, "roll_no")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <input
                    value={editData.college || ''}
                    onChange={(e) => handleChange(e, "college")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    value={editData.department || ''}
                    onChange={(e) => handleChange(e, "department")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                  <select
                    value={editData.year_of_study || ''}
                    onChange={(e) => handleChange(e, "year_of_study")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* CGPA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editData.cgpa || ''}
                    onChange={(e) => handleChange(e, "cgpa")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 10th Marks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">10th Marks (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editData.marks_10 || ''}
                    onChange={(e) => handleChange(e, "marks_10")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 12th Marks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">12th Marks (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editData.marks_12 || ''}
                    onChange={(e) => handleChange(e, "marks_12")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Backlogs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    value={editData.backlogs || ''}
                    onChange={(e) => handleChange(e, "backlogs")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Placement Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placement Status</label>
                  <input
                    value={editData.placement_status || ''}
                    onChange={(e) => handleChange(e, "placement_status")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Is Placed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Is Placed</label>
                  <select
                    value={editData.isPlaced ? "Yes" : "No"}
                    onChange={(e) => handleChange(e, "isPlaced")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editData.address || ''}
                    onChange={(e) => handleChange(e, "address")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Skills */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <textarea
                    value={editData.skills || ''}
                    onChange={(e) => handleChange(e, "skills")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Certifications */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <textarea
                    value={editData.certifications || ''}
                    onChange={(e) => handleChange(e, "certifications")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Projects */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                  <textarea
                    value={editData.projects || ''}
                    onChange={(e) => handleChange(e, "projects")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Roles</label>
                  <input
                    value={editData.job_roles || ''}
                    onChange={(e) => handleChange(e, "job_roles")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Locations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Locations</label>
                  <input
                    value={editData.job_locations || ''}
                    onChange={(e) => handleChange(e, "job_locations")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Resume URL */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume URL</label>
                  <input
                    value={editData.resume_url || ''}
                    onChange={(e) => handleChange(e, "resume_url")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editData.student_id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}