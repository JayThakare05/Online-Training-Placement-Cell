import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Mail, Calendar, Phone, MapPin, Award, BookOpen, FileText, Save, Camera } from 'lucide-react';

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    contact: '',
    address: '',
    roll_no: '',
    college: '',
    department: '',
    year_of_study: '',
    cgpa: '',
    marks_10: '',
    marks_12: '',
    backlogs: 0,
    skills: '',
    certifications: '',
    projects: '',
    resume_url: '',
    job_roles: '',
    job_locations: '',
    placement_status: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

// Update the fetchProfile function in your StudentProfile component

const fetchProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Fetched profile data:', data); // Debug log

      // Pre-fill input fields with fetched values
      setProfile({
        name: data.name || '',
        email: data.email || '',
        dob: data.dob || '', // This should now be in YYYY-MM-DD format
        gender: data.gender || '',
        contact: data.contact || '',
        address: data.address || '',
        roll_no: data.roll_no || '',
        college: data.college || '',
        department: data.department || '',
        year_of_study: data.year_of_study || '',
        cgpa: data.cgpa || '',
        marks_10: data.marks_10 || '',
        marks_12: data.marks_12 || '',
        backlogs: data.backlogs || 0,
        skills: data.skills || '',
        certifications: data.certifications || '',
        projects: data.projects || '',
        resume_url: data.resume_url || '',
        job_roles: data.job_roles || '',
        job_locations: data.job_locations || '',
        placement_status: data.placement_status || '',
        id: data.id // Use consistent ID field
      });

      // Set photo URL if profile_photo exists
      if (data.profile_photo) {
        setPhotoUrl(`http://localhost:5000/api/profile/photo/${data.id}?t=${Date.now()}`);
      }
    } else {
      const err = await response.json();
      setError(err.message || 'Failed to fetch profile');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    setError('Network error while fetching profile');
  }
};

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
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
      
      // Validate file size (e.g., max 5MB)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData to handle both profile data and photo
      const formData = new FormData();
      
      // Add profile fields
      Object.keys(profile).forEach(key => {
        if (profile[key] !== null && profile[key] !== undefined) {
          formData.append(key, profile[key]);
        }
      });
      
      // Add photo if selected
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        
        // Update photo URL if new photo was uploaded
        if (selectedPhoto) {
          setPhotoUrl(`http://localhost:5000/api/profile/photo/${profile.id}?t=${Date.now()}`);
          setSelectedPhoto(null);
          setPhotoPreview(null);
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPhotoSrc = () => {
    if (photoPreview) return photoPreview;
    if (photoUrl) return photoUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&size=96`;
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
                alt={profile.name}
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  // fallback if image fails to load
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&size=96`;
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
              <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
              <p className="text-gray-600">Manage your account and academic information</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={profile.dob}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={profile.contact}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    name="roll_no"
                    value={profile.roll_no}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={profile.college}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  <input
                    type="text"
                    name="year_of_study"
                    value={profile.year_of_study}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="inline h-4 w-4 mr-1" />
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpa"
                    value={profile.cgpa}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    10th Marks (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="marks_10"
                    value={profile.marks_10}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    12th Marks (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="marks_12"
                    value={profile.marks_12}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backlogs
                  </label>
                  <input
                    type="number"
                    name="backlogs"
                    value={profile.backlogs}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    Skills
                  </label>
                  <textarea
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications
                  </label>
                  <textarea
                    name="certifications"
                    value={profile.certifications}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Projects
                  </label>
                  <textarea
                    name="projects"
                    value={profile.projects}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume URL
                  </label>
                  <input
                    type="url"
                    name="resume_url"
                    value={profile.resume_url}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Roles
                  </label>
                  <input
                    type="text"
                    name="job_roles"
                    value={profile.job_roles}
                    onChange={handleChange}
                    placeholder="e.g., Software Developer, Data Analyst"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Locations
                  </label>
                  <input
                    type="text"
                    name="job_locations"
                    value={profile.job_locations}
                    onChange={handleChange}
                    placeholder="e.g., Mumbai, Bangalore, Remote"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placement Status
                  </label>
                  <select
                    name="placement_status"
                    value={profile.placement_status}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="Placed">Placed</option>
                    <option value="Unplaced">Unplaced</option>
                    <option value="Internship">Internship</option>
                  </select>
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
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}