import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import './models/Content.js';
import profileRoutes from "./routes/profileRoutes.js";
dotenv.config(); // 👈 Move this to the top

const app = express();

// Middleware (order matters!)
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/profile", profileRoutes);
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