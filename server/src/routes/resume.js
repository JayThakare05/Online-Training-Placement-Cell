import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from "dotenv";
// Choose one of these PDF parsing libraries:
// Option 1: pdf-parse (simple but older)
// import pdf from 'pdf-parse';

// Option 2: pdf2json (more features, better maintained)
import PDFParser from 'pdf2json';

// Option 3: pdfjs-dist (Mozilla's PDF.js)
// import * as pdfjs from 'pdfjs-dist';

// Option 4: pdf.js-extract (simplified wrapper)
// import PDFExtract from 'pdf.js-extract';

const router = express.Router();
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// PDF parsing function with multiple options
async function parsePDFContent(buffer) {
  try {
    // Option 1: Using pdf-parse
    // const pdf = await import('pdf-parse');
    // const pdfData = await pdf.default(buffer);
    // return pdfData.text;

    // Option 2: Using pdf2json
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', errData => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', pdfData => {
        try {
          // Extract text from parsed PDF data
          let text = '';
          if (pdfData.Pages) {
            pdfData.Pages.forEach(page => {
              if (page.Texts) {
                page.Texts.forEach(textItem => {
                  if (textItem.R) {
                    textItem.R.forEach(r => {
                      if (r.T) {
                        text += decodeURIComponent(r.T) + ' ';
                      }
                    });
                  }
                });
              }
              text += '\n';
            });
          }
          resolve(text.trim());
        } catch (error) {
          reject(error);
        }
      });
      
      pdfParser.parseBuffer(buffer);
    });

    // Option 3: Using pdfjs-dist
    // const loadingTask = pdfjs.getDocument({ data: buffer });
    // const pdf = await loadingTask.promise;
    // let text = '';
    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const textContent = await page.getTextContent();
    //   const pageText = textContent.items.map(item => item.str).join(' ');
    //   text += pageText + '\n';
    // }
    // return text;

    // Option 4: Using pdf.js-extract
    // const pdfExtract = new PDFExtract();
    // return new Promise((resolve, reject) => {
    //   pdfExtract.extractBuffer(buffer, {}, (err, data) => {
    //     if (err) {
    //       reject(err);
    //       return;
    //     }
    //     const text = data.pages.map(page => 
    //       page.content.map(item => item.str).join(' ')
    //     ).join('\n');
    //     resolve(text);
    //   });
    // });
    
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let fileContent;
    
    // Check file type and parse accordingly
    const fileType = req.file.mimetype;
    
    if (fileType === 'application/pdf') {
      // Parse PDF content using the selected method
      try {
        fileContent = await parsePDFContent(req.file.buffer);
        
        if (!fileContent || fileContent.trim().length === 0) {
          return res.status(400).json({ error: 'Could not extract text from PDF' });
        }
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        return res.status(400).json({ error: 'Failed to parse PDF file: ' + pdfError.message });
      }
    } else if (fileType === 'text/plain') {
      // Handle plain text files
      fileContent = req.file.buffer.toString('utf-8');
    } else if (fileType === 'application/msword' || 
               fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For Word documents, you might want to add docx parsing
      // You could use mammoth.js for this
      return res.status(400).json({ error: 'Word document parsing not implemented yet' });
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file type. Please upload a PDF or text file.' 
      });
    }

    // Validate extracted content
    if (!fileContent || fileContent.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract content from file' });
    }

    const prompt = `
You are an Applicant Tracking System (ATS) resume evaluation engine specialized for **technology resumes**.  
Your task is to evaluate the following resume content and provide:  
1. An ATS Score (0–100)  
2. Key strengths  
3. Areas for improvement  
4. Actionable recommendations  

⚡ Important Scoring Guidelines:  
- Always provide a **numeric score between 0 and 100**.  
- Use the entire scoring range fairly:  
  - 0–30 = Very weak resume (major formatting/content issues)  
  - 31–60 = Basic resume, partially ATS-friendly, needs significant optimization  
  - 61–80 = Good resume, well-structured, moderately ATS-optimized  
  - 81–100 = Excellent resume, highly ATS-optimized for tech hiring  

⚡ Special Consideration for Students / Freshers / Early-Career Tech Professionals:  
- Do not penalize heavily for **limited work experience**.  
- Give **extra weight** to projects, academic achievements, certifications, internships, and technical skills.  
- Recognize GitHub/portfolio links as strong ATS-friendly signals for tech roles.  
- Highlight transferable skills, programming languages, and problem-solving ability.  

⚡ Evaluation Criteria:  
1. **Keywords & Skills Match** – Presence of relevant technical and soft skills (programming, frameworks, tools).  
2. **Projects & Certifications** – Highlight hands-on projects, open-source contributions, hackathons, online certifications.  
3. **Formatting & Structure** – Clear sections (*Education, Projects, Skills, Certifications, Experience*), ATS-readable formatting.  
4. **Achievements** – Use of metrics, results, or outcomes in projects/experience.  
5. **ATS Friendliness** – Avoidance of images, graphics, complex tables; plain text readability.  

⚡ Output Format:  
Respond **only in valid JSON**, strictly following this schema:  

{
  "score": number,
  "strengths": [ "point 1", "point 2", "point 3" ],
  "improvements": [ "point 1", "point 2", "point 3" ],
  "recommendations": [ "specific actionable advice to improve the resume" ]
}

---

Resume Content to Analyze:
${fileContent}

`;

    console.log('API Key from env:', process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up JSON (remove code block markers if present)
    text = text.replace(/```json|```/g, '').trim();

    const analysis = JSON.parse(text);

    res.json(analysis);
    
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

export default router;