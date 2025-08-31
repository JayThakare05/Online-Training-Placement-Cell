import dotenv from "dotenv";
import { connectMongoDB, connectMySQL } from "./config/db.js";
import app from "./app.js"; // 👈 Import the configured app instead of creating new one

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectMongoDB();
    await connectMySQL();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("❌ Startup Error:", err.message);
    process.exit(1);
  }
};

startServer();