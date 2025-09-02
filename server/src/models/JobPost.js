// =============================================
// 1. MongoDB Schema/Model for Job Posts
// =============================================

// models/JobPost.js
import mongoose from 'mongoose';

const JobPostSchema = new mongoose.Schema({
  // Job Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    required: true
  },
  skills: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    default: 'Full-time'
  },
  
  // Recruiter Information (from MySQL)
  recruiter: {
    user_id: {
      type: Number,
      required: true,
      ref: 'User' // Reference to MySQL user
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    company_name: {
      type: String,
      required: true
    },
    recruiter_name: {
      type: String,
      required: true
    },
    designation: {
      type: String
    },
    contact_number: {
      type: String
    }
  },
  
  // Social Features
  likes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      user_id: Number,
      user_name: String,
      user_role: {
        type: String,
        enum: ['student', 'recruiter', 'admin']
      },
      liked_at: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  comments: [{
    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    user: {
      user_id: Number,
      name: String,
      role: {
        type: String,
        enum: ['student', 'recruiter', 'admin']
      }
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    // Nested replies support
    replies: [{
      reply_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId()
      },
      user: {
        user_id: Number,
        name: String,
        role: String
      },
      content: String,
      created_at: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // Application tracking
  applications: {
    count: {
      type: Number,
      default: 0
    },
    applied_users: [{
      user_id: Number,
      student_name: String,
      applied_at: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['applied', 'shortlisted', 'rejected', 'selected'],
        default: 'applied'
      }
    }]
  },
  
  // Post status and visibility
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  
  isVerifiedRecruiter: {
    type: Boolean,
    default: false
  },
  
  // SEO and search optimization
  tags: [String],
  slug: {
    type: String,
    unique: true
  },
  
  // Analytics
  views: {
    count: {
      type: Number,
      default: 0
    },
    unique_viewers: [Number] // user_ids who viewed
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'job_posts'
});

// Indexes for better performance
JobPostSchema.index({ 'recruiter.user_id': 1 });
JobPostSchema.index({ 'recruiter.company_name': 1 });
JobPostSchema.index({ status: 1, createdAt: -1 });
JobPostSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobPostSchema.index({ slug: 1 }, { unique: true });

// Generate slug before saving
JobPostSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();
  }
  next();
});

export default mongoose.model('JobPost', JobPostSchema);
