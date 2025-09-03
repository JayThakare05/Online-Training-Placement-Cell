import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import Attempt from '../models/Attempts.js'; // Import the new model

const router = express.Router();
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Existing /generate-questions route remains unchanged
router.post('/generate-questions', async (req, res) => {
  try {
    const { type, difficulty } = req.body;
    if (!type || !difficulty) {
      return res.status(400).json({ error: 'Interview type and difficulty are required.' });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a senior interviewer. Generate exactly 5 unique and insightful mock interview questions for a candidate. 
      The questions should be appropriate for a **${type}** interview at an **${difficulty}** difficulty level.
      - **For HR interviews**: Focus on behavioral, situational, and general professional questions.
      - **For Technical interviews**: Focus on core computer science concepts (e.g., data structures, algorithms, operating systems, databases).
      - **For Coding interviews**: Provide specific, well-defined coding problems that can be solved with code.
      Format the response as a simple JSON array of strings, like this:
      ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
    `;
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, '').trim();
    const questions = JSON.parse(text);
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error('API response did not return an array of 5 questions.');
    }
    res.json({ questions });
  } catch (error) {
    console.error('Error generating mock interview questions:', error);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

// New route for submitting answers, scoring, and saving to MongoDB
router.post('/submit-answers', async (req, res) => {
  try {
    const { type, difficulty, questions, answers } = req.body;

    if (!type || !difficulty || !questions || !answers) {
      return res.status(400).json({ error: 'Missing required data.' });
    }

    // Convert questions and answers into a formatted string for Gemini
    const evaluationContent = questions.map((q, i) => `Q${i + 1}: ${q}\nAnswer: ${answers[i] || 'No answer provided'}`).join('\n\n');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an experienced career coach and interviewer. Evaluate the following interview responses based on their quality, clarity, and completeness.
      
      Questions & Answers:
      ${evaluationContent}

      Instructions:
      1. Provide a **numerical score out of 50**. A score of 50 indicates excellent performance.
      2. Provide **constructive feedback and suggestions** for improvement. The suggestions should be concise and actionable.
      3. Format your response as a JSON object with two keys: "score" (number) and "suggestions" (string).
      
      Example:
      {
        "score": 45,
        "suggestions": "Your answer for Q1 was strong, but for Q3, you could have provided a more specific example of a time you handled a conflict."
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, '').trim();
    const evaluation = JSON.parse(text);

    // Save the attempt to the database
    const newAttempt = new Attempt({
      type,
      difficulty,
      questions,
      answers,
      score: evaluation.score,
      suggestions: evaluation.suggestions,
    });
    await newAttempt.save();

    res.json({
      score: evaluation.score,
      suggestions: evaluation.suggestions,
      message: 'Answers submitted and evaluated successfully!'
    });

  } catch (error) {
    console.error('Error scoring and saving answers:', error);
    res.status(500).json({ error: 'Failed to score and save the interview.' });
  }
});

export default router;