import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Book, Users, Clock, Tag, Play, HelpCircle, Code, 
  Folder, FileText, ChevronRight, ChevronDown, Download,
  Eye, File, FileVideo, FileQuestion, FileCode, X,
  CheckCircle, AlertCircle, Loader
} from "lucide-react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [courseContents, setCourseContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const [fileLoading, setFileLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const API_BASE = 'http://localhost:5000/api';
    const API_BASE2 = 'http://localhost:5000';
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/auth/courses`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Filter to only show parent courses (those without a parent_id)
        const parentCourses = data.data.filter(course => !course.parent_id);
        setCourses(parentCourses);
        
        // Check enrollment status for each course
        const statuses = {};
        for (const course of parentCourses) {
          statuses[course._id] = await checkEnrollmentStatus(course._id);
        }
        setEnrollmentStatus(statuses);
        
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/auth/courses/${courseId}/enrollment-status`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.isEnrolled || false;
      }
      return false;
    } catch (err) {
      console.error('Error checking enrollment status:', err);
      return false;
    }
  };

  const fetchCourseContents = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/auth/courses/${courseId}/contents`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCourseContents(prev => ({
          ...prev,
          [courseId]: data.data
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch course contents');
      }
    } catch (err) {
      console.error('Error fetching course contents:', err);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE}/auth/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Update enrollment status
        setEnrollmentStatus(prev => ({
          ...prev,
          [courseId]: true
        }));
        
        // Show success notification
        alert('Enrollment successful!');
      } else {
        alert(`Enrollment failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      alert('Error enrolling in course');
    }
  };

  const toggleFolder = async (courseId, folderId) => {
    // Toggle folder expansion state
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));

    // If folder contents haven't been loaded yet, fetch them
    if (!courseContents[folderId]) {
      try {
        const response = await fetch(`${API_BASE}/auth/courses/${courseId}/contents/${folderId}`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setCourseContents(prev => ({
            ...prev,
            [folderId]: data.data
          }));
        }
      } catch (err) {
        console.error('Error fetching folder contents:', err);
      }
    }
  };

// Updated handleFileClick function with better PDF handling
const handleFileClick = async (file) => {
  // Only allow file viewing for enrolled users
  if (!enrollmentStatus[file.courseId]) {
    alert('Please enroll in the course to access this content');
    return;
  }
  
  setFileLoading(true);
  setFileViewerOpen(true);
  setPdfUrl(null);
  
  try {
    const response = await fetch(`${API_BASE}/auth/contents/${file._id}/view`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type header first
    const contentType = response.headers.get('content-type');
    
    if (contentType === 'application/pdf') {
      // Handle direct PDF buffer response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedFile({
        _id: file._id,
        title: file.title,
        type: 'document',
        fileType: 'pdf',
        isPdf: true,
        url: url // Add URL here for consistency
      });
    } else {
      // Handle JSON response
      const data = await response.json();
      
      if (data.success) {
        const fileData = data.data;
        
        // Prioritize file_url over url for all content types
        if (fileData.file_url) {
          fileData.url = fileData.file_url;
        }
        
        // Convert relative URLs to absolute
        if (fileData.url && fileData.url.startsWith('/')) {
          fileData.url = `${API_BASE2}${fileData.url}`;
        }
        
        // For PDF files from JSON response, create blob URL for iframe compatibility
        if (fileData.url && (fileData.fileType === 'pdf' || fileData.url.endsWith('.pdf'))) {
          try {
            const pdfResponse = await fetch(fileData.url, {
              headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
              }
            });
            
            if (pdfResponse.ok) {
              const blob = await pdfResponse.blob();
              const blobUrl = URL.createObjectURL(blob);
              setPdfUrl(blobUrl);
              fileData.blobUrl = blobUrl;
            }
          } catch (pdfErr) {
            console.warn('Could not create blob URL for PDF:', pdfErr);
          }
        }
        
        setSelectedFile(fileData);
      } else {
        throw new Error(data.message || 'Failed to fetch file content');
      }
    }
  } catch (err) {
    console.error('Error fetching file content:', err);
    alert('Error loading file content: ' + err.message);
    setFileViewerOpen(false);
  } finally {
    setFileLoading(false);
  }
};
  const getFileIcon = (item) => {
    // Use fileType if available, otherwise fall back to type
    const fileType = item.fileType || item.type;
    
    switch (fileType) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'video': 
      case 'mp4': 
      case 'mov': return <FileVideo className="h-5 w-5 text-blue-500" />;
      case 'quiz': return <FileQuestion className="h-5 w-5 text-purple-500" />;
      case 'code': 
      case 'coding-question': return <FileCode className="h-5 w-5 text-green-500" />;
      case 'text': 
      case 'txt': 
      case 'document': return <FileText className="h-5 w-5 text-gray-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="h-5 w-5 text-blue-500" />;
      case 'document': return <Book className="h-5 w-5 text-red-500" />;
      case 'quiz': return <HelpCircle className="h-5 w-5 text-purple-500" />;
      case 'coding-question': return <Code className="h-5 w-5 text-green-500" />;
      case 'interactive': return <Users className="h-5 w-5 text-orange-500" />;
      case 'folder': return <Folder className="h-5 w-5 text-yellow-500" />;
      default: return <Book className="h-5 w-5" />;
    }
  };

const renderFileContent = () => {
  if (!selectedFile) return null;
  
  if (fileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading content...</span>
      </div>
    );
  }
  
  // Handle PDF files specifically
  if (selectedFile.fileType === 'pdf' || selectedFile.isPdf || 
      (selectedFile.url && selectedFile.url.toLowerCase().includes('.pdf'))) {
    
    // Determine the best URL to use for the PDF
    let pdfSource = pdfUrl || selectedFile.blobUrl || selectedFile.url;
    
    // Add viewer parameter to help with embedding
    const viewerUrl = pdfSource.startsWith('blob:') ? pdfSource : `${pdfSource}#view=FitH`;
    
    return (
      <div className="w-full">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>PDF Document:</strong> {selectedFile.title}
          </p>
          <div className="flex gap-2 mt-2">
            <a 
              href={pdfSource} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Open in new tab
            </a>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = pdfSource;
                link.download = selectedFile.title || 'document.pdf';
                link.click();
              }}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Download PDF
            </button>
          </div>
        </div>
        
        {/* Try multiple approaches for PDF display */}
        <div className="w-full border rounded-lg overflow-hidden bg-gray-100">
          {/* Primary iframe approach */}
          <iframe 
            src={viewerUrl} 
            className="w-full h-96 border-0" 
            title={selectedFile.title}
            onError={(e) => {
              console.log('Iframe failed to load PDF');
              // Fallback will be handled by the object tag below
            }}
          />
          
          {/* Fallback object tag (hidden by default, can be shown if iframe fails) */}
          <object 
            data={viewerUrl} 
            type="application/pdf" 
            className="w-full h-96 hidden"
            style={{ display: 'none' }}
          >
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                PDF cannot be displayed in this browser.
              </p>
              <a 
                href={pdfSource} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
              >
                Open PDF in new tab
              </a>
            </div>
          </object>
        </div>
        
        {/* Alternative: Embed with better error handling */}
        <div className="mt-4 text-center text-sm text-gray-600">
          If the PDF doesn't display above, try opening it in a new tab or downloading it.
        </div>
      </div>
    );
  }
  
  // Handle other file types with URLs (video, images, etc.)
  if (selectedFile.url) {
    const fileExtension = selectedFile.url.split('.').pop().toLowerCase();
    
    // Handle video files
    if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension) || selectedFile.type === 'video') {
      return (
        <div className="w-full">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Video:</strong> {selectedFile.title}
            </p>
          </div>
          <video controls className="w-full max-h-96" autoPlay>
            <source src={selectedFile.url} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Handle image files
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return (
        <div className="w-full">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Image:</strong> {selectedFile.title}
            </p>
          </div>
          <img 
            src={selectedFile.url} 
            alt={selectedFile.title}
            className="w-full max-h-96 object-contain mx-auto"
          />
        </div>
      );
    }
    
    // Handle other file types with download option
    else {
      return (
        <div className="text-center py-12">
          <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">File Download</h3>
          <p className="text-gray-600 mb-4">{selectedFile.title}</p>
          <a 
            href={selectedFile.url} 
            download
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
          >
            Download File
          </a>
        </div>
      );
    }
  }
  
  // Handle content types without URLs (text, quizzes, coding problems)
  switch (selectedFile.type) {
    case 'document':
      return (
        <div className="prose max-w-none p-4">
          <h1 className="text-2xl font-bold mb-4">{selectedFile.title}</h1>
          {selectedFile.content ? (
            <div dangerouslySetInnerHTML={{ __html: selectedFile.content }} />
          ) : (
            <p className="text-gray-500">No content available</p>
          )}
        </div>
      );
    
    case 'quiz':
      return (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{selectedFile.title}</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600 mb-4">Quiz content would be displayed here</p>
            {selectedFile.questions && (
              <div>
                <h3 className="font-semibold mb-2">Questions:</h3>
                <div dangerouslySetInnerHTML={{ __html: selectedFile.questions }} />
              </div>
            )}
          </div>
        </div>
      );
    
    case 'coding-question':
      return (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{selectedFile.title}</h2>
          <div className="bg-gray-900 text-white p-4 rounded-lg font-mono">
            <pre className="whitespace-pre-wrap">
              {selectedFile.problem || 'Coding problem content would be displayed here'}
            </pre>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="text-center py-12">
          <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">This content type cannot be previewed</p>
          <p className="text-sm text-gray-500">Content type: {selectedFile.type}</p>
        </div>
      );
  }
};

  const renderCourseContents = (contents, courseId, level = 0) => {
    if (!contents || contents.length === 0) {
      return (
        <div className="text-gray-500 italic py-2 pl-8">
          This folder is empty
        </div>
      );
    }

    return contents.map(item => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders[item._id];
        
        return (
          <div key={item._id} className="mb-1">
            <div 
              className={`flex items-center py-2 px-4 hover:bg-gray-100 rounded cursor-pointer ${level > 0 ? 'pl-8' : ''}`}
              onClick={() => toggleFolder(courseId, item._id)}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4 mr-2" /> : 
                <ChevronRight className="h-4 w-4 mr-2" />
              }
              <Folder className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium">{item.title}</span>
            </div>
            
            {isExpanded && (
              <div className="ml-6 border-l-2 border-gray-200 pl-2">
                {renderCourseContents(courseContents[item._id], courseId, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={item._id} 
            className={`flex items-center py-2 px-4 hover:bg-gray-100 rounded ${level > 0 ? 'pl-8' : ''} ${enrollmentStatus[courseId] ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            onClick={() => enrollmentStatus[courseId] && handleFileClick({...item, courseId})}
          >
            {getFileIcon(item)}
            <span className="ml-2 flex-1">{item.title}</span>
            {enrollmentStatus[courseId] ? (
              <Eye 
                className="h-4 w-4 text-blue-500 hover:text-blue-700" 
                title="View content"
              />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-400" title="Enroll to access" />
            )}
          </div>
        );
      }
    });
  };

  // Clean up PDF URL when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Available Courses</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
            <p className="text-gray-600">Check back later for new courses.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-2xl shadow p-5 border hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getTypeIcon(course.type)}
                    <span className="ml-2 text-sm text-gray-500 capitalize">
                      {course.type.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {enrollmentStatus[course._id] && (
                    <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Enrolled</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Instructor: {course.created_by?.name || 'Unknown'}</span>
                  </div>
                  
                  {course.duration && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Tag className="h-4 w-4 mr-1" />
                    <span>{course.category}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Course Content</h3>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    {courseContents[course._id] ? (
                      renderCourseContents(courseContents[course._id], course._id)
                    ) : (
                      <div className="text-center py-4">
                        <button 
                          onClick={() => fetchCourseContents(course._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center"
                        >
                          <Folder className="h-4 w-4 mr-2" />
                          View Course Contents
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {!enrollmentStatus[course._id] && (
                  <button 
                    onClick={() => handleEnroll(course._id)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Enroll Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File Viewer Modal */}
        {fileViewerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-lg font-semibold">
                  {selectedFile?.title || 'Loading...'}
                </h3>
                <button 
                  onClick={() => {
                    setFileViewerOpen(false);
                    setSelectedFile(null);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                {renderFileContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}