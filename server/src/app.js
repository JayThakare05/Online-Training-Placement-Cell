import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/admin.js";
import studentRoutes from "./routes/student.js";
import recruiterRoutes from "./routes/recruiter.js";
import profileRoutes from "./routes/profile.js";
import jobRoutes from "./routes/jobs.js";
import contentRoutes from "./routes/contentRoutes.js";
import reportsRoutes from './routes/reports.js';
import './models/Content.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Routes - maintaining EXACT same endpoints
app.use("/api/auth", authRoutes);          // Login, register, me
app.use("/api/auth", adminRoutes);         // All admin routes under /api/auth/admin/...
app.use("/api/auth", studentRoutes);       // Student routes under /api/auth/...
app.use("/api/auth", recruiterRoutes);     // Recruiter routes under /api/auth/...
app.use("/api/auth", profileRoutes);       // Profile routes under /api/auth/...
app.use("/api/jobs", jobRoutes);           // Job routes under /api/jobs/...
app.use("/api/content", contentRoutes);
app.use("/api/reports", reportsRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "API is healthy",
    timestamp: new Date().toISOString()
  });
});

export default app;