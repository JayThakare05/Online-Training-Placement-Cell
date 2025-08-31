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

export const contentService = {
  // Get content tree (hierarchical structure)
  async getContentTree(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    
    const url = `${API_BASE}/content/tree${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Get content list (flat structure)
  async getContentList(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.parent_id) queryParams.append('parent_id', params.parent_id);
    
    const url = `${API_BASE}/content/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Get content by ID
  async getContentById(id) {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Create new content
  async createContent(contentData) {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contentData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Update content
  async updateContent(id, contentData) {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(contentData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Delete content
  async deleteContent(id) {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};