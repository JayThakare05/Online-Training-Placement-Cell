import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  Camera,
  Globe,
  Briefcase,
  FileText,
  MapPin,
} from "lucide-react";

export default function RecruiterProfile() {
  const [profile, setProfile] = useState({
    company_name: "",
    industry_type: "",
    website: "",
    contact_number: "",
    recruiter_name: "",
    designation: "",
    job_title: "",
    job_description: "",
    required_skills: "",
    eligibility: "",
    salary_package: "",
    job_location: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/recruiters/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching recruiter profile:", error);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/recruiters/profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        }
      );

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-500" />
              </div>
              <button className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Recruiter Profile
              </h1>
              <p className="text-gray-600">
                Manage your company and job posting information
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={profile.company_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Type
                  </label>
                  <input
                    type="text"
                    name="industry_type"
                    value={profile.industry_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handleChange}
                    placeholder="https://company.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={profile.contact_number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Recruiter Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recruiter Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recruiter Name
                  </label>
                  <input
                    type="text"
                    name="recruiter_name"
                    value={profile.recruiter_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={profile.designation}
                    onChange={handleChange}
                    placeholder="e.g., HR Manager"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Job Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={profile.job_title}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Package
                  </label>
                  <input
                    type="text"
                    name="salary_package"
                    value={profile.salary_package}
                    onChange={handleChange}
                    placeholder="e.g., 6 LPA"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Job Description
                  </label>
                  <textarea
                    name="job_description"
                    value={profile.job_description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  <textarea
                    name="required_skills"
                    value={profile.required_skills}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., JavaScript, React, SQL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eligibility
                  </label>
                  <textarea
                    name="eligibility"
                    value={profile.eligibility}
                    onChange={handleChange}
                    rows="2"
                    placeholder="e.g., B.Tech CSE, 60% minimum"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Job Location
                  </label>
                  <input
                    type="text"
                    name="job_location"
                    value={profile.job_location}
                    onChange={handleChange}
                    placeholder="e.g., Bangalore, Hyderabad"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
