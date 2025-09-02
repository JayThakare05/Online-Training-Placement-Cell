import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Heart, MessageSquare, Send, X, Edit, Trash2, Check, XCircle } from "lucide-react";

function JobCard({ job }) {
  const [likes, setLikes] = useState(job.likes?.count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(job.comments || []);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState({});

  const handleApply = async () => {
  try {
    setApplying(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("You need to be logged in to apply for jobs");
      return;
    }

    const response = await fetch(`http://localhost:5000/api/jobs/posts/${job._id}/apply`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to apply for job");
    }

    // Update application status
    setApplicationStatus(prev => ({
      ...prev,
      [job._id]: { 
        applied: true, 
        message: result.message,
        status: 'applied'
      }
    }));
    
    alert("Application submitted successfully!");
  } catch (error) {
    console.error("Error applying to job:", error);
    alert(error.message || "Failed to apply for job. Please try again.");
  } finally {
    setApplying(false);
  }
};

// Check if user has already applied to this job
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token && job.applications?.applied_users) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const hasApplied = job.applications.applied_users.some(
        app => app.user_id === payload.id
      );
      
      if (hasApplied) {
        setApplicationStatus(prev => ({
          ...prev,
          [job._id]: { 
            applied: true, 
            message: "Already applied",
            status: job.applications.applied_users.find(
              app => app.user_id === payload.id
            )?.status || 'applied'
          }
        }));
      }
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  }
}, [job._id, job.applications?.applied_users]);
  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id);
        
        const userLike = job.likes?.users?.find(like => like.user_id === payload.id);
        setIsLiked(!!userLike);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [job.likes?.users]);

  // Convert skills to array if it's a string
  const skillsArray = Array.isArray(job.skills) 
    ? job.skills 
    : job.skills 
      ? job.skills.split(',').map(skill => skill.trim()) 
      : [];

  const handleLike = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("You need to be logged in to like jobs");
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/jobs/posts/${job._id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to like job");
      }

      const result = await response.json();
      setLikes(result.likes_count);
      setIsLiked(result.liked);
    } catch (error) {
      console.error("Error liking job:", error);
      alert("Failed to like job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setCommentLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("You need to be logged in to comment");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/jobs/posts/${job._id}/comments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const result = await response.json();
      setComments(prev => [...prev, result.comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id || comment.comment_id);
    setEditCommentText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/jobs/posts/${job._id}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: editCommentText.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const result = await response.json();
      setComments(prev => prev.map(comment => 
        comment._id === commentId || comment.comment_id === commentId 
          ? result.comment 
          : comment
      ));
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/jobs/posts/${job._id}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setComments(prev => prev.filter(comment => 
        comment._id !== commentId && comment.comment_id !== commentId
      ));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditComment = (comment) => {
    return currentUserId && comment.user.user_id === currentUserId;
  };

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

      {/* Like and Apply Section */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center gap-1 p-2 rounded-lg transition-colors ${
                isLiked 
                  ? "text-red-500 bg-red-50" 
                  : "text-gray-500 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <Heart 
                size={18} 
                fill={isLiked ? "currentColor" : "none"} 
              />
              <span className="text-sm">{likes}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-gray-500 p-2 rounded-lg hover:text-blue-500 hover:bg-blue-50"
            >
              <MessageSquare size={18} />
              <span className="text-sm">{comments.length}</span>
            </button>
          </div>
          
          <button
  onClick={handleApply}
  disabled={applying || applicationStatus[job._id]?.applied}
  className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
    applicationStatus[job._id]?.applied
      ? "bg-green-600 text-white cursor-not-allowed"
      : applying
      ? "bg-blue-400 text-white cursor-not-allowed"
      : "bg-blue-600 text-white hover:bg-blue-700"
  }`}
>
  <Send size={16} />
  {applying ? "Applying..." : 
   applicationStatus[job._id]?.applied ? 
   `Applied (${applicationStatus[job._id]?.status})` : 
   "Apply Now"}
</button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Comments</h4>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Add Comment Form */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={commentLoading || !newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commentLoading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.comment_id || comment._id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{comment.user.name}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {comment.user.role}
                          </span>
                        </div>
                        
                        {editingCommentId === (comment._id || comment.comment_id) ? (
                          <div className="mb-2">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(comment._id || comment.comment_id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(comment.created_at || comment.createdAt)}
                          {comment.updated_at && " (edited)"}
                        </p>
                      </div>
                      
                      {canEditComment(comment) && editingCommentId !== (comment._id || comment.comment_id) && (
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit comment"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id || comment.comment_id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
        const response = await fetch("http://localhost:5000/api/jobs/posts");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.jobs) {
          setJobs(data.jobs);
        } else {
          setJobs(data.data || []);
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