import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import JobPost from '../models/JobPost.js';
import { getMySQLPool } from "../config/db.js";
import mongoose from "mongoose";
const router = express.Router();

// ================== CREATE JOB POST ==================
router.post('/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can post jobs' });
    }

    const pool = getMySQLPool();
    
    // Verify recruiter is approved - this is the crucial check
    const [recruiterRows] = await pool.query(
      `SELECT r.*, u.name, u.email 
       FROM recruiters r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ?`,
      [req.user.id]
    );

    if (!recruiterRows.length) {
      return res.status(404).json({ 
        message: 'Recruiter profile not found' 
      });
    }

    const recruiter = recruiterRows[0];
    
    if (recruiter.isVerified !== 1) {
      return res.status(403).json({ 
        message: 'Your recruiter account must be verified to post jobs' 
      });
    }

    // Create job post with recruiter information
    const jobPostData = {
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      salary: req.body.salary,
      skills: req.body.skills,
      type: req.body.type,
      recruiter: {
        user_id: req.user.id,
        name: recruiter.name,
        email: recruiter.email,
        company_name: recruiter.company_name,
        recruiter_name: recruiter.recruiter_name || recruiter.name,
        designation: recruiter.designation,
        contact_number: recruiter.contact_number
      },
      isVerifiedRecruiter: true
    };

    const jobPost = new JobPost(jobPostData);
    await jobPost.save();

    res.status(201).json({
      message: 'Job posted successfully',
      jobId: jobPost._id,
      slug: jobPost.slug
    });
  } catch (error) {
    console.error('Error creating job post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
const userCache = new Map();

// ================== GET ALL JOB POSTS ==================
// ================== GET ALL JOB POSTS ==================
// ================== GET ALL JOB POSTS ==================
router.get('/posts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      location, 
      type, 
      company,
      verified_only = false 
    } = req.query;

    const query = { status: 'active' };
    
    // Add filters
    if (search) {
      query.$text = { $search: search };
    }
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (type) {
      query.type = type;
    }
    if (company) {
      query['recruiter.company_name'] = new RegExp(company, 'i');
    }
    if (verified_only === 'true') {
      query.isVerifiedRecruiter = true;
    }

    const jobs = await JobPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-applications.applied_users') // Exclude sensitive application data
      .exec(); // REMOVE .populate('comments.user') - it's not needed

    const total = await JobPost.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_jobs: total,
        has_more: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== LIKE/UNLIKE JOB ==================
router.post('/posts/:jobId/like', authenticateToken, async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    const existingLike = jobPost.likes.users.find(
      like => like.user_id === req.user.id
    );

    if (existingLike) {
      // Unlike
      jobPost.likes.users = jobPost.likes.users.filter(
        like => like.user_id !== req.user.id
      );
      jobPost.likes.count = Math.max(0, jobPost.likes.count - 1);
    } else {
      // Like
      jobPost.likes.users.push({
        user_id: req.user.id,
        user_name: req.user.name,
        user_role: req.user.role
      });
      jobPost.likes.count += 1;
    }

    await jobPost.save();

    res.json({
      liked: !existingLike,
      likes_count: jobPost.likes.count
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== ADD COMMENT ==================
router.post('/posts/:jobId/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    let userName;
    
    // Check cache first
    if (userCache.has(req.user.id)) {
      userName = userCache.get(req.user.id);
    } else {
      // Fetch from database if not in cache
      const pool = getMySQLPool();
      const [userRows] = await pool.query(
        "SELECT name FROM users WHERE id = ?",
        [req.user.id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      userName = userRows[0].name;
      // Cache the result for 1 hour
      userCache.set(req.user.id, userName);
      setTimeout(() => userCache.delete(req.user.id), 60 * 60 * 1000);
    }

    const newComment = {
      user: {
        user_id: req.user.id,
        name: userName,
        role: req.user.role
      },
      content: content.trim(),
      created_at: new Date()
    };

    jobPost.comments.push(newComment);
    await jobPost.save();

    const addedComment = jobPost.comments[jobPost.comments.length - 1];
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== UPDATE COMMENT ==================
router.put('/posts/:jobId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    const comment = jobPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.user.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    comment.updated_at = new Date();
    
    await jobPost.save();

    res.json({
      message: 'Comment updated successfully',
      comment: comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== DELETE COMMENT ==================
router.delete('/posts/:jobId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    const comment = jobPost.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.user.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Remove the comment
    jobPost.comments.pull({ _id: req.params.commentId });
    await jobPost.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== APPLY TO JOB ==================
router.post('/posts/:jobId/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply to jobs' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost || jobPost.status !== 'active') {
      return res.status(404).json({ message: 'Job post not found or inactive' });
    }

    // Check if already applied
    const existingApplication = jobPost.applications.applied_users.find(
      app => app.user_id === req.user.id
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Add application
    jobPost.applications.applied_users.push({
      user_id: req.user.id,
      student_name: req.user.name,
      status: 'applied'
    });
    jobPost.applications.count += 1;

    await jobPost.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== GET JOBS POSTED BY CURRENT RECRUITER ==================
router.get('/recruiter/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can access this endpoint' });
    }

    const jobs = await JobPost.find({ 
      'recruiter.user_id': req.user.id 
    })
    .sort({ createdAt: -1 })
    .select('-applications.applied_users') // Exclude sensitive application data
    .exec();

    res.json({
      jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== GET SINGLE JOB POST (FOR EDITING) ==================
router.get('/posts/:jobId', authenticateToken, async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.jobId);
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    // Check if the user owns this job post
    if (jobPost.recruiter.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only edit your own job posts.' });
    }

    res.json(jobPost);
  } catch (error) {
    console.error('Error fetching job post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== UPDATE JOB POST ==================
router.put('/posts/:jobId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only recruiters and admins can update jobs' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    // Check if the user owns this job post (unless admin)
    if (jobPost.recruiter.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only edit your own job posts.' });
    }

    // Update job fields
    const updatableFields = ['title', 'description', 'location', 'salary', 'skills', 'type', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        jobPost[field] = req.body[field];
      }
    });

    // Regenerate slug if title changed
    if (req.body.title && req.body.title !== jobPost.title) {
      jobPost.slug = jobPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    await jobPost.save();

    res.json({
      message: 'Job updated successfully',
      job: jobPost
    });
  } catch (error) {
    console.error('Error updating job post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this route to your existing job routes file, after the UPDATE route

// ================== DELETE JOB POST ==================
router.delete('/posts/:jobId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only recruiters and admins can delete jobs' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    // Check if the user owns this job post (unless admin)
    if (jobPost.recruiter.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own job posts.' });
    }

    // Check if job has applications - you might want to prevent deletion or handle this differently
    if (jobPost.applications.count > 0) {
      // Option 1: Prevent deletion if there are applications
      return res.status(400).json({ 
        message: `Cannot delete job with ${jobPost.applications.count} existing applications. Consider changing status to 'closed' instead.` 
      });
      
      // Option 2: Allow deletion but warn (comment out above and uncomment below)
      // console.log(`Warning: Deleting job "${jobPost.title}" with ${jobPost.applications.count} applications`);
    }

    // Delete the job post
    await JobPost.findByIdAndDelete(req.params.jobId);

    res.json({
      message: 'Job post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================== GET APPLICATIONS FOR RECRUITER'S JOBS ==================
router.get('/recruiter/applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can access this endpoint' });
    }

    const pool = getMySQLPool();
    
    // Get all job posts by this recruiter with their applications
    const recruiterJobs = await JobPost.find({ 
      'recruiter.user_id': req.user.id 
    });

    if (recruiterJobs.length === 0) {
      return res.json({ applications: [] });
    }

    // Extract all user IDs from applications across all jobs
    const userIds = [];
    const applicationsData = [];
    
    recruiterJobs.forEach(job => {
      job.applications.applied_users.forEach(application => {
        userIds.push(application.user_id);
        applicationsData.push({
          application_id: application._id,
          user_id: application.user_id,
          student_name: application.student_name,
          status: application.status,
          applied_at: application.applied_at,
          job_id: job._id,
          job_title: job.title,
          job_created_at: job.createdAt
        });
      });
    });

    if (userIds.length === 0) {
      return res.json({ applications: [] });
    }

    // Get user details from MySQL
    const placeholders = userIds.map(() => '?').join(',');
    const [userRows] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        s.contact,
        s.college,
        s.department,
        s.year_of_study,
        s.cgpa,
        s.skills,
        s.backlogs,
        s.resume_url,
        s.dob,
        s.gender,
        s.address,
        s.roll_no,
        s.marks_10,
        s.marks_12,
        s.certifications,
        s.projects,
        s.job_roles,
        s.job_locations,
        s.placement_status
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id IN (${placeholders})
    `, userIds);

    // Create a map of user details for easy lookup
    const userDetailsMap = {};
    userRows.forEach(user => {
      userDetailsMap[user.user_id] = user;
    });

    // Combine application data with user details
    const applications = applicationsData.map(app => {
      const userDetails = userDetailsMap[app.user_id] || {};
      
      return {
        application_id: app.application_id,
        student_name: app.student_name,
        user_id: app.user_id,
        status: app.status,
        applied_at: app.applied_at,
        job_title: app.job_title,
        job_created_at: app.job_created_at,
        email: userDetails.email,
        contact: userDetails.contact,
        college: userDetails.college,
        department: userDetails.department,
        year_of_study: userDetails.year_of_study,
        cgpa: userDetails.cgpa,
        skills: userDetails.skills,
        backlogs: userDetails.backlogs,
        resume_url: userDetails.resume_url,
        dob: userDetails.dob,
        gender: userDetails.gender,
        address: userDetails.address,
        roll_no: userDetails.roll_no,
        marks_10: userDetails.marks_10,
        marks_12: userDetails.marks_12,
        certifications: userDetails.certifications,
        projects: userDetails.projects,
        job_roles: userDetails.job_roles,
        job_locations: userDetails.job_locations,
        placement_status: userDetails.placement_status
      };
    });

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;