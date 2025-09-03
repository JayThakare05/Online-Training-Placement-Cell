import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  questions: {
    type: [String],
    required: true,
  },
  answers: {
    type: Object,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  suggestions: {
    type: String,
    required: true,
  },
});

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;