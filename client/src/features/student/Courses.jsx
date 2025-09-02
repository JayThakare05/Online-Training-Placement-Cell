import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Book, Users, Clock, Tag, Play, HelpCircle, Code, 
  Folder, FileText, ChevronRight, ChevronDown, Download,
  Eye, File, FileVideo, FileQuestion, FileCode, X,
  CheckCircle, AlertCircle, Loader, Maximize2, Minimize2
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        const parentCourses = data.data.filter(course => !course.parent_id);
        setCourses(parentCourses);
        
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
        setEnrollmentStatus(prev => ({
          ...prev,
          [courseId]: true
        }));
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
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));

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

const handleFileClick = async (file) => {
  if (!enrollmentStatus[file.courseId]) {
    alert('Please enroll in the course to access this content');
    return;
  }
  
  setFileLoading(true);
  setFileViewerOpen(true);
  setPdfUrl(null);
  setIsFullscreen(false);
  
  try {
    const response = await fetch(`${API_BASE}/auth/contents/${file._id}/view`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType === 'application/pdf') {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedFile({
        _id: file._id,
        title: file.title,
        type: 'document',
        fileType: 'pdf',
        isPdf: true,
        url: url
      });
    } else {
      const data = await response.json();
      
      if (data.success) {
        const fileData = data.data;
        
        if (fileData.file_url) {
          fileData.url = fileData.file_url;
        }
        
        if (fileData.url && fileData.url.startsWith('/')) {
          fileData.url = `${API_BASE2}${fileData.url}`;
        }
        
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
  
  if (selectedFile.fileType === 'pdf' || selectedFile.isPdf || 
      (selectedFile.url && selectedFile.url.toLowerCase().includes('.pdf'))) {
    
    let pdfSource = pdfUrl || selectedFile.blobUrl || selectedFile.url;
    const viewerUrl = pdfSource.startsWith('blob:') ? pdfSource : `${pdfSource}#view=FitH&toolbar=0&navpanes=0`;
    
    return (
      <div className="w-full">
<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
  <div>
    <p className="text-sm text-blue-800 font-medium">
      {selectedFile.title}
    </p>
    <p className="text-xs text-blue-600">PDF Document</p>
  </div>
  <div className="flex gap-3 items-center">
    <button
      onClick={() => setIsFullscreen(true)}
      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
      title="Enter fullscreen"
    >
      <Maximize2 size={18} />
    </button>
  </div>
</div>
        
        <div className={`w-full border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm ${isFullscreen ? 'fixed inset-0 z-50 m-0' : 'h-[70vh]'}`}>
  {/* Add this exit fullscreen button */}
  {isFullscreen && (
    <div className="absolute top-4 right-4 z-10">
      <button
        onClick={() => setIsFullscreen(false)}
        className="bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
        title="Exit fullscreen"
      >
        <Minimize2 size={20} />
      </button>
    </div>
  )}
  <iframe 
    src={viewerUrl} 
    className={`w-full ${isFullscreen ? 'h-full' : 'h-full'}`}
    title={selectedFile.title}
    frameBorder="0"
  />
</div>
        
        {!isFullscreen && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Use the fullscreen button for better reading experience
          </div>
        )}
      </div>
    );
  }
  
  if (selectedFile.url) {
    const fileExtension = selectedFile.url.split('.').pop().toLowerCase();
    
    if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension) || selectedFile.type === 'video') {
      return (
        <div className="w-full">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              <strong>Video:</strong> {selectedFile.title}
            </p>
          </div>
          <video controls className="w-full max-h-96 rounded-lg shadow-sm" autoPlay>
            <source src={selectedFile.url} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return (
        <div className="w-full">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              <strong>Image:</strong> {selectedFile.title}
            </p>
          </div>
          <img 
            src={selectedFile.url} 
            alt={selectedFile.title}
            className="w-full max-h-96 object-contain mx-auto rounded-lg shadow-sm"
          />
        </div>
      );
    }
    
    else {
      return (
        <div className="text-center py-12">
          <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">File Download</h3>
          <p className="text-gray-600 mb-4">{selectedFile.title}</p>
          <a 
            href={selectedFile.url} 
            download
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Download size={18} />
            Download File
          </a>
        </div>
      );
    }
  }
  
  switch (selectedFile.type) {
    case 'document':
      return (
        <div className="prose max-w-none p-6 bg-white rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">{selectedFile.title}</h1>
          {selectedFile.content ? (
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedFile.content }} />
          ) : (
            <p className="text-gray-500 text-center py-12">No content available</p>
          )}
        </div>
      );
    
    case 'quiz':
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{selectedFile.title}</h2>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <p className="text-gray-600 mb-6 text-center">Quiz content would be displayed here</p>
            {selectedFile.questions && (
              <div>
                <h3 className="font-semibold mb-4 text-lg">Questions:</h3>
                <div className="bg-white p-4 rounded border" dangerouslySetInnerHTML={{ __html: selectedFile.questions }} />
              </div>
            )}
          </div>
        </div>
      );
    
    case 'coding-question':
      return (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{selectedFile.title}</h2>
          <div className="bg-gray-900 text-white p-6 rounded-lg font-mono">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {selectedFile.problem || 'Coding problem content would be displayed here'}
            </pre>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="text-center py-16">
          <File className="h-20 w-20 text-gray-400 mx-auto mb-6" />
          <p className="text-gray-600 mb-4 text-lg">This content type cannot be previewed</p>
          <p className="text-sm text-gray-500">Content type: {selectedFile.type}</p>
        </div>
      );
  }
};

  const renderCourseContents = (contents, courseId, level = 0) => {
    if (!contents || contents.length === 0) {
      return (
        <div className="text-gray-500 italic py-4 pl-8 text-sm">
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
              className={`flex items-center py-3 px-4 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors ${level > 0 ? 'pl-8' : ''}`}
              onClick={() => toggleFolder(courseId, item._id)}
            >
              {isExpanded ? 
                <ChevronDown className="h-5 w-5 mr-3 text-gray-600" /> : 
                <ChevronRight className="h-5 w-5 mr-3 text-gray-600" />
              }
              <Folder className="h-5 w-5 text-yellow-500 mr-3" />
              <span className="font-medium text-gray-800">{item.title}</span>
            </div>
            
            {isExpanded && (
              <div className="ml-8 border-l-2 border-gray-200 pl-3 mt-1">
                {renderCourseContents(courseContents[item._id], courseId, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={item._id} 
            className={`flex items-center py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors ${level > 0 ? 'pl-8' : ''} ${enrollmentStatus[courseId] ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed opacity-60'}`}
            onClick={() => enrollmentStatus[courseId] && handleFileClick({...item, courseId})}
          >
            {getFileIcon(item)}
            <span className="ml-3 flex-1 text-gray-800">{item.title}</span>
            {enrollmentStatus[courseId] ? (
              <Eye 
                className="h-5 w-5 text-blue-600 hover:text-blue-800 transition-colors" 
                title="View content"
              />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400" title="Enroll to access" />
            )}
          </div>
        );
      }
    });
  };

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
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Available Courses</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              <span>Error: {error}</span>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <Book className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-800 mb-3">No courses available</h3>
            <p className="text-gray-600">Check back later for new courses.</p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    {getTypeIcon(course.type)}
                    <span className="ml-3 text-sm text-gray-600 font-medium capitalize">
                      {course.type.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {enrollmentStatus[course._id] && (
                    <div className="flex items-center text-sm text-green-700 bg-green-50 px-4 py-2 rounded-full">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Enrolled</span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">{course.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{course.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-5 w-5 mr-3" />
                    <span>Instructor: {course.created_by?.name || 'Unknown'}</span>
                  </div>
                  
                  {course.duration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-5 w-5 mr-3" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="h-5 w-5 mr-3" />
                    <span>{course.category}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">Course Content</h3>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    {courseContents[course._id] ? (
                      renderCourseContents(courseContents[course._id], course._id)
                    ) : (
                      <div className="text-center py-6">
                        <button 
                          onClick={() => fetchCourseContents(course._id)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <Folder className="h-5 w-5" />
                          View Course Contents
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {!enrollmentStatus[course._id] && (
                  <button 
                    onClick={() => handleEnroll(course._id)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-lg shadow-md hover:shadow-lg"
                  >
                    <CheckCircle className="h-6 w-6" />
                    Enroll Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {fileViewerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-6xl max-h-screen overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-xl font-semibold text-gray-800 truncate max-w-2xl">
                  {selectedFile?.title || 'Loading...'}
                </h3>
                <button 
                  onClick={() => {
                    setFileViewerOpen(false);
                    setSelectedFile(null);
                    setIsFullscreen(false);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6 bg-gray-50">
                {renderFileContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}