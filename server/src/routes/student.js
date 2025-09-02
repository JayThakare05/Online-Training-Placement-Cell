import express from "express";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Student middleware
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Unauthorized. Student access required.' });
  }
  next();
};

// Student-specific routes can be added here
// For example: applications, saved jobs, etc.

export default router;