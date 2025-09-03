import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Search, User, Mail, Phone, GraduationCap, Building, Calendar, FileText, Award } from "lucide-react";

export default function SearchCandidates() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [appliedCandidates, setAppliedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Fetch applied candidates on component load
  useEffect(() => {
    const fetchAppliedCandidates = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to view applied candidates.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:5000/api/jobs/recruiter/applications", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch applied candidates");
        }
        
        const data = await response.json();
        console.log("Fetched applications:", data); // Debug log
        
        if (data.applications) {
          setAppliedCandidates(data.applications);
        }
      } catch (error) {
        console.error("Error fetching applied candidates:", error);
        setError(error.message || "Failed to load candidates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedCandidates();
  }, []);

  // Filter candidates based on the search term
  const handleSearch = () => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) {
      setResults([]);
      return;
    }

    const filteredResults = appliedCandidates.filter(candidate => {
      const nameMatch = candidate.student_name?.toLowerCase().includes(searchTerm);
      const skillsMatch = candidate.skills?.toLowerCase().includes(searchTerm);
      const emailMatch = candidate.email?.toLowerCase().includes(searchTerm);
      const collegeMatch = candidate.college?.toLowerCase().includes(searchTerm);
      const courseMatch = candidate.course?.toLowerCase().includes(searchTerm);
      const jobMatch = candidate.job_title?.toLowerCase().includes(searchTerm);
      
      return nameMatch || skillsMatch || emailMatch || collegeMatch || courseMatch || jobMatch;
    });
    setResults(filteredResults);
  };

  const handleClearSearch = () => {
    setSearch("");
    setResults([]);
  };

  // Helper function to format skills string
  const formatSkills = (skills) => {
    if (!skills || skills === 'N/A') return "Not specified";
    return skills.split(',').map(skill => skill.trim()).join(', ');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800';
      case 'selected': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CandidateCard = ({ candidate, onClick }) => (
    <div 
      className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(candidate)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <User size={18} />
          {candidate.student_name}
        </h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
          {candidate.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p className="flex items-center gap-2">
          <Mail size={14} />
          {candidate.email}
        </p>
        
        <p className="flex items-center gap-2">
          <Award size={14} />
          <span className="font-medium">Skills:</span> {formatSkills(candidate.skills)}
        </p>
        
        <p className="flex items-center gap-2">
          <FileText size={14} />
          <span className="font-medium">Applied for:</span> {candidate.job_title}
        </p>
        
        {candidate.college && candidate.college !== 'N/A' && (
          <p className="flex items-center gap-2">
            <Building size={14} />
            {candidate.college}
          </p>
        )}
        
        <p className="flex items-center gap-2">
          <Calendar size={14} />
          Applied on {formatDate(candidate.applied_at)}
        </p>
      </div>
    </div>
  );

  const CandidateDetailModal = ({ candidate, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Candidate Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} />
                  Personal Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {candidate.student_name}</p>
                  <p><span className="font-medium">Email:</span> {candidate.email}</p>
                  <p><span className="font-medium">Phone:</span> {candidate.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap size={16} />
                  Education
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">College:</span> {candidate.college || 'Not specified'}</p>
                  <p><span className="font-medium">Course:</span> {candidate.course || 'Not specified'}</p>
                  <p><span className="font-medium">Graduation Year:</span> {candidate.graduation_year || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award size={16} />
                  Skills & Bio
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills && candidate.skills !== 'N/A' 
                        ? candidate.skills.split(',').map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {skill.trim()}
                            </span>
                          ))
                        : <span className="text-gray-500">Not specified</span>
                      }
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">Bio:</p>
                    <p className="text-gray-600 italic">
                      {candidate.bio && candidate.bio !== 'N/A' ? candidate.bio : 'No bio provided'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Application Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Applied for:</span> {candidate.job_title}</p>
                  <p><span className="font-medium">Application Date:</span> {formatDate(candidate.applied_at)}</p>
                  <p>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Search Candidates</h2>
          <p className="text-gray-600">Find and review candidates who have applied to your job postings</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search by name, skills, email, college, course, or job title..."
                className="border pl-10 pr-3 py-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
            {search && (
              <button
                onClick={handleClearSearch}
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="text-center text-gray-500 mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg">Loading candidates...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center text-red-600 mt-10 bg-red-50 p-6 rounded-lg">
            <p className="text-lg">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {search && results.length === 0 && (
              <div className="text-center text-gray-500 mt-10 bg-gray-50 p-8 rounded-lg">
                <p className="text-lg">No candidates found matching your search criteria.</p>
                <p className="text-sm mt-2">Try different keywords or clear the search to see all candidates.</p>
              </div>
            )}

            {(results.length > 0 || !search) && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {search ? `Search Results (${results.length})` : `All Applied Candidates (${appliedCandidates.length})`}
                  </h3>
                </div>
                
                {appliedCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(search ? results : appliedCandidates).map((candidate, i) => (
                      <CandidateCard 
                        key={`${candidate.user_id}-${candidate.job_id}-${i}`}
                        candidate={candidate}
                        onClick={setSelectedCandidate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-10 bg-gray-50 p-8 rounded-lg">
                    <p className="text-lg">No candidates have applied to your jobs yet.</p>
                    <p className="text-sm mt-2">Once students start applying, you'll see them here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {selectedCandidate && (
          <CandidateDetailModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}