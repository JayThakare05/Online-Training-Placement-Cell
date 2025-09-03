import mongoose from "mongoose";

const outputRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["integer", "string", "array", "object", "boolean"],
    required: true
  },
  format: {
    type: String,
    required: true
  }
});

const testCaseSchema = new mongoose.Schema({
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expectedOutput: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isSample: {
    type: Boolean,
    default: false
  }
});

const codingQuestionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true
  },
  output: {
    type: String,
    required: true
  },
  outputRules: [outputRuleSchema],
  testCases: [testCaseSchema],
  constraints: {
    type: String,
    default: ""
  },
  examples: [{
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    explanation: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
codingQuestionSchema.index({ questionNumber: 1 });
codingQuestionSchema.index({ difficulty: 1 });
codingQuestionSchema.index({ tags: 1 });

// Update the updatedAt field before saving
codingQuestionSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const CodingQuestion = mongoose.model("CodingQuestion", codingQuestionSchema);

export default CodingQuestion;