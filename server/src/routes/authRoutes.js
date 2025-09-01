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
// ================== REGISTER ==================
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const photo = req.file ? req.file.buffer : null;

    const pool = getMySQLPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Insert into role-specific table regardless of photo upload
    if (role === "student") {
      const { dob, gender, contact, roll_no, college, department, year_of_study, cgpa } = req.body;
      
      await pool.query(
        `INSERT INTO students 
         (user_id, dob, gender, contact_number, roll_no, college, department, year_of_study, cgpa, profile_photo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          dob || null,
          gender || null,
          contact || null,
          roll_no || null,
          college || null,
          department || null,
          year_of_study || null,
          cgpa || null,
          photo
        ]
      );
    } else if (role === "recruiter") {
      const {
        companyName,
        industry,
        website,
        recruiterName,
        designation,
        jobTitle,
        skills,
        contact
      } = req.body;

      await pool.query(
        `INSERT INTO recruiters 
          (user_id, company_name, industry_type, website, recruiter_name, designation, job_title, required_skills, contact_number, profile_photo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          companyName || null,
          industry || null,
          website || null,
          recruiterName || null,
          designation || null,
          jobTitle || null,
          skills || null,
          contact || null,
          photo
        ]
      );
    } else if (role === "admin") {
      const { designation, contact, instituteId, accessRole } = req.body;
      
      await pool.query(
        `INSERT INTO admins 
         (user_id, designation, contact_number, college_id_proof, access_role, profile_photo) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          designation || null,
          contact || null,
          instituteId || null,
          accessRole || "coordinator",
          photo
        ]
      );
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

// ================== ADMIN DASHBOARD STATS (WITH DEBUG) ==================
router.get("/admin/dashboard-stats", authenticateToken, async (req, res) => {
  console.log("Dashboard stats route hit");
  console.log("User:", req.user);
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log("Access denied - not admin:", req.user.role);
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    console.log("Admin access granted");
    const pool = getMySQLPool();

    // Test database connection first
    console.log("Testing database connection...");
    
    try {
      // Simple test query
      const [testResult] = await pool.query("SELECT 1 as test");
      console.log("Database connection successful:", testResult);
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Fetch all counts using raw MySQL queries with error handling
    console.log("Fetching counts...");
    
    const [totalStudentsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );
    console.log("Total students result:", totalStudentsResult);
    
    const [totalRecruitersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM recruiters"
    );
    console.log("Total recruiters result:", totalRecruitersResult);
    
    // Check if isVerified column exists
    try {
      const [pendingVerificationsResult] = await pool.query(
        "SELECT COUNT(*) as count FROM recruiters WHERE isVerified = false"
      );
      console.log("Pending verifications result:", pendingVerificationsResult);
    } catch (colError) {
      console.error("isVerified column error:", colError);
      return res.status(500).json({ 
        message: 'Database schema error - isVerified column missing in recruiters table' 
      });
    }
    
    // Check if isPlaced column exists
    try {
      const [totalPlacementsResult] = await pool.query(
        "SELECT COUNT(*) as count FROM students WHERE isPlaced = true"
      );
      console.log("Total placements result:", totalPlacementsResult);
    } catch (colError) {
      console.error("isPlaced column error:", colError);
      return res.status(500).json({ 
        message: 'Database schema error - isPlaced column missing in students table' 
      });
    }

    // Re-fetch with proper error handling
    const [totalStudentsResult2] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );
    
    const [totalRecruitersResult2] = await pool.query(
      "SELECT COUNT(*) as count FROM recruiters"
    );
    
    const [pendingVerificationsResult2] = await pool.query(
      "SELECT COUNT(*) as count FROM recruiters WHERE isVerified = false OR isVerified IS NULL"
    );
    
    const [totalPlacementsResult2] = await pool.query(
      "SELECT COUNT(*) as count FROM students WHERE isPlaced = true"
    );

    const stats = {
      totalStudents: totalStudentsResult2[0].count,
      totalRecruiters: totalRecruitersResult2[0].count,
      pendingVerifications: pendingVerificationsResult2[0].count,
      totalPlacements: totalPlacementsResult2[0].count
    };

    console.log("Final stats:", stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Add these new routes to your auth.js file

// ================== GET ALL RECRUITERS (ADMIN ONLY) ==================
// -- Fixed GET ALL RECRUITERS query with proper status mapping
router.get("/admin/recruiters", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const pool = getMySQLPool();
    
    // Fixed SQL query with proper status mapping
    const [recruiters] = await pool.query(`
      SELECT 
        r.recruiter_id,
        r.user_id,
        u.name,
        u.email,
        u.created_at as registered,
        r.company_name as company,
        r.industry_type,
        r.website,
        r.contact_number,
        r.recruiter_name,
        r.designation,
        r.isVerified,
        CASE 
          WHEN r.isVerified = 1 THEN 'approved'
          WHEN r.isVerified = -1 THEN 'rejected'
          ELSE 'pending'
        END as status
      FROM recruiters r
      INNER JOIN users u ON r.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    res.status(200).json(recruiters);
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});
// ================== APPROVE RECRUITER ==================
router.put("/admin/recruiters/:recruiterId/approve", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { recruiterId } = req.params;
    const pool = getMySQLPool();

    // Check if recruiter exists
    const [recruiterCheck] = await pool.query(
      "SELECT recruiter_id FROM recruiters WHERE recruiter_id = ?",
      [recruiterId]
    );

    if (recruiterCheck.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    // Update recruiter verification status
    await pool.query(
      "UPDATE recruiters SET isVerified = 1 WHERE recruiter_id = ?",
      [recruiterId]
    );

    res.status(200).json({ message: 'Recruiter approved successfully' });
  } catch (error) {
    console.error('Error approving recruiter:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ================== REJECT RECRUITER ==================
router.put("/admin/recruiters/:recruiterId/reject", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { recruiterId } = req.params;
    const pool = getMySQLPool();

    // Check if recruiter exists
    const [recruiterCheck] = await pool.query(
      "SELECT recruiter_id FROM recruiters WHERE recruiter_id = ?",
      [recruiterId]
    );

    if (recruiterCheck.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    // Update recruiter verification status to rejected (you can use -1 or create a separate status)
    await pool.query(
      "UPDATE recruiters SET isVerified = -1 WHERE recruiter_id = ?",
      [recruiterId]
    );

    res.status(200).json({ message: 'Recruiter rejected successfully' });
  } catch (error) {
    console.error('Error rejecting recruiter:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ================== DELETE RECRUITER (WITH USER ID CONSISTENCY) ==================
router.delete("/admin/recruiters/:recruiterId", authenticateToken, async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { recruiterId } = req.params;
    
    // Start transaction for data consistency
    await connection.beginTransaction();

    // Get the user_id of the recruiter to be deleted
    const [recruiterData] = await connection.query(
      "SELECT user_id FROM recruiters WHERE recruiter_id = ?",
      [recruiterId]
    );

    if (recruiterData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    const userIdToDelete = recruiterData[0].user_id;

    // Delete recruiter record first (due to foreign key constraint)
    await connection.query(
      "DELETE FROM recruiters WHERE recruiter_id = ?",
      [recruiterId]
    );

    // Delete user record
    await connection.query(
      "DELETE FROM users WHERE id = ?",
      [userIdToDelete]
    );

    // Optional: Update user IDs for consistency (be very careful with this)
    // This will update all user IDs greater than the deleted one
    // WARNING: This can break existing references if not handled properly
    /*
    await connection.query(
      "UPDATE users SET id = id - 1 WHERE id > ?",
      [userIdToDelete]
    );
    
    // Update foreign key references in other tables
    await connection.query(
      "UPDATE students SET user_id = user_id - 1 WHERE user_id > ?",
      [userIdToDelete]
    );
    
    await connection.query(
      "UPDATE recruiters SET user_id = user_id - 1 WHERE user_id > ?",
      [userIdToDelete]
    );
    
    await connection.query(
      "UPDATE admins SET user_id = user_id - 1 WHERE user_id > ?",
      [userIdToDelete]
    );

    // Reset AUTO_INCREMENT value
    const [maxIdResult] = await connection.query("SELECT MAX(id) as maxId FROM users");
    const nextId = (maxIdResult[0].maxId || 0) + 1;
    await connection.query(`ALTER TABLE users AUTO_INCREMENT = ${nextId}`);
    */

    await connection.commit();
    res.status(200).json({ message: 'Recruiter deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting recruiter:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// ================== SEARCH RECRUITERS ==================
router.get("/admin/recruiters/search", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { query, status } = req.query;
    const pool = getMySQLPool();
    
    let sqlQuery = `
      SELECT 
        r.recruiter_id,
        r.user_id,
        u.name,
        u.email,
        u.created_at as registered,
        r.company_name as company,
        r.industry_type,
        r.website,
        r.contact_number,
        r.recruiter_name,
        r.designation,
        r.isVerified,
        CASE 
          WHEN r.isVerified = 1 THEN 'approved'
          WHEN r.isVerified = 0 THEN 'pending'
          WHEN r.isVerified = -1 THEN 'rejected'
          ELSE 'pending'
        END as status
      FROM recruiters r
      INNER JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    // Add search filter
    if (query) {
      sqlQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR r.company_name LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add status filter
    if (status) {
      if (status === 'pending') {
        sqlQuery += ` AND r.isVerified = 0`;
      } else if (status === 'approved') {
        sqlQuery += ` AND r.isVerified = 1`;
      } else if (status === 'rejected') {
        sqlQuery += ` AND r.isVerified = -1`;
      }
    }

    sqlQuery += ` ORDER BY u.created_at DESC`;

    const [recruiters] = await pool.query(sqlQuery, params);
    res.status(200).json(recruiters);
  } catch (error) {
    console.error('Error searching recruiters:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});



export default router;
