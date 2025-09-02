import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";

function JobCard({ job }) {
  // Convert skills to array if it's a string
  const skillsArray = Array.isArray(job.skills) 
    ? job.skills 
    : job.skills 
      ? job.skills.split(',').map(skill => skill.trim()) 
      : [];

  return (
    <div className="bg-white shadow-md rounded-xl border border-gray-200 max-w-xl mx-auto my-6">
      {/* Recruiter Header */}
      <div className="flex items-center p-4 border-b">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            job.recruiter?.name || job.created_by?.name || "User"
          )}&background=random`}
          alt={job.recruiter?.name || job.created_by?.name}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h2 className="font-semibold text-gray-900">
            {job.recruiter?.name || job.created_by?.name}
          </h2>
          <p className="text-sm text-gray-500">{job.recruiter?.email || job.created_by?.email}</p>
          {job.recruiter?.company_name && (
            <p className="text-xs text-gray-400">{job.recruiter.company_name}</p>
          )}
        </div>
      </div>

      {/* Job Info */}
      <div className="px-4 py-3">
        <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
        {job.description && (
          <p className="text-gray-600 mt-1">{job.description}</p>
        )}

        {skillsArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {skillsArray.map((skill, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500 mt-3">
          📍 {job.location || "N/A"} <br />
          💰 {job.salary || "N/A"} | 🕒 {job.type || "N/A"}
        </p>
      </div>

      {/* Apply Button */}
      <div className="px-4 pb-4">
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
          Apply Now
        </button>
      </div>
    </div>
  );
}

export default function JobFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/api/jobs/posts"); // ✅ Correct endpoint
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.jobs) {
          setJobs(data.jobs);
        } else {
          setJobs(data.data || []); // Handle different response structures
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-gray-100 min-h-screen py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading jobs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-gray-100 min-h-screen py-6">
          <div className="text-center text-red-600 mt-10">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Job Feed</h1>
          
          {jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job._id} job={job} />)
          ) : (
            <div className="text-center bg-white p-8 rounded-xl shadow-md">
              <p className="text-gray-500 text-lg">No jobs available at the moment</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for new job postings</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}