import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Question from "../models/uploadQuestions.js";
import Solution from "../models/Solution.js";
import mongoose from "mongoose"; // Mongoose import is needed for ObjectId in `submit-solution` route

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LANG_MAP = { c: 50, cpp: 54, java: 62, javascript: 63, python: 71 };

// Existing run endpoint
router.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "language and code are required" });
  }

  const language_id = LANG_MAP[language];
  if (!language_id) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    const submission = await axios.post(
      `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id,
        stdin: input || ""
      },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY
        },
        timeout: 20000
      }
    );

    const d = submission.data || {};
    const output =
      d.compile_output ||
      d.stderr ||
      d.stdout ||
      (d.status ? d.status.description : "No output");

    res.json({
      output,
      time: d.time,
      memory: d.memory,
      status: d.status ? d.status.description : "N/A"
    });
  } catch (e) {
    console.error(e?.response?.data || e.message);
    res.status(500).json({ error: "Execution failed. Try again." });
  }
});

// NEW: Submit solution endpoint
router.post("/submit-solution", async (req, res) => {
  const { language, code, output, questionId, userId } = req.body;

  if (!language || !code || !output || !questionId || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // FIX 1: Changed CodingQuestion to Question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Prepare prompt for Gemini API using your schema structure
    const prompt = `
Evaluate this coding solution:

QUESTION: ${question.questionName}
DESCRIPTION: ${question.description}

EXAMPLES:
${question.examples.map((ex, index) => 
  `Example ${index + 1}:
  Input: ${JSON.stringify(ex.input)}
  Expected Output: ${JSON.stringify(ex.output)}
  ${ex.explanation ? `Explanation: ${ex.explanation}` : ''}`
).join('\n\n')}

CONSTRAINTS: ${question.constraints}

TEST CASES (${question.testCases.length} total, ${question.testCases.filter(tc => tc.isSample).length} sample):
${question.testCases.slice(0, 3).map((tc, index) => 
  `Test Case ${index + 1} (${tc.isSample ? 'Sample' : 'Hidden'}):
  Input: ${JSON.stringify(tc.input)}
  Expected: ${JSON.stringify(tc.expectedOutput)}`
).join('\n\n')}

USER'S CODE (${language.toUpperCase()}):
\`\`\`${language}
${code}
\`\`\`

USER'S ACTUAL OUTPUT:
${output}

OUTPUT RULES:
${question.outputRules.map(rule => 
  `- Type: ${rule.type}, Format: ${rule.format}`
).join('\n')}

Analyze if the code:
1. Produces correct output for the given test cases
2. Follows the problem constraints and output rules
3. Implements an efficient solution
4. Handles edge cases properly
5. Adheres to the expected output format

Provide a JSON response with:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": string,
  "issues": string[],
  "efficiency": "poor" | "fair" | "good" | "excellent",
  "passedTestCases": number,
  "totalTestCases": number
}
`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // FIX: Changed to gemini-1.5-flash
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse Gemini response
    let evaluation;
    try {
      evaluation = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      evaluation = {
        isCorrect: false,
        score: 0,
        feedback: "Evaluation failed - could not parse response",
        issues: ["Evaluation system error"],
        efficiency: "poor",
        passedTestCases: 0,
        totalTestCases: question.testCases.length
      };
    }

    // Save solution to database
    // FIX 2: userId is a number from MySQL, so use it directly
    const solution = new Solution({
      userId: userId,
      questionId: questionId,
      language,
      code,
      output,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      feedback: evaluation.feedback,
      issues: evaluation.issues,
      efficiency: evaluation.efficiency,
      passedTestCases: evaluation.passedTestCases,
      totalTestCases: evaluation.totalTestCases,
      submittedAt: new Date()
    });

    await solution.save();

    // Update user's progress. This line is likely for a different database
    // and should be handled separately. I have commented it out for now.
    // try {
    //   await User.findByIdAndUpdate(userId, {
    //     $addToSet: { solvedQuestions: questionId }
    //   }, { new: true });
    // } catch (userError) {
    //   console.warn("Could not update user solved questions:", userError);
    //   // Continue even if user update fails
    // }

    res.json({
      success: true,
      evaluation,
      solutionId: solution._id,
      question: {
        name: question.questionName,
        difficulty: question.difficulty,
        number: question.questionNumber
      }
    });

  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Submission failed. Please try again." });
  }
});

// NEW: Check if question is solved
router.get("/check-solution/:userId/:questionId", async (req, res) => {
  const { userId, questionId } = req.params;

  try {
    // FIX 3: Removed new mongoose.Types.ObjectId() since IDs are likely not BSON
    const solution = await Solution.findOne({
      userId: userId,
      questionId: questionId,
      isCorrect: true
    }).sort({ submittedAt: -1 });

    res.json({
      isSolved: !!solution,
      solution: solution ? {
        language: solution.language,
        submittedAt: solution.submittedAt,
        score: solution.score,
        efficiency: solution.efficiency
      } : null
    });
  } catch (error) {
    console.error("Check solution error:", error);
    res.status(500).json({ error: "Failed to check solution status" });
  }
});

// NEW: Get user's solutions for a question
router.get("/user-solutions/:userId/:questionId", async (req, res) => {
  const { userId, questionId } = req.params;

  try {
    // FIX 4: Removed new mongoose.Types.ObjectId() from both userId and questionId
    const solutions = await Solution.find({
      userId: userId,
      questionId: questionId
    }).sort({ submittedAt: -1 });

    res.json({
      solutions: solutions.map(sol => ({
        id: sol._id,
        language: sol.language,
        score: sol.score,
        isCorrect: sol.isCorrect,
        efficiency: sol.efficiency,
        submittedAt: sol.submittedAt,
        passedTestCases: sol.passedTestCases,
        totalTestCases: sol.totalTestCases
      }))
    });
  } catch (error) {
    console.error("Get solutions error:", error);
    res.status(500).json({ error: "Failed to fetch solutions" });
  }
});

router.get("/solved-count/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Convert userId to number if it's stored as a number in the database
    const userIdNum = parseInt(userId);
    
    // Get distinct questionIds where user has correct solutions
    const solvedProblems = await Solution.aggregate([
      {
        $match: {
          userId: userIdNum, // Use the converted number
          isCorrect: true
        }
      },
      {
        $group: {
          _id: "$questionId"
        }
      },
      {
        $count: "totalSolved"
      }
    ]);

    const count = solvedProblems.length > 0 ? solvedProblems[0].totalSolved : 0;

    res.json({
      userId: userId,
      solvedProblemsCount: count
    });

  } catch (error) {
    console.error("Get solved count error:", error);
    res.status(500).json({ error: "Failed to fetch solved problems count" });
  }
});

// Add this to your backend router (compiler.js)

// NEW: Get user's coding activity timeline
router.get("/coding-activity/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Convert userId to number if it's stored as a number in the database
    const userIdNum = parseInt(userId);
    
    // Get all correct solutions with their submission dates
    const solutions = await Solution.find({
      userId: userIdNum,
      isCorrect: true
    }).sort({ submittedAt: 1 });

    // Format the data for the contribution graph
    const activityData = {};
    
    solutions.forEach(solution => {
      const date = new Date(solution.submittedAt);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const day = date.getDate();
      
      const key = `${year}-${month}-${day}`;
      
      if (!activityData[key]) {
        activityData[key] = 0;
      }
      activityData[key]++;
    });

    res.json({
      userId: userId,
      activity: activityData,
      totalSolutions: solutions.length
    });

  } catch (error) {
    console.error("Get coding activity error:", error);
    res.status(500).json({ error: "Failed to fetch coding activity" });
  }
});
export default router;
