import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Plus, Search, Edit, Trash2, Eye, FolderPlus, 
  FileText, Video, Book, Users, Folder, HelpCircle,
  Code, ChevronRight, ChevronDown, X, Save, Calendar,
  ExternalLink, Play, Download, Clock, Tag
} from 'lucide-react';

export default function ManageTrainingContent() {
  const [content, setContent] = useState([]);
  const [viewMode, setViewMode] = useState('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE = 'http://localhost:5000/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Create headers with auth token
  const getHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json'
  });

  // Fetch content from backend
  const fetchContent = async () => {
    try {
      setLoading(true);
      const endpoint = viewMode === 'tree' ? '/content/tree' : '/content/list';
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      
      const url = `${API_BASE}${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch content');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err.message);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Create content
  const createContent = async (contentData) => {
    try {
      const response = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(contentData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchContent();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Failed to create content');
      }
    } catch (err) {
      console.error('Error creating content:', err);
      return { success: false, error: err.message };
    }
  };

  // Update content
  const updateContent = async (id, contentData) => {
    try {
      const response = await fetch(`${API_BASE}/content/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(contentData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchContent();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Failed to update content');
      }
    } catch (err) {
      console.error('Error updating content:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete content
  const deleteContent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/content/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchContent();
      } else {
        throw new Error(data.message || 'Failed to delete content');
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Quick status update
  const updateStatus = async (id, newStatus) => {
    const result = await updateContent(id, { status: newStatus });
    if (!result.success) {
      alert(`Error updating status: ${result.error}`);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [viewMode, searchTerm, filterType]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'folder': return <Folder className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'quiz': return <HelpCircle className="h-5 w-5" />;
      case 'coding-question': return <Code className="h-5 w-5" />;
      case 'interactive': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status, interactive = false, itemId = null) => {
    const colors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    if (interactive && itemId) {
      return (
        <select
          value={status}
          onChange={(e) => updateStatus(itemId, e.target.value)}
          className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${colors[status]}`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // View content modal
  const ViewContentModal = () => {
    if (!showViewModal || !selectedContent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              {getTypeIcon(selectedContent.type)}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedContent.title}</h3>
                <p className="text-gray-600 capitalize">{selectedContent.type.replace('-', ' ')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{selectedContent.category}</span>
                </div>
              </div>
              
              {selectedContent.duration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{selectedContent.duration}</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {getStatusBadge(selectedContent.status, true, selectedContent._id)}
              </div>
            </div>

            <div className="space-y-4">
              {selectedContent.enrollments !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollments</label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{selectedContent.enrollments}</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(selectedContent.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(selectedContent.updated_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {selectedContent.description && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedContent.description}</p>
              </div>
            </div>
          )}

          {selectedContent.file_url && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content URL</label>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <a 
                  href={selectedContent.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate flex-1"
                >
                  {selectedContent.file_url}
                </a>
                {selectedContent.type === 'video' && (
                  <Play className="h-5 w-5 text-blue-600" />
                )}
                {selectedContent.type === 'document' && (
                  <Download className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                setShowEditModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit content modal
  const EditContentModal = () => {
    const [editData, setEditData] = useState(selectedContent || {});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (selectedContent) {
        setEditData(selectedContent);
      }
    }, [selectedContent]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      const result = await updateContent(selectedContent._id, editData);
      
      if (result.success) {
        setShowEditModal(false);
        setSelectedContent(null);
      } else {
        alert(`Error: ${result.error}`);
      }
      
      setSubmitting(false);
    };

    const handleCancel = () => {
      setShowEditModal(false);
      setSelectedContent(null);
    };

    if (!showEditModal || !selectedContent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Edit Content</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editData.type || 'folder'}
                  onChange={(e) => setEditData({...editData, type: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                >
                  <option value="folder">Folder</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="quiz">Quiz</option>
                  <option value="coding-question">Coding Question</option>
                  <option value="interactive">Interactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  value={editData.category || ''}
                  onChange={(e) => setEditData({...editData, category: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editData.status || 'draft'}
                  onChange={(e) => setEditData({...editData, status: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {editData.type !== 'folder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editData.status || 'draft'}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
            </div>

            {editData.type !== 'folder' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editData.duration || ''}
                    onChange={(e) => setEditData({...editData, duration: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 hours, 30 min read"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
                  <input
                    type="url"
                    value={editData.file_url || ''}
                    onChange={(e) => setEditData({...editData, file_url: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    disabled={submitting}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                disabled={submitting}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render tree view
  const renderTreeNode = (item, depth = 0) => {
    const isExpanded = expandedFolders.has(item._id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item._id} className="select-none">
        <div 
          className={`flex items-center py-2 px-2 hover:bg-gray-50 rounded`}
          style={{ marginLeft: depth * 24 }}
        >
          {item.type === 'folder' && (
            <button
              onClick={() => toggleFolder(item._id)}
              className="p-1 hover:bg-gray-200 rounded mr-1"
            >
              {hasChildren && isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : hasChildren ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-2 flex-1">
            {getTypeIcon(item.type)}
            <span className="font-medium">{item.title}</span>
            {item.type !== 'folder' && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{item.category}</span>
                {item.enrollments > 0 && (
                  <>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{item.enrollments} enrolled</span>
                  </>
                )}
                {getStatusBadge(item.status, true, item._id)}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {item.type === 'folder' && (
              <button
                onClick={() => {
                  setSelectedParent(item);
                  setShowAddModal(true);
                }}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Add content to this folder"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedContent(item);
                setShowViewModal(true);
              }}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                setSelectedContent(item);
                setShowEditModal(true);
              }}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="Edit content"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => deleteContent(item._id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Delete content"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {item.type === 'folder' && hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const AddContentModal = () => {
    const [newContent, setNewContent] = useState({
      title: '',
      type: 'folder',
      category: '',
      description: '',
      duration: '',
      file_url: '',
      status: 'draft'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      const contentData = {
        ...newContent,
        parent_id: selectedParent?._id || null
      };
      
      const result = await createContent(contentData);
      
      if (result.success) {
        setShowAddModal(false);
        setSelectedParent(null);
        setNewContent({
          title: '',
          type: 'folder',
          category: '',
          description: '',
          duration: '',
          file_url: '',
          status: 'draft'
        });
      } else {
        alert(`Error: ${result.error}`);
      }
      
      setSubmitting(false);
    };

    const handleCancel = () => {
      setShowAddModal(false);
      setSelectedParent(null);
      setNewContent({
        title: '',
        type: 'folder',
        category: '',
        description: '',
        duration: '',
        file_url: '',
        status: 'draft'
      });
    };

    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New {selectedParent ? `to "${selectedParent.title}"` : 'Content'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={newContent.type}
                onChange={(e) => setNewContent({...newContent, type: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="folder">Folder</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="quiz">Quiz</option>
                <option value="coding-question">Coding Question</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                value={newContent.category}
                onChange={(e) => setNewContent({...newContent, category: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Programming, Career Skills, Interview Prep"
                required
                disabled={submitting}
              />
            </div>

            {newContent.type !== 'folder' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newContent.duration}
                    onChange={(e) => setNewContent({...newContent, duration: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 hours, 30 min read"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
                  <input
                    type="url"
                    value={newContent.file_url}
                    onChange={(e) => setNewContent({...newContent, file_url: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newContent.status}
                    onChange={(e) => setNewContent({...newContent, status: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                className="w-full p-2 border rounded-lg" rows="3"
                disabled={submitting}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading content...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Content Management</h1>
            <p className="text-gray-600">Create and manage training materials for students</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setSelectedParent(null);
                setShowAddModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Content</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            Error: {error}
          </div>
        )}

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
              <option value="folder">Folders</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
              <option value="quiz">Quizzes</option>
              <option value="coding-question">Coding Questions</option>
              <option value="interactive">Interactive</option>
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'tree' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {content.length === 0 ? (
            <div className="p-12 text-center">
              <FolderPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'No content matches your search criteria. Try adjusting your filters.'
                  : 'Get started by creating your first folder or content item.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => {
                    setSelectedParent(null);
                    setShowAddModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create First Content</span>
                </button>
              )}
            </div>
          ) : viewMode === 'tree' ? (
            <div className="p-4">
              <div className="space-y-1">
                {content.map(item => renderTreeNode(item))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Content</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Parent</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Enrollments</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {content.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            {item.duration && (
                              <p className="text-sm text-gray-600">{item.duration}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900 capitalize">
                          {item.type.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{item.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {item.parent_id ? item.parent_id.title || 'Unknown' : 'Root'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {item.type !== 'folder' ? (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{item.enrollments || 0}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {item.type !== 'folder' ? (
                          getStatusBadge(item.status, true, item._id)
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {item.type === 'folder' && (
                            <button
                              onClick={() => {
                                setSelectedParent(item);
                                setShowAddModal(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Add content to folder"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedContent(item);
                              setShowViewModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedContent(item);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Edit content"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteContent(item._id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete content"
                          >
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

        {/* Modals */}
        <AddContentModal />
        <ViewContentModal />
        <EditContentModal />
      </div>
    </DashboardLayout>
  );
}