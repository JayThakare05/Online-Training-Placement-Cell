import Content from '../models/Content.js';
import mongoose from 'mongoose';
// Get all content in hierarchical structure
export const getContentTree = async (req, res) => {
  try {
    // Get all content items
    const allContent = await Content.find({})
      .populate('created_by', 'name email')
      .sort({ parent_id: 1, order: 1, createdAt: 1 });

    // Build hierarchical structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => {
          if (parentId === null) {
            return item.parent_id === null || item.parent_id === undefined;
          }
          return item.parent_id && item.parent_id.toString() === parentId.toString();
        })
        .map(item => ({
          ...item.toObject(),
          children: buildTree(items, item._id)
        }));
    };

    const contentTree = buildTree(allContent);
    
    res.json({
      success: true,
      data: contentTree,
      total: allContent.length
    });
  } catch (error) {
    console.error('Error fetching content tree:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// controllers/contentController.js
export const uploadContentFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      });
    }
    
    const fileUrl = `/uploads/content/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      fileUrl,
      message: 'File uploaded successfully'
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed', 
      error: err.message 
    });
  }
};

// Get flat content list (for table view)
export const getContentList = async (req, res) => {
  try {
    const { search, type, status, parent_id } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (parent_id) {
      filter.parent_id = parent_id === 'root' ? null : parent_id;
    }

    const content = await Content.find(filter)
      .populate('created_by', 'name email')
      .populate('parent_id', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: content,
      total: content.length
    });
  } catch (error) {
    console.error('Error fetching content list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// Create new content/folder
export const createContent = async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      description,
      parent_id,
      file_url,
      duration,
      content_data,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!title || !type || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, and category are required'
      });
    }

    // If parent_id is provided, check if parent exists
    if (parent_id && parent_id !== 'root') {
      const parentExists = await Content.findById(parent_id);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const newContent = new Content({
      title,
      type,
      category,
      description,
      parent_id: parent_id && parent_id !== 'root' ? parent_id : null,
      file_url,
      duration,
      content_data,
      status,
      created_by: new mongoose.Types.ObjectId() 
    });

    await newContent.save();
    
    // Populate the response
    await newContent.populate('created_by', 'name email');
    await newContent.populate('parent_id', 'title');

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: newContent
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
      error: error.message
    });
  }
};

// Update content
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const content = await Content.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('created_by', 'name email')
     .populate('parent_id', 'title');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
};

// Delete content
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if content has children
    const hasChildren = await Content.findOne({ parent_id: id });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete folder that contains items. Please delete or move the items first.'
      });
    }

    const content = await Content.findByIdAndDelete(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
};

// Get content by ID
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findById(id)
      .populate('created_by', 'name email')
      .populate('parent_id', 'title');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};