import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function Shortlisted() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/jobs/recruiter/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      applied: "bg-blue-100 text-blue-800",
      shortlisted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      hired: "bg-purple-100 text-purple-800"
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Job Applications</h2>
        
        {applications.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No applications found for your job posts.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application.application_id} className="p-6 border rounded-lg shadow-sm bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{application.student_name}</h3>
                    <p className="text-gray-600">{application.email}</p>
                  </div>
                  {getStatusBadge(application.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Applied For</h4>
                    <p className="text-gray-700">{application.job_title}</p>
                    <p className="text-sm text-gray-600">Posted on: {new Date(application.job_created_at).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <p className="text-gray-700">Phone: {application.contact || 'Not provided'}</p>
                    <p className="text-gray-700">College: {application.college || 'Not provided'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Academic Details</h4>
                    <p className="text-gray-700">Department: {application.department}</p>
                    <p className="text-gray-700">Year: {application.year_of_study}</p>
                    <p className="text-gray-700">CGPA: {application.cgpa || 'N/A'}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills & Qualifications</h4>
                    <p className="text-gray-700">Skills: {application.skills || 'Not specified'}</p>
                    <p className="text-gray-700">Backlogs: {application.backlogs || 0}</p>
                  </div>
                </div>

                {application.resume_url && (
                  <div className="mt-4">
                    <a
                      href={`http://localhost:5000${application.resume_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}