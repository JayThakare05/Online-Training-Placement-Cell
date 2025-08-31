import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Plus, Search, Edit, Trash2, Eye, Upload, 
  FileText, Video, Book, Users, Calendar 
} from 'lucide-react';

export default function ManageTrainingContent() {
  const [content, setContent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  useEffect(() => {
    const mockContent = [
      {
        id: 1,
        title: 'JavaScript Fundamentals',
        type: 'video',
        category: 'Programming',
        duration: '2 hours',
        enrollments: 245,
        status: 'published',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        title: 'Resume Writing Guide',
        type: 'document',
        category: 'Career Skills',
        duration: '30 min read',
        enrollments: 189,
        status: 'published',
        created_at: '2024-01-12'
      },
      {
        id: 3,
        title: 'Data Structures & Algorithms',
        type: 'course',
        category: 'Programming',
        duration: '8 weeks',
        enrollments: 156,
        status: 'draft',
        created_at: '2024-01-10'
      },
      {
        id: 4,
        title: 'Mock Interview Practice',
        type: 'interactive',
        category: 'Interview Prep',
        duration: '1 hour',
        enrollments: 98,
        status: 'published',
        created_at: '2024-01-08'
      }
    ];
    
    setTimeout(() => {
      setContent(mockContent);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'course': return <Book className="h-5 w-5" />;
      case 'interactive': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const AddContentModal = () => {
    const [newContent, setNewContent] = useState({
      title: '',
      type: 'document',
      category: '',
      description: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      // Add API call here
      console.log('Adding content:', newContent);
      setShowAddModal(false);
    };

    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Training Content</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newContent.type}
                onChange={(e) => setNewContent({...newContent, type: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newContent.category}
                onChange={(e) => setNewContent({...newContent, category: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Programming, Career Skills"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Content
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Content Management</h1>
            <p className="text-gray-600">Create and manage training materials for students</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Content</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
              <option value="course">Courses</option>
              <option value="interactive">Interactive</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading content...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Content</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Enrollments</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.duration}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(item.type)}
                          <span className="text-sm text-gray-900 capitalize">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{item.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{item.enrollments}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddContentModal />
      </div>
    </DashboardLayout>
  );
}