import mongoose from 'mongoose';

const SolutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion',
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['c', 'cpp', 'java', 'python', 'javascript']
  },
  code: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  feedback: {
    type: String,
    default: ''
  },
  issues: [{
    type: String
  }],
  efficiency: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    required: true
  },
  passedTestCases: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
SolutionSchema.index({ userId: 1, questionId: 1 });
SolutionSchema.index({ submittedAt: -1 });
SolutionSchema.index({ isCorrect: 1 });

export default mongoose.model('Solution', SolutionSchema);