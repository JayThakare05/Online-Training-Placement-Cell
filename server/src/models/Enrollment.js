// models/Enrollment.js
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.Mixed, // Change to Mixed to accept both types
    ref: 'User',
    required: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'completed', 'cancelled'],
    default: 'enrolled'
  },
  enrolled_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update the index to handle mixed types
enrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);