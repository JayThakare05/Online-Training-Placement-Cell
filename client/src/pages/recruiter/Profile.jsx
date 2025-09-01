import { useState, useEffect, useRef } from "react";
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
    name: "",
    email: "",
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
  const [photoUrl, setPhotoUrl] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log('Fetching profile...');
      
      const response = await fetch(
        "http://localhost:5000/api/auth/recruiter-profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched recruiter profile:', data);
        
        // Set all profile fields with defaults
        setProfile({
          name: data.name || "",
          email: data.email || "",
          company_name: data.company_name || "",
          industry_type: data.industry_type || "",
          website: data.website || "",
          contact_number: data.contact_number || "",
          recruiter_name: data.recruiter_name || "",
          designation: data.designation || "",
          job_title: data.job_title || "",
          job_description: data.job_description || "",
          required_skills: data.required_skills || "",
          eligibility: data.eligibility || "",
          salary_package: data.salary_package || "",
          job_location: data.job_location || "",
          id: data.id,
          recruiter_id: data.recruiter_id
        });

        // Set photo URL if profile_photo exists
        if (data.profile_photo && data.id) {
          setPhotoUrl(`http://localhost:5000/api/auth/recruiter-photo/${data.id}?t=${Date.now()}`);
        }
      } else {
        const err = await response.json();
        console.error('Error response:', err);
        setError(err.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error("Error fetching recruiter profile:", error);
      setError('Network error while fetching profile');
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

// Updated handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      // Create FormData to handle both profile data and photo
      const formData = new FormData();
      
      // Add profile fields (exclude undefined/null values)
      Object.keys(profile).forEach(key => {
        if (key !== 'id' && profile[key] !== null && profile[key] !== undefined) {
          formData.append(key, profile[key]);
        }
      });
      
      // Add photo if selected
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      // Debug: Log what we're sending
      console.log('Sending update request...');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/recruiter-profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
            // Don't set Content-Type for FormData
          },
          body: formData,
        }
      );

      const responseData = await response.json();
      console.log('Update response:', responseData);

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        
        // Update photo URL if new photo was uploaded
        if (selectedPhoto && profile.id) {
          setPhotoUrl(`http://localhost:5000/api/auth/recruiter-photo/${profile.id}?t=${Date.now()}`);
          setSelectedPhoto(null);
          setPhotoPreview(null);
        }
        
        // Small delay before refreshing to ensure database update is complete
        setTimeout(async () => {
          await fetchProfile();
          console.log('Profile refreshed after update');
        }, 500);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(responseData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Update error:', error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPhotoSrc = () => {
    if (photoPreview) return photoPreview;
    if (photoUrl) return photoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.company_name || profile.name || 'Company')}&size=96&background=3b82f6&color=ffffff`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={getCurrentPhotoSrc()}
                alt={profile.company_name || profile.name}
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.company_name || 'Company')}&size=96&background=3b82f6&color=ffffff`;
                }}
              />

              <button 
                type="button"
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg"
                title="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Recruiter Profile
              </h1>
              <p className="text-gray-600">
                Manage your company and job posting information
              </p>
              {selectedPhoto && (
                <p className="text-sm text-blue-600 mt-1">
                  New photo selected: {selectedPhoto.name}
                </p>
              )}
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

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-1" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={profile.company_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Website
                  </label>
                    <input
                      type="text"   // instead of "url"
                      name="website"
                      value={profile.website}
                      onChange={handleChange}
                      placeholder="https://company.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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