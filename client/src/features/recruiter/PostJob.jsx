import { useState, useEffect } from "react";
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
  
  const [recruiterInfo, setRecruiterInfo] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [postedJobs, setPostedJobs] = useState([]); // New state for posted jobs
  const [jobsLoading, setJobsLoading] = useState(false); // Loading state for jobs

  // Fetch recruiter info and verification status on component mount
  useEffect(() => {
    Promise.all([fetchRecruiterInfo(), fetchVerificationStatus()])
      .finally(() => setPageLoading(false));
  }, []);

  // Fetch posted jobs when recruiter info is available and verified
  useEffect(() => {
    if (recruiterInfo && verificationStatus?.status === "approved") {
      fetchPostedJobs();
    }
  }, [recruiterInfo, verificationStatus]);

  const fetchRecruiterInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/recruiter-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecruiterInfo(data);
      }
    } catch (error) {
      console.error('Error fetching recruiter info:', error);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/recruiter/verification-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  // New function to fetch posted jobs
  const fetchPostedJobs = async () => {
    try {
      setJobsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/jobs/recruiter/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPostedJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation (can be bypassed, so backend validation is crucial)
    if (verificationStatus?.status !== "approved") {
      alert('Your account must be verified before posting jobs');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const jobPostData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        salary: formData.salary,
        skills: formData.skills,
        type: formData.type,
      };

      const response = await fetch('http://localhost:5000/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobPostData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Job posted successfully!');
        
        // Reset form
        setFormData({
          title: "",
          description: "",
          location: "",
          salary: "",
          skills: "",
          type: "Full-time",
        });
        
        // Refresh the posted jobs list
        fetchPostedJobs();
      } else {
        const error = await response.json();
        alert('Error posting job: ' + error.message);
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('Error posting job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching initial data
  if (pageLoading) {
    return (
      <DashboardLayout role="recruiter">
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
          <div className="flex justify-center items-center py-12">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show verification status message if not verified
  const renderVerificationStatus = () => {
    if (!verificationStatus) return null;

    const statusStyles = {
      pending: "bg-yellow-50 border-yellow-200 text-yellow-800",
      rejected: "bg-red-50 border-red-200 text-red-800",
      approved: "bg-green-50 border-green-200 text-green-800"
    };

    const statusIcons = {
      pending: "⏳",
      rejected: "❌",
      approved: "✅"
    };

    return (
      <div className={`mb-6 p-4 border rounded-lg ${statusStyles[verificationStatus.status]}`}>
        <div className="flex items-center gap-2">
          <span>{statusIcons[verificationStatus.status]}</span>
          <div>
            <h3 className="font-semibold">Account Verification Status: {verificationStatus.status.charAt(0).toUpperCase() + verificationStatus.status.slice(1)}</h3>
            <p className="text-sm mt-1">{verificationStatus.message}</p>
            {verificationStatus.company_name && (
              <p className="text-sm mt-1">Company: {verificationStatus.company_name}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Function to render posted jobs
  const renderPostedJobs = () => {
    if (!postedJobs.length) return null;

    return (
      <div className="mt-10">
        <h2 className="text-xl font-bold text-primary mb-4">Your Posted Jobs</h2>
        <div className="space-y-4">
          {postedJobs.map(job => (
            <div key={job._id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{job.type} • {job.location}</p>
              <p className="text-sm mt-2">{job.description.substring(0, 100)}...</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  Posted: {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  job.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-2 flex space-x-2">
                <span className="text-sm text-blue-600">{job.applications.count} applications</span>
                <span className="text-sm text-gray-600">{job.likes.count} likes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isFormDisabled = verificationStatus?.status !== "approved";

  return (
    <DashboardLayout role="recruiter">
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-primary mb-6">Post a New Job</h1>

        {/* Verification Status */}
        {renderVerificationStatus()}

        {/* Recruiter Info */}
        {recruiterInfo && verificationStatus?.status === "approved" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-700">Posting as:</h3>
            <p className="text-sm text-gray-600">
              {recruiterInfo.recruiter_name || recruiterInfo.name} - {recruiterInfo.company_name}
            </p>
          </div>
        )}

        {/* Form */}
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
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isFormDisabled}
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Description</label>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role, responsibilities, and requirements..."
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isFormDisabled}
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
              placeholder="e.g. Pune, India / Remote"
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isFormDisabled}
            />
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Salary Range</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. ₹8-12 LPA"
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isFormDisabled}
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
              placeholder="e.g. React, Node.js, MongoDB, Python"
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required
              disabled={isFormDisabled}
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-primary ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={isFormDisabled}
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
            disabled={isFormDisabled || loading}
            className={`w-full py-3 rounded-lg transition ${
              isFormDisabled 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-orange-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Posting Job...' : 
             isFormDisabled ? 'Account Verification Required' : 
             'Post Job'}
          </button>
        </form>

        {/* Help text for unverified users */}
        {verificationStatus?.status !== "approved" && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {verificationStatus?.status === 'pending' && (
              <p>Your account is under review. You'll be able to post jobs once verified.</p>
            )}
            {verificationStatus?.status === 'rejected' && (
              <p>Please contact support to resolve your account verification issues.</p>
            )}
          </div>
        )}

        {/* Posted Jobs Section */}
        {verificationStatus?.status === "approved" && (
          <>
            {jobsLoading ? (
              <div className="mt-10 flex justify-center">
                <div className="text-lg">Loading your posted jobs...</div>
              </div>
            ) : (
              renderPostedJobs()
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}