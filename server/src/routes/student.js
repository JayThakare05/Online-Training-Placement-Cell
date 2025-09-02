import express from "express";
import mongoose from "mongoose";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import Content from "../models/Content.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js"; // Import User model

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
  // If it's already an ObjectId, return it
  if (mongoose.Types.ObjectId.isValid(numericId) && typeof numericId !== 'number') {
    return numericId;
  }
  
  // Find the user by numeric ID and get their ObjectId
  const user = await User.findOne({ id: numericId });
  return user ? user._id : null;
};

// Get all published courses for students
router.get('/courses', authenticateToken, requireStudent, async (req, res) => {
  try {
    // Fetch only published parent courses (those without parent_id)
    const courses = await Content.find({
      status: 'published',
      parent_id: null // Only get parent courses
    })
    .populate('created_by', 'name email') // Populate instructor info
    .select('-content_data') // Exclude content data for listing
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
    
    // Check if user is enrolled in the course
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
    
    // Fetch all contents for this course (direct children only)
    const contents = await Content.find({
      parent_id: courseId,
      status: 'published'
    })
    .select('-content_data') // Exclude content data for listing
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
    
    // Check if user is enrolled in the course
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
    
    // Verify the folder belongs to the course
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
    
    // Fetch all contents for this folder
    const contents = await Content.find({
      parent_id: folderId,
      status: 'published'
    })
    .select('-content_data') // Exclude content data for listing
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
    
    // Check if course exists and is published
    const course = await Content.findOne({
      _id: courseId,
      status: 'published',
      parent_id: null // Ensure it's a parent course
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not published'
      });
    }
    
    // Check if already enrolled
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
        // Update existing enrollment
        existingEnrollment.status = 'enrolled';
        existingEnrollment.enrolled_at = new Date();
        await existingEnrollment.save();
        
        return res.json({
          success: true,
          message: 'Enrollment successful'
        });
      }
    }
    
    // Create new enrollment
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

// Get file content for viewing
// Get file content for viewing - Update this route in your backend
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
    
    // Get the content with all data (including content_data)
    const content = await Content.findById(contentId);
    
    if (!content || content.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Content not found or not published'
      });
    }
    
    // Find the course this content belongs to by traversing up the parent hierarchy
    let currentContent = content;
    let courseId = null;
    
    while (currentContent.parent_id) {
      currentContent = await Content.findById(currentContent.parent_id);
      if (!currentContent) break;
      
      // If we reach a content with no parent, it's the course
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
    
    // Check if user is enrolled in the course
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
    
    // Return the content with appropriate data based on type
    let responseData = {
      _id: content._id,
      title: content.title,
      type: content.type,
      fileType: content.fileType,
      description: content.description
    };
    
    // Handle different content types
    if (content.type === 'document' && content.fileType === 'pdf') {
      responseData.url = content.fileUrl || content.content_data;
    } 
    else if (content.type === 'video') {
      responseData.url = content.fileUrl || content.content_data;
    }
    else if (content.type === 'document') {
      // For text-based documents, return the content directly
      responseData.content = content.content_data;
    }
    else if (content.type === 'quiz') {
      responseData.questions = content.content_data; // Assuming content_data contains quiz questions
    }
    else if (content.type === 'coding-question') {
      responseData.problem = content.content_data; // Assuming content_data contains coding problem
    }
    else {
      // For other types, return whatever data is available
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

export default router;