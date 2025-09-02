import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import JobPost from '../models/JobPost.js';
import { getMySQLPool } from "../config/db.js";
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
      .exec();

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

    const newComment = {
      user: {
        user_id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      content: content.trim()
    };

    jobPost.comments.push(newComment);
    await jobPost.save();

    // Return the newly added comment
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

export default router;