import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import CodingQuestion from "../models/uploadQuestions.js";
import multer from "multer";
import XLSX from 'xlsx';
// Add this import at the top of your router file
import mongoose from "mongoose";
const storage = multer.memoryStorage();
const router = express.Router();

const uploadExcel = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];

        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel files (.xlsx, .xls) are allowed!"), false);
        }
    },
});

// ================== PARSE EXCEL AND EXTRACT QUESTIONS ==================
router.post("/parse-excel", authenticateToken, uploadExcel.single("excel"), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No Excel file uploaded' });
        }

        console.log('Starting Excel parsing with SheetJS...');
        console.log('File info:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        try {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            console.log(`Processing worksheet: ${sheetName}`);
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: ''
            });

            console.log(`Raw data extracted. Rows: ${rawData.length}`);

            if (rawData.length < 2) {
                return res.status(400).json({
                    message: 'Excel file must have at least 2 rows (header + data)'
                });
            }

            const questions = parseQuestionsFromExcel(rawData);
            console.log(`Questions parsed: ${questions.length}`);

            res.status(200).json({
                message: 'Excel parsed successfully',
                questions: questions,
                count: questions.length
            });

        } catch (parseError) {
            console.error('Error parsing Excel file:', parseError);
            return res.status(400).json({
                message: 'Failed to parse Excel file. Please check the format.',
                error: parseError.message
            });
        }

    } catch (error) {
        console.error('Error processing Excel:', error);
        res.status(500).json({
            message: error.message || 'Failed to process Excel file',
            error: error.message
        });
    }
});

// ================== BULK UPLOAD QUESTIONS ==================
router.post("/bulk", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
        }

        const { questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'No questions provided' });
        }

        const result = await CodingQuestion.insertMany(questions, { ordered: false });

        res.status(201).json({
            message: 'Questions uploaded successfully',
            count: result.length,
            questions: result
        });
    } catch (error) {
        console.error('Error uploading questions:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                error: error.message,
                details: error.errors
            });
        }

        if (error.name === 'MongoBulkWriteError') {
            const writeErrors = error.writeErrors || [];
            const errorDetails = writeErrors.map(err => ({
                index: err.index,
                questionNumber: questions[err.index]?.questionNumber,
                error: err.errmsg
            }));

            return res.status(400).json({
                message: 'Some questions could not be uploaded',
                successful: error.result?.nInserted || 0,
                failed: writeErrors.length,
                errors: errorDetails
            });
        }

        res.status(500).json({
            message: 'Failed to upload questions',
            error: error.message
        });
    }
});

// ================== EXCEL PARSING FUNCTIONS ==================

function parseQuestionsFromExcel(rawData) {
    const questions = [];
    const headers = rawData[0];

    console.log('Headers found:', headers);

    const columnMappings = {
        questionNumber: findColumnIndex(headers, ['problem id', 'question number', 'question_number', 'questionNumber', 'number', '#', 'q_no', 'Question no.']),
        questionName: findColumnIndex(headers, ['problem name', 'question name', 'question_name', 'questionName', 'name', 'title', 'Question']),
        description: findColumnIndex(headers, ['description', 'desc', 'problem', 'problem statement', 'problem_statement']),
        difficulty: findColumnIndex(headers, ['difficulty', 'level', 'diff']),
        constraints: findColumnIndex(headers, ['constraints']),
        inputExample: findColumnIndex(headers, ['input example', 'input', 'sample input']),
        outputExample: findColumnIndex(headers, ['output example', 'output', 'expected output', 'sample output']),
        explanation: findColumnIndex(headers, ['explanation'])
    };

    console.log('Column mappings:', columnMappings);

    // Ensure at least the required columns are present
    const requiredColumns = ['questionNumber', 'questionName', 'description', 'difficulty'];
    const missingColumns = requiredColumns.filter(key => columnMappings[key] === -1);

    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has the correct headers.`);
    }

    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
            console.log(`Skipping empty row ${i + 1}`);
            continue;
        }

        try {
            const question = {
                questionNumber: parseQuestionNumber(row[columnMappings.questionNumber]),
                questionName: cleanString(row[columnMappings.questionName]),
                description: cleanString(row[columnMappings.description]),
                difficulty: normalizeDifficulty(cleanString(row[columnMappings.difficulty])),
                constraints: cleanString(row[columnMappings.constraints]),
                examples: [],
                testCases: [],
                outputRules: [],
                tags: []
            };

            // Populate the examples array if the columns exist
            const inputEx = cleanString(row[columnMappings.inputExample]);
            const outputEx = cleanString(row[columnMappings.outputExample]);
            const explanationEx = cleanString(row[columnMappings.explanation]);
            
            if (inputEx || outputEx || explanationEx) {
                question.examples.push({
                    input: inputEx,
                    output: outputEx,
                    explanation: explanationEx
                });
                
                // Also add it as a sample test case for backward compatibility
                if (inputEx && outputEx) {
                    question.testCases.push({
                        input: inputEx,
                        expectedOutput: outputEx,
                        isSample: true
                    });
                }
            }
            
            // Add a basic output rule if we have output example
            if (outputEx) {
                question.outputRules.push({
                    type: typeof outputEx === 'number' ? 'integer' : 'string',
                    format: 'As shown in examples'
                });
            }
            
            questions.push(question);
            console.log(`✅ Parsed Q${question.questionNumber}: ${question.questionName.substring(0, 30)}...`);

        } catch (error) {
            console.error(`Error parsing row ${i + 1}:`, error.message);
            continue;
        }
    }

    questions.sort((a, b) => a.questionNumber - b.questionNumber);
    console.log(`🎉 Total valid questions parsed: ${questions.length}`);
    return questions;
}

function findColumnIndex(headers, possibleNames) {
    for (const name of possibleNames) {
        const index = headers.findIndex(header =>
            header && header.toString().toLowerCase().trim() === name.toLowerCase()
        );
        if (index !== -1) {
            return index;
        }
    }
    return -1;
}

function parseQuestionNumber(value) {
    if (value === null || value === undefined || value === '') {
        throw new Error('Question number is required');
    }

    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
        throw new Error('Question number must be a positive integer');
    }

    return num;
}

function cleanString(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return value.toString().trim();
}

function normalizeDifficulty(difficulty) {
    if (!difficulty) {
        throw new Error('Difficulty is required');
    }

    const normalized = difficulty.toLowerCase();
    if (normalized === 'easy' || normalized === 'e') {
        return 'Easy';
    } else if (normalized === 'medium' || normalized === 'med' || normalized === 'm') {
        return 'Medium';
    } else if (normalized === 'hard' || normalized === 'difficult' || normalized === 'diff' || normalized === 'h') {
        return 'Hard';
    } else {
        throw new Error(`Invalid difficulty: ${difficulty}. Must be Easy, Medium, or Hard`);
    }
}

function validateQuestion(question, rowNumber) {
    const errors = [];
    if (!question.questionNumber || question.questionNumber < 1) {
        errors.push('Invalid question number');
    }
    if (!question.questionName || question.questionName.trim() === '') {
        errors.push('Question name is required');
    }
    if (!question.description || question.description.trim() === '') {
        errors.push('Description is required');
    }
    if (!question.difficulty || !['Easy', 'Medium', 'Hard'].includes(question.difficulty)) {
        errors.push('Valid difficulty is required (Easy/Medium/Hard)');
    }
    return errors;
}

router.get("/", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
        }
        const questions = await CodingQuestion.find().sort({ questionNumber: 1 });
        res.status(200).json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
});

router.get("/random", authenticateToken, async (req, res) => {
  try {
    // Remove the admin check or modify it based on your requirements
    const { difficulty } = req.query;
    
    let filter = {};
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    
    const count = await CodingQuestion.countDocuments(filter);
    
    if (count === 0) {
      return res.status(404).json({ message: 'No questions found' });
    }
    
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuestion = await CodingQuestion.findOne(filter).skip(randomIndex);
    
    if (!randomQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(200).json(randomQuestion);
  } catch (error) {
    console.error('Error fetching random question:', error);
    res.status(500).json({
      message: 'Failed to fetch random question',
      error: error.message
    });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    let question;
    if (mongoose.Types.ObjectId.isValid(id)) {
      question = await CodingQuestion.findById(id);
    } else {
      const questionNumber = parseInt(id);
      if (!isNaN(questionNumber)) {
        question = await CodingQuestion.findOne({ questionNumber });
      }
    }
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    res.status(200).json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      message: 'Failed to fetch question',
      error: error.message
    });
  }
});

export default router;