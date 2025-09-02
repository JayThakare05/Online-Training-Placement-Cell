import express from "express";
import mongoose from "mongoose";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import Content from "../models/Content.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// Student middleware
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Unauthorized. Student access required.' });
  }
  next();
};

// Helper function to convert numeric ID to ObjectId if needed
const getUserId = async (numericId) => {
  if (mongoose.Types.ObjectId.isValid(numericId) && typeof numericId !== 'number') {
    return numericId;
  }
  
  const user = await User.findOne({ id: numericId });
  return user ? user._id : null;
};

// Get all published courses for students
router.get('/courses', authenticateToken, requireStudent, async (req, res) => {
  try {
    const courses = await Content.find({
      status: 'published',
      parent_id: null
    })
    .populate('created_by', 'name email')
    .select('-content_data')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// Get course contents (folders and files)
router.get('/courses/:id/contents', authenticateToken, requireStudent, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const enrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: courseId,
      status: 'enrolled'
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must enroll in the course to access its contents'
      });
    }
    
    const contents = await Content.find({
      parent_id: courseId,
      status: 'published'
    })
    .select('-content_data')
    .sort({ order: 1, createdAt: 1 });
    
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Error fetching course contents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course contents',
      error: error.message
    });
  }
});

// Get folder contents
router.get('/courses/:courseId/contents/:folderId', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { courseId, folderId } = req.params;
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const enrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: courseId,
      status: 'enrolled'
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must enroll in the course to access its contents'
      });
    }
    
    const folder = await Content.findOne({
      _id: folderId,
      parent_id: courseId,
      type: 'folder',
      status: 'published'
    });
    
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found or not accessible'
      });
    }
    
    const contents = await Content.find({
      parent_id: folderId,
      status: 'published'
    })
    .select('-content_data')
    .sort({ order: 1, createdAt: 1 });
    
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching folder contents',
      error: error.message
    });
  }
});

// Check enrollment status
router.get('/courses/:id/enrollment-status', authenticateToken, requireStudent, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const enrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: req.params.id,
      status: 'enrolled'
    });
    
    res.json({
      success: true,
      isEnrolled: !!enrollment
    });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking enrollment status',
      error: error.message
    });
  }
});

// Student enrollment route
router.post('/courses/:id/enroll', authenticateToken, requireStudent, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const course = await Content.findOne({
      _id: courseId,
      status: 'published',
      parent_id: null
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not published'
      });
    }
    
    const existingEnrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: courseId
    });
    
    if (existingEnrollment) {
      if (existingEnrollment.status === 'enrolled') {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this course'
        });
      } else {
        existingEnrollment.status = 'enrolled';
        existingEnrollment.enrolled_at = new Date();
        await existingEnrollment.save();
        
        return res.json({
          success: true,
          message: 'Enrollment successful'
        });
      }
    }
    
    const enrollment = new Enrollment({
      user_id: userId,
      course_id: courseId,
      status: 'enrolled',
      enrolled_at: new Date()
    });
    
    await enrollment.save();
    
    res.json({
      success: true,
      message: 'Enrollment successful'
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
});

// Get file content for viewing - UPDATED to handle file_url properly
router.get('/contents/:id/view', authenticateToken, requireStudent, async (req, res) => {
  try {
    const contentId = req.params.id;
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const content = await Content.findById(contentId);
    
    if (!content || content.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Content not found or not published'
      });
    }
    
    // Find the course this content belongs to
    let currentContent = content;
    let courseId = null;
    
    while (currentContent.parent_id) {
      currentContent = await Content.findById(currentContent.parent_id);
      if (!currentContent) break;
      
      if (!currentContent.parent_id) {
        courseId = currentContent._id;
        break;
      }
    }
    
    if (!courseId) {
      return res.status(404).json({
        success: false,
        message: 'Course not found for this content'
      });
    }
    
    const enrollment = await Enrollment.findOne({
      user_id: userId,
      course_id: courseId,
      status: 'enrolled'
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must enroll in the course to access this content'
      });
    }
    
    // ALWAYS return file_url if available, regardless of content type
    let responseData = {
      _id: content._id,
      title: content.title,
      type: content.type,
      fileType: content.fileType,
      description: content.description,
      file_url: content.file_url // Always include file_url
    };
    
    // For PDF files, serve directly if no file_url but has content_data
    if (content.type === 'document' && content.fileType === 'pdf') {
      if (content.content_data && content.content_data instanceof Buffer) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${content.title}.pdf"`);
        return res.send(content.content_data);
      }
    }
    
    // For other content types that might have file_url
    if (content.file_url) {
      responseData.url = content.file_url;
    } else if (content.type === 'video') {
      responseData.url = content.content_data;
    } else if (content.type === 'document') {
      responseData.content = content.content_data;
    } else if (content.type === 'quiz') {
      responseData.questions = content.content_data;
    } else if (content.type === 'coding-question') {
      responseData.problem = content.content_data;
    } else {
      responseData.content = content.content_data;
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching content for viewing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Serve static files from uploads directory
router.get('/uploads/content/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'content', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
  
  // Set appropriate headers based on file type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

export default router;