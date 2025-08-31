import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getMySQLPool } from "../config/db.js"; // 👈 Import the getter function

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const pool = getMySQLPool(); // 👈 Get the pool using the getter function
    
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Role-specific insertion
    if (role === "student") {
      await pool.query("INSERT INTO students (user_id) VALUES (?)", [userId]);
    } else if (role === "recruiter") {
      await pool.query("INSERT INTO recruiters (user_id) VALUES (?)", [userId]);
    } else if (role === "admin") {
      await pool.query("INSERT INTO admins (user_id, access_role) VALUES (?, ?)", [userId, "coordinator"]);
    }

    res.status(201).json({ message: "Registered successfully, please login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) return res.status(400).json({ message: "User not found" });

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 👇 send extra fields
    res.json({
      token,
      role: user.role,
      id: user.id,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;