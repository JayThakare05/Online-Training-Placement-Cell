import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['folder', 'video', 'document', 'quiz', 'coding-question', 'interactive'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null // null means it's a root folder
  },
  file_url: {
    type: String, // For videos, documents, etc.
    default: null
  },
  duration: {
    type: String, // "2 hours", "30 min read", etc.
    default: null
  },
  enrollments: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  },
  content_data: {
    type: mongoose.Schema.Types.Mixed, // For quiz questions, coding problems, etc.
    default: null
  },
  order: {
    type: Number,
    default: 0 // For ordering within parent folder
  },
  // Option 1: Remove user reference completely
  created_by: {
    type: String, // Just store user ID as string
    required: true
  }
  
  // Option 2: Or make it optional
  // created_by: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: false
  // }
}, {
  timestamps: true
});

// Index for better performance
contentSchema.index({ parent_id: 1, order: 1 });
contentSchema.index({ type: 1, status: 1 });

const Content = mongoose.model('Content', contentSchema);
export default Content;