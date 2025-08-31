// server/src/config/db.js
import mongoose from "mongoose";
import mysql from "mysql2/promise";

// -------- MongoDB Connection ----------
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
};

// -------- MySQL Connection ----------
let mysqlPool;

export const connectMySQL = async () => {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // test connection
    const [rows] = await mysqlPool.query("SELECT 1 + 1 AS result");
    console.log("✅ MySQL Connected:", rows[0].result);
  } catch (err) {
    console.error("❌ SQL Connection Error:", err.message);
    process.exit(1);
  }
};

// Getter for MySQL pool
export const getMySQLPool = () => {
  if (!mysqlPool) throw new Error("MySQL not connected yet!");
  return mysqlPool;
};
