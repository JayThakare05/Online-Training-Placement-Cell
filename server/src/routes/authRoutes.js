import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer"; // for file uploads
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Multer memory storage (store photo in memory, then push to DB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow only jpg/jpeg/png
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/png"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png formats allowed!"), false);
    }
  },
});

// ================== REGISTER ==================
// Register (with photo)
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // ✅ now req.body will work
    const photo = req.file ? req.file.buffer : null;  // photo in BLOB format

    const pool = getMySQLPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
  "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
  [name, email, hashedPassword, role]
);

const userId = result.insertId;

// save profile photo in role-specific table
if (req.file) {
  const photoBuffer = req.file.buffer;
  if (role === "student") {
    await pool.query("INSERT INTO students (user_id, profile_photo) VALUES (?, ?)", [userId, photoBuffer]);
  } else if (role === "recruiter") {
    await pool.query("INSERT INTO recruiters (user_id, profile_photo) VALUES (?, ?)", [userId, photoBuffer]);
  } else if (role === "admin") {
    await pool.query("INSERT INTO admins (user_id, access_role, profile_photo) VALUES (?, ?, ?)", [userId, "coordinator", photoBuffer]);
  }
}


    res.status(201).json({ message: "Registered successfully, please login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== LOGIN ==================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      token,
      role: user.role,
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== ME ==================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== UPLOAD PHOTO ==================
router.post(
  "/upload-photo",
  authenticateToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const photoBuffer = req.file.buffer; // Binary data
      const pool = getMySQLPool();

      if (req.user.role === "student") {
        await pool.query(
          "UPDATE students SET profile_photo = ? WHERE user_id = ?",
          [photoBuffer, req.user.id]
        );
      } else if (req.user.role === "recruiter") {
        await pool.query(
          "UPDATE recruiters SET profile_photo = ? WHERE user_id = ?",
          [photoBuffer, req.user.id]
        );
      } else if (req.user.role === "admin") {
        await pool.query(
          "UPDATE admins SET profile_photo = ? WHERE user_id = ?",
          [photoBuffer, req.user.id]
        );
      }

      res.json({ message: "Profile photo uploaded successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================== GET PHOTO ==================
router.get("/photo/:userId", async (req, res) => {
  try {
    const pool = getMySQLPool();

    // Find user role first
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [req.params.userId]
    );
    if (userRows.length === 0)
      return res.status(404).json({ message: "User not found" });

    let table;
    if (userRows[0].role === "student") table = "students";
    else if (userRows[0].role === "recruiter") table = "recruiters";
    else table = "admins";

    const [rows] = await pool.query(
      `SELECT profile_photo FROM ${table} WHERE user_id = ?`,
      [req.params.userId]
    );

    if (rows.length === 0 || !rows[0].profile_photo) {
      return res.status(404).json({ message: "No photo found" });
    }

    res.set("Content-Type", "image/jpeg"); // default since we didn’t store mime type
    res.send(rows[0].profile_photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// server/src/routes/auth.js
router.get("/photo/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.photo) {
      return res.status(404).send("No photo found");
    }

    res.set("Content-Type", user.photo.contentType);
    res.send(user.photo.data);
  } catch (err) {
    res.status(500).send("Error fetching photo");
  }
});


export default router;
