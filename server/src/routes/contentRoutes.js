import express from 'express';
import { 
  getContentTree, 
  getContentList, 
  createContent, 
  updateContent, 
  deleteContent, 
  getContentById,
  uploadContentFile  // Add this import
} from '../controllers/contentController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js'; // Make sure you have this

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Add the upload route
router.post('/upload', upload.single('file'), uploadContentFile);

// Get content in tree format (hierarchical)
router.get('/tree', getContentTree);

// Get content in list format (flat)
router.get('/list', getContentList);

// Get specific content by ID
router.get('/:id', getContentById);

// Admin-only routes
router.post('/', adminOnly, createContent);
router.put('/:id', adminOnly, updateContent);
router.delete('/:id', adminOnly, deleteContent);

export default router;