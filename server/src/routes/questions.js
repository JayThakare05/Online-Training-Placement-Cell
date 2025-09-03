import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import CodingQuestion from "../models/uploadQuestions.js";
import multer from "multer";
import XLSX from 'xlsx';

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
      // Parse the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      console.log(`Processing worksheet: ${sheetName}`);
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array of arrays format
        defval: '' // Default value for empty cells
      });
      
      console.log(`Raw data extracted. Rows: ${rawData.length}`);
      
      if (rawData.length < 2) {
        return res.status(400).json({ 
          message: 'Excel file must have at least 2 rows (header + data)' 
        });
      }
      
      // Parse questions from the data
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

    // Validate each question
    const validationErrors = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const errors = [];
      
      if (!q.questionNumber) errors.push('questionNumber is required');
      if (!q.questionName) errors.push('questionName is required');
      if (!q.description) errors.push('description is required');
      if (!q.difficulty) errors.push('difficulty is required');
      if (!q.output) errors.push('output is required');
      
      if (q.difficulty && !['Easy', 'Medium', 'Hard'].includes(q.difficulty)) {
        errors.push('difficulty must be Easy, Medium, or Hard');
      }
      
      if (q.questionNumber && (typeof q.questionNumber !== 'number' || q.questionNumber < 1)) {
        errors.push('questionNumber must be a positive number');
      }

      if (errors.length > 0) {
        validationErrors.push({
          questionIndex: i,
          questionNumber: q.questionNumber,
          errors: errors
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        validationErrors: validationErrors
      });
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
        error: error.message 
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
  const headers = rawData[0]; // First row contains headers
  
  console.log('Headers found:', headers);
  
  // Expected column mappings (case-insensitive)
  const columnMappings = {
    questionNumber: findColumnIndex(headers, ['question number', 'question_number', 'questionNumber', 'number', '#', 'q_no', 'Question no.']),
    questionName: findColumnIndex(headers, ['question name', 'question_name', 'questionName', 'name', 'title', 'Question']),
    description: findColumnIndex(headers, ['description', 'desc', 'problem', 'problem statement', 'problem_statement']),
    difficulty: findColumnIndex(headers, ['difficulty', 'level', 'diff']),
    output: findColumnIndex(headers, ['output', 'expected output', 'expected_output', 'result', 'answer'])
  };
  
  console.log('Column mappings:', columnMappings);
  
  // Validate that all required columns are found
  const missingColumns = [];
  Object.entries(columnMappings).forEach(([key, index]) => {
    if (index === -1) {
      missingColumns.push(key);
    }
  });
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has the correct headers.`);
  }
  
  // Process data rows (skip header row)
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
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
        output: cleanString(row[columnMappings.output]),
        constraints: "",
        examples: [],
        tags: []
      };
      
      // Validate the question
      const validationErrors = validateQuestion(question, i + 1);
      if (validationErrors.length > 0) {
        console.warn(`Row ${i + 1} validation errors:`, validationErrors);
        continue; // Skip invalid questions
      }
      
      questions.push(question);
      console.log(`✅ Parsed Q${question.questionNumber}: ${question.questionName.substring(0, 30)}...`);
      
    } catch (error) {
      console.error(`Error parsing row ${i + 1}:`, error.message);
      continue; // Skip problematic rows
    }
  }
  
  // Sort questions by question number
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
  
  if (!question.output || question.output.trim() === '') {
    errors.push('Output specification is required');
  }
  
  return errors;
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    // Ensure only admins can fetch all questions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Fetch all questions from the database, sorted by questionNumber
    const questions = await CodingQuestion.find().sort({ questionNumber: 1 });
    
    // Respond with the questions
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch questions',
      error: error.message 
    });
  }
});

export default router;