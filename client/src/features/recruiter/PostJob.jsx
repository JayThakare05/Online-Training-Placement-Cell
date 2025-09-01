// D:\Webathon\project-root\client\src\features\recruiter\PostJob.jsx
import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function PostJob() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    skills: "",
    type: "Full-time",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Job Posted:", formData);
    alert("Job posted successfully!");

    // 🔗 Later connect with backend API:
    // fetch("/api/recruiter/jobs", { method: "POST", body: JSON.stringify(formData) })
  };

  return (
    <DashboardLayout role="recruiter">
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-primary mb-6">➕ Post a New Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
              required
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role and responsibilities..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Pune, India"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Salary</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. ₹8 LPA"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
            />
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills Required</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, MongoDB"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-orange-600 transition"
          >
            Post Job
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
