import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer"; // for file uploads
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import JobPost from '../models/JobPost.js';
// ------------------------------------------------------------------
function excelDateToSQL(serial) {
  if (!serial) return null;
  // Excel epoch = 1900-01-00; JS epoch = 1970-01-01
  const epoch = new Date(1900, 0, serial - 1);
  return epoch.toISOString().slice(0, 10);   // → 'YYYY-MM-DD'
}

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
      const {
        dob,
        gender,
        contact,
        address,
        roll_no,
        college,
        department,
        year_of_study,
        cgpa,
        marks_10,
        marks_12,
        backlogs,
        skills,
        certifications,
        projects,
        resume_url,
        job_roles,
        job_locations,
        placement_status,
        isPlaced
      } = req.body;
      
      await pool.query(
        `INSERT INTO students 
        (user_id, dob, gender, contact, address, roll_no, college, department, year_of_study,
          cgpa, marks_10, marks_12, backlogs, skills, certifications, projects, resume_url,
          job_roles, job_locations, placement_status, profile_photo, isPlaced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          dob || null,
          gender || null,
          contact || null,
          address || null,
          roll_no || null,
          college || null,
          department || null,
          year_of_study || null,
          cgpa || null,
          marks_10 || null,
          marks_12 || null,
          backlogs || 0,
          skills || null,
          certifications || null,
          projects || null,
          resume_url || null,
          job_roles || null,
          job_locations || null,
          placement_status || null,
          photo,
          isPlaced ? 1 : 0
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
router.post("/upload-photo",authenticateToken, upload.single("photo"), async (req, res) => {
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

// Add this GET profile route to your authRoutes.js

// ================== GET PROFILE ==================
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'student') {
      // Get user info and student profile data
      const [rows] = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          s.dob,
          s.gender,
          s.contact,
          s.address,
          s.roll_no,
          s.college,
          s.department,
          s.year_of_study,
          s.cgpa,
          s.marks_10,
          s.marks_12,
          s.backlogs,
          s.skills,
          s.certifications,
          s.projects,
          s.resume_url,
          s.job_roles,
          s.job_locations,
          s.placement_status,
          CASE WHEN s.profile_photo IS NOT NULL THEN 1 ELSE 0 END as profile_photo
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.id = ?
      `, [userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const profile = rows[0];
      
      // Format date for HTML input (YYYY-MM-DD)
      if (profile.dob) {
        const date = new Date(profile.dob);
        profile.dob = date.toISOString().split('T')[0];
      }

      // Ensure all fields have default values
      const formattedProfile = {
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        contact: profile.contact || '',
        address: profile.address || '',
        roll_no: profile.roll_no || '',
        college: profile.college || '',
        department: profile.department || '',
        year_of_study: profile.year_of_study || '',
        cgpa: profile.cgpa || '',
        marks_10: profile.marks_10 || '',
        marks_12: profile.marks_12 || '',
        backlogs: profile.backlogs || 0,
        skills: profile.skills || '',
        certifications: profile.certifications || '',
        projects: profile.projects || '',
        resume_url: profile.resume_url || '',
        job_roles: profile.job_roles || '',
        job_locations: profile.job_locations || '',
        placement_status: profile.placement_status || '',
        profile_photo: profile.profile_photo
      };

      res.json(formattedProfile);
    }
    else if (role === 'admin') {
      // Handle admin profile fetching
      const [rows] = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          a.designation,
          a.contact_number,
          a.official_email,
          a.access_role,
          CASE WHEN a.profile_photo IS NOT NULL THEN 1 ELSE 0 END as profile_photo
        FROM users u
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.id = ?
      `, [userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const profile = rows[0];
      const formattedProfile = {
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        designation: profile.designation || '',
        contact_number: profile.contact_number || '',
        official_email: profile.official_email || '',
        access_role: profile.access_role || 'coordinator',
        profile_photo: profile.profile_photo
      };

      res.json(formattedProfile);
    }
    else {
      // For other roles, just return basic user info
      const [rows] = await pool.query(
        "SELECT id, name, email FROM users WHERE id = ?",
        [userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(rows[0]);
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== UPDATE PROFILE ==================
router.put("/profile", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    const role = req.user.role;
    
    if (role === 'student') {
      const {
        name, email, dob, gender, contact, address, roll_no, college,
        department, year_of_study, cgpa, marks_10, marks_12, backlogs,
        skills, certifications, projects, resume_url, job_roles,
        job_locations, placement_status
      } = req.body;

      // Convert empty strings to null for numeric fields
      const numericCgpa = cgpa === '' ? null : parseFloat(cgpa);
      const numericMarks10 = marks_10 === '' ? null : parseFloat(marks_10);
      const numericMarks12 = marks_12 === '' ? null : parseFloat(marks_12);
      const numericBacklogs = backlogs === '' ? 0 : parseInt(backlogs);

      // Convert empty date to null
      const formattedDob = dob === '' ? null : dob;

      // Update users table
      await pool.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, userId]
      );

      // Update or insert into students table
      await pool.query(`
        INSERT INTO students (user_id, dob, gender, contact, address, roll_no, college, 
        department, year_of_study, cgpa, marks_10, marks_12, backlogs, skills, 
        certifications, projects, resume_url, job_roles, job_locations, placement_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        dob = VALUES(dob), gender = VALUES(gender), contact = VALUES(contact),
        address = VALUES(address), roll_no = VALUES(roll_no), college = VALUES(college),
        department = VALUES(department), year_of_study = VALUES(year_of_study),
        cgpa = VALUES(cgpa), marks_10 = VALUES(marks_10), marks_12 = VALUES(marks_12),
        backlogs = VALUES(backlogs), skills = VALUES(skills), certifications = VALUES(certifications),
        projects = VALUES(projects), resume_url = VALUES(resume_url), job_roles = VALUES(job_roles),
        job_locations = VALUES(job_locations), placement_status = VALUES(placement_status)
      `, [userId, formattedDob, gender, contact, address, roll_no, college, department, 
          year_of_study, numericCgpa, numericMarks10, numericMarks12, numericBacklogs, skills, 
          certifications, projects, resume_url, job_roles, job_locations, placement_status]);

      // Handle photo upload if present
      if (req.file) {
        await pool.query(
          "UPDATE students SET profile_photo = ? WHERE user_id = ?",
          [req.file.buffer, userId]
        );
      }

      res.json({ message: "Profile updated successfully" });
    }
    // Handle other roles (admin/recruiter) similarly
    else {
      res.status(400).json({ message: "Profile update not implemented for this role" });
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== GET PHOTO ==================
router.get("/profile/photo/:userId", async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.params.userId;

    // Find user role first
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let table;
    if (userRows[0].role === "student") table = "students";
    else if (userRows[0].role === "recruiter") table = "recruiters";
    else table = "admins";

    const [rows] = await pool.query(
      `SELECT profile_photo FROM ${table} WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0 || !rows[0].profile_photo) {
      return res.status(404).json({ message: "No photo found" });
    }

    res.set("Content-Type", "image/jpeg");
    res.send(rows[0].profile_photo);
  } catch (err) {
    console.error('Error fetching photo:', err);
    res.status(500).json({ message: "Server error" });
  }
});
// Add this to your authRoutes.js
// ================== UPDATE PROFILE ==================
router.put("/profile", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    const role = req.user.role;
    
    if (role === 'student') {
      const {
        name, email, dob, gender, contact, address, roll_no, college,
        department, year_of_study, cgpa, marks_10, marks_12, backlogs,
        skills, certifications, projects, resume_url, job_roles,
        job_locations, placement_status
      } = req.body;

      // Helper function to format date for MySQL DATE column
      const formatDateForDB = (dateString) => {
        if (!dateString || dateString === '') return null;
        
        try {
          // Handle various date formats
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;
          
          // Return YYYY-MM-DD format for MySQL DATE column
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date:', error);
          return null;
        }
      };

      // Convert empty strings to null for numeric fields
      const numericCgpa = cgpa === '' ? null : parseFloat(cgpa);
      const numericMarks10 = marks_10 === '' ? null : parseFloat(marks_10);
      const numericMarks12 = marks_12 === '' ? null : parseFloat(marks_12);
      const numericBacklogs = backlogs === '' ? 0 : parseInt(backlogs);

      // Format date properly
      const formattedDob = formatDateForDB(dob);

      // Update users table
      await pool.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, userId]
      );

      // Update or insert into students table
      await pool.query(`
        INSERT INTO students (user_id, dob, gender, contact, address, roll_no, college, 
        department, year_of_study, cgpa, marks_10, marks_12, backlogs, skills, 
        certifications, projects, resume_url, job_roles, job_locations, placement_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        dob = VALUES(dob), gender = VALUES(gender), contact = VALUES(contact),
        address = VALUES(address), roll_no = VALUES(roll_no), college = VALUES(college),
        department = VALUES(department), year_of_study = VALUES(year_of_study),
        cgpa = VALUES(cgpa), marks_10 = VALUES(marks_10), marks_12 = VALUES(marks_12),
        backlogs = VALUES(backlogs), skills = VALUES(skills), certifications = VALUES(certifications),
        projects = VALUES(projects), resume_url = VALUES(resume_url), job_roles = VALUES(job_roles),
        job_locations = VALUES(job_locations), placement_status = VALUES(placement_status)
      `, [userId, formattedDob, gender, contact, address, roll_no, college, department, 
          year_of_study, numericCgpa, numericMarks10, numericMarks12, numericBacklogs, skills, 
          certifications, projects, resume_url, job_roles, job_locations, placement_status]);

      // Handle photo upload if present
      if (req.file) {
        await pool.query(
          "UPDATE students SET profile_photo = ? WHERE user_id = ?",
          [req.file.buffer, userId]
        );
      }

      res.json({ message: "Profile updated successfully" });
    }
    // Handle other roles (admin/recruiter) similarly
    else if (role === 'admin') {
      // Add admin profile update logic here if needed
      const { name, email, designation, contact_number, official_email, access_role } = req.body;
      
      // Update users table
      await pool.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, userId]
      );

      // Update or insert into admins table
      await pool.query(`
        INSERT INTO admins (user_id, designation, contact_number, official_email, access_role)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        designation = VALUES(designation), 
        contact_number = VALUES(contact_number), 
        official_email = VALUES(official_email), 
        access_role = VALUES(access_role)
      `, [userId, designation || null, contact_number || null, official_email || null, access_role || 'coordinator']);

      // Handle photo upload if present
      if (req.file) {
        await pool.query(
          "UPDATE admins SET profile_photo = ? WHERE user_id = ?",
          [req.file.buffer, userId]
        );
      }

      res.json({ message: "Admin profile updated successfully" });
    }
    else {
      res.status(400).json({ message: "Profile update not implemented for this role" });
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: "Server error" });
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


// ================== GET ALL STUDENTS (ADMIN ONLY) ==================
router.get("/admin/students", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const pool = getMySQLPool();

    const [students] = await pool.query(`
      SELECT 
        s.student_id,
        s.user_id,
        u.name,
        u.email,
        u.created_at as registered,
        s.dob,
        s.gender,
        s.contact,
        s.address,
        s.roll_no,
        s.college,
        s.department,
        s.year_of_study,
        s.cgpa,
        s.marks_10,
        s.marks_12,
        s.backlogs,
        s.skills,
        s.certifications,
        s.projects,
        s.resume_url,
        s.job_roles,
        s.job_locations,
        s.placement_status,
        s.isPlaced
      FROM students s
      INNER JOIN users u ON s.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
// ================== UPDATE STUDENT (ADMIN ONLY) ==================
router.put("/admin/students/:studentId", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { studentId } = req.params;
    const {
      name,
      email,
      dob,
      gender,
      contact,
      address,
      roll_no,
      college,
      department,
      year_of_study,
      cgpa,
      marks_10,
      marks_12,
      backlogs,
      skills,
      certifications,
      projects,
      resume_url,
      job_roles,
      job_locations,
      placement_status,
      profile_photo,
      isPlaced,
    } = req.body;

    const pool = getMySQLPool();

    // ✅ Update users table first
    if (name || email) {
      await pool.query(
        `UPDATE users 
         SET name = COALESCE(?, name), 
             email = COALESCE(?, email)
         WHERE id = (SELECT user_id FROM students WHERE student_id = ?)`,
        [name, email, studentId]
      );
    }

    // ✅ Convert base64 photo (if provided) into buffer
    let profilePhotoBuffer = null;
    if (profile_photo && profile_photo.startsWith("data:image")) {
      const base64Data = profile_photo.split(",")[1]; // remove data:image/jpeg;base64,
      profilePhotoBuffer = Buffer.from(base64Data, "base64");
    }

    // ✅ Update students table
    await pool.query(
      `UPDATE students 
       SET dob = COALESCE(?, dob),
           gender = COALESCE(?, gender),
           contact = COALESCE(?, contact),
           address = COALESCE(?, address),
           roll_no = COALESCE(?, roll_no),
           college = COALESCE(?, college),
           department = COALESCE(?, department),
           year_of_study = COALESCE(?, year_of_study),
           cgpa = COALESCE(?, cgpa),
           marks_10 = COALESCE(?, marks_10),
           marks_12 = COALESCE(?, marks_12),
           backlogs = COALESCE(?, backlogs),
           skills = COALESCE(?, skills),
           certifications = COALESCE(?, certifications),
           projects = COALESCE(?, projects),
           resume_url = COALESCE(?, resume_url),
           job_roles = COALESCE(?, job_roles),
           job_locations = COALESCE(?, job_locations),
           placement_status = COALESCE(?, placement_status),
           profile_photo = COALESCE(?, profile_photo),
           isPlaced = COALESCE(?, isPlaced)
       WHERE student_id = ?`,
      [
        dob || null,
        gender,
        contact,
        address,
        roll_no,
        college,
        department,
        year_of_study,
        cgpa,
        marks_10,
        marks_12,
        backlogs,
        skills,
        certifications,
        projects,
        resume_url,
        job_roles,
        job_locations,
        placement_status,
        profilePhotoBuffer, // ✅ binary image buffer
        isPlaced !== undefined ? isPlaced : null,
        studentId,
      ]
    );

    res.json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


// ================== DELETE STUDENT (ADMIN ONLY) ==================
router.delete("/admin/students/:studentId", authenticateToken, async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { studentId } = req.params;

    await connection.beginTransaction();

    // 🔹 Get user_id for this student
    const [rows] = await connection.query(
      "SELECT user_id FROM students WHERE student_id = ?",
      [studentId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = rows[0].user_id;

    // 🔹 Delete from students (first, due to FK)
    await connection.query("DELETE FROM students WHERE student_id = ?", [studentId]);

    // 🔹 Delete from users
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);

    await connection.commit();
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  } finally {
    connection.release();
  }
});

// Add these endpoints to your existing authRoutes.js file

// ================== BULK STUDENT REGISTRATION ==================
router.post("/admin/students/bulk-register", authenticateToken, upload.none(), async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const studentsData = req.body.students; // Array of student objects
    
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ message: 'Invalid students data. Expected array of student objects.' });
    }

    await connection.beginTransaction();

    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];
      
      try {
        // Validate required fields
        if (!studentData.name || !studentData.email || !studentData.password) {
          results.errors.push({
            row: i + 1,
            data: studentData,
            error: "Missing required fields (name, email, password)"
          });
          continue;
        }

        // Check if email already exists
        const [existingUser] = await connection.query(
          "SELECT * FROM users WHERE email = ?", 
          [studentData.email]
        );
        
        if (existingUser.length > 0) {
          results.errors.push({
            row: i + 1,
            data: studentData,
            error: "Email already registered"
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(studentData.password, 10);

        // Insert into users table
        const [userResult] = await connection.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          [studentData.name, studentData.email, hashedPassword, 'student']
        );

        const userId = userResult.insertId;
        // Prepare student data with defaults
        const studentFields = {
          user_id: userId,
          dob: excelDateToSQL(studentData.dob),
          gender: studentData.gender || null,
          contact: studentData.contact || null,
          address: studentData.address || null,
          roll_no: studentData.roll_no || null,
          college: studentData.college || null,
          department: studentData.department || null,
          year_of_study: studentData.year_of_study || null,
          cgpa: studentData.cgpa ? parseFloat(studentData.cgpa) : null,
          marks_10: studentData.marks_10 ? parseFloat(studentData.marks_10) : null,
          marks_12: studentData.marks_12 ? parseFloat(studentData.marks_12) : null,
          backlogs: studentData.backlogs ? parseInt(studentData.backlogs) : 0,
          skills: studentData.skills || null,
          certifications: studentData.certifications || null,
          projects: studentData.projects || null,
          resume_url: studentData.resume_url || null,
          job_roles: studentData.job_roles || null,
          job_locations: studentData.job_locations || null,
          placement_status: studentData.placement_status || null,
          isPlaced: studentData.isPlaced === 'true' || studentData.isPlaced === '1' || studentData.isPlaced === 1 ? 1 : 0
        };

        // Insert into students table
        await connection.query(
          `INSERT INTO students 
           (user_id, dob, gender, contact, address, roll_no, college, department, 
            year_of_study, cgpa, marks_10, marks_12, backlogs, skills, 
            certifications, projects, resume_url, job_roles, job_locations, 
            placement_status, isPlaced) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            studentFields.user_id,
            studentFields.dob,
            studentFields.gender,
            studentFields.contact,
            studentFields.address,
            studentFields.roll_no,
            studentFields.college,
            studentFields.department,
            studentFields.year_of_study,
            studentFields.cgpa,
            studentFields.marks_10,
            studentFields.marks_12,
            studentFields.backlogs,
            studentFields.skills,
            studentFields.certifications,
            studentFields.projects,
            studentFields.resume_url,
            studentFields.job_roles,
            studentFields.job_locations,
            studentFields.placement_status,
            studentFields.isPlaced
          ]
        );

        results.success.push({
          row: i + 1,
          name: studentData.name,
          email: studentData.email,
          user_id: userId
        });

      } catch (error) {
        console.error(`Error processing student ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          data: studentData,
          error: error.message || "Unknown error occurred"
        });
      }
    }

    await connection.commit();

    res.status(200).json({
      message: "Bulk registration completed",
      results: results,
      summary: {
        total: studentsData.length,
        successful: results.success.length,
        failed: results.errors.length
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Bulk registration error:", error);
    res.status(500).json({ message: "Internal server error during bulk registration" });
  } finally {
    connection.release();
  }
});

// ================== GET ALL STUDENTS (ADMIN) ==================
router.get("/admin/students", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const [students] = await getMySQLPool().query(`
      SELECT 
        s.*,
        u.name,
        u.email,
        u.registered,
        s.user_id as student_id
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      ORDER BY u.registered DESC
    `);

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ================== UPDATE STUDENT (ADMIN) ==================
router.put("/admin/students/:id", authenticateToken, async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const studentId = req.params.id;
    const updateData = req.body;

    await connection.beginTransaction();

    // Update users table if needed
    if (updateData.name || updateData.email) {
      const userUpdateFields = [];
      const userUpdateValues = [];

      if (updateData.name) {
        userUpdateFields.push('name = ?');
        userUpdateValues.push(updateData.name);
      }

      if (updateData.email) {
        // Check if email already exists for another user
        const [existingUser] = await connection.query(
          "SELECT user_id FROM users WHERE email = ? AND user_id != ?", 
          [updateData.email, studentId]
        );
        
        if (existingUser.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }

        userUpdateFields.push('email = ?');
        userUpdateValues.push(updateData.email);
      }

      if (userUpdateFields.length > 0) {
        userUpdateValues.push(studentId);
        await connection.query(
          `UPDATE users SET ${userUpdateFields.join(', ')} WHERE user_id = ?`,
          userUpdateValues
        );
      }
    }

    // Update students table
    const studentFields = [];
    const studentValues = [];

    const fieldsMap = {
      dob: 'dob',
      gender: 'gender',
      contact: 'contact',
      address: 'address',
      roll_no: 'roll_no',
      college: 'college',
      department: 'department',
      year_of_study: 'year_of_study',
      cgpa: 'cgpa',
      marks_10: 'marks_10',
      marks_12: 'marks_12',
      backlogs: 'backlogs',
      skills: 'skills',
      certifications: 'certifications',
      projects: 'projects',
      resume_url: 'resume_url',
      job_roles: 'job_roles',
      job_locations: 'job_locations',
      placement_status: 'placement_status',
      isPlaced: 'isPlaced'
    };

    Object.keys(fieldsMap).forEach(key => {
      if (updateData.hasOwnProperty(key)) {
        studentFields.push(`${fieldsMap[key]} = ?`);
        
        let value = updateData[key];
        
        // Handle specific field types
        if (key === 'cgpa' || key === 'marks_10' || key === 'marks_12') {
          value = value ? parseFloat(value) : null;
        } else if (key === 'backlogs') {
          value = value ? parseInt(value) : 0;
        } else if (key === 'isPlaced') {
          value = value === 'Yes' || value === '1' || value === 1 ? 1 : 0;
        } else if (key === 'dob' && value) {
          // Ensure proper date format
          value = new Date(value).toISOString().split('T')[0];
        }
        
        studentValues.push(value);
      }
    });

    // Handle profile photo separately if it's a base64 string
    if (updateData.profile_photo) {
      studentFields.push('profile_photo = ?');
      
      let photoData = updateData.profile_photo;
      if (photoData.startsWith('data:image')) {
        // Extract base64 data
        photoData = photoData.split(',')[1];
      }
      
      studentValues.push(photoData);
    }

    if (studentFields.length > 0) {
      studentValues.push(studentId);
      await connection.query(
        `UPDATE students SET ${studentFields.join(', ')} WHERE user_id = ?`,
        studentValues
      );
    }

    await connection.commit();
    res.json({ message: "Student updated successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

// ================== DELETE STUDENT (ADMIN) ==================
router.delete("/admin/students/:id", authenticateToken, async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const studentId = req.params.id;

    await connection.beginTransaction();

    // Delete from students table first (foreign key constraint)
    await connection.query("DELETE FROM students WHERE user_id = ?", [studentId]);
    
    // Delete from users table
    await connection.query("DELETE FROM users WHERE user_id = ?", [studentId]);

    await connection.commit();
    res.json({ message: "Student deleted successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});

// ================== ENHANCED REGISTER ENDPOINT FOR SINGLE STUDENTS ==================
// Update your existing register endpoint to handle student-specific fields
router.post("/register", upload.single('photo'), async (req, res) => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    const { 
      name, 
      email, 
      password, 
      role = 'student',
      // Student-specific fields
      dob,
      gender,
      contact,
      address,
      roll_no,
      college,
      department,
      year_of_study,
      cgpa,
      marks_10,
      marks_12,
      backlogs,
      skills,
      certifications,
      projects,
      resume_url,
      job_roles,
      job_locations,
      placement_status,
      isPlaced
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    await connection.beginTransaction();

    // Check if email already exists
    const [existingUser] = await connection.query(
      "SELECT * FROM users WHERE email = ?", 
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    const userId = userResult.insertId;

    // If registering a student, add to students table
    if (role === 'student') {
      // Handle photo upload
      let profilePhoto = null;
      if (req.file) {
        profilePhoto = req.file.buffer.toString('base64');
      }

      await connection.query(
        `INSERT INTO students 
         (user_id, dob, gender, contact, address, roll_no, college, department, 
          year_of_study, cgpa, marks_10, marks_12, backlogs, skills, 
          certifications, projects, resume_url, job_roles, job_locations, 
          placement_status, isPlaced, profile_photo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          dob || null,
          gender || null,
          contact || null,
          address || null,
          roll_no || null,
          college || null,
          department || null,
          year_of_study || null,
          cgpa ? parseFloat(cgpa) : null,
          marks_10 ? parseFloat(marks_10) : null,
          marks_12 ? parseFloat(marks_12) : null,
          backlogs ? parseInt(backlogs) : 0,
          skills || null,
          certifications || null,
          projects || null,
          resume_url || null,
          job_roles || null,
          job_locations || null,
          placement_status || null,
          isPlaced === '1' || isPlaced === 1 ? 1 : 0,
          profilePhoto
        ]
      );
    }

    await connection.commit();

    // Generate JWT token
    const token = jwt.sign(
      { user_id: userId, email: email, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Registration successful",
      token: token,
      user: {
        user_id: userId,
        name: name,
        email: email,
        role: role
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
});
// Add these routes to your existing authRoute.js file

// ================== GET RECRUITER PROFILE ==================
router.get("/recruiter-profile", authenticateToken, async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'recruiter') {
      return res.status(403).json({ message: "Access denied. Recruiters only." });
    }

    // Get user info and recruiter profile data
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        r.company_name,
        r.industry_type,
        r.website,
        r.contact_number,
        r.recruiter_name,
        r.designation,
        r.job_title,
        r.job_description,
        r.required_skills,
        r.eligibility,
        r.salary_package,
        r.job_location,
        r.isVerified,
        CASE WHEN r.profile_photo IS NOT NULL THEN 1 ELSE 0 END as profile_photo,
        r.recruiter_id
      FROM users u
      LEFT JOIN recruiters r ON u.id = r.user_id
      WHERE u.id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = rows[0];
    
    console.log('Fetched profile data:', profile); // Debug log
    
    // Ensure all fields have default values
    const formattedProfile = {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      company_name: profile.company_name || '',
      industry_type: profile.industry_type || '',
      website: profile.website || '',
      contact_number: profile.contact_number || '',
      recruiter_name: profile.recruiter_name || '',
      designation: profile.designation || '',
      job_title: profile.job_title || '',
      job_description: profile.job_description || '',
      required_skills: profile.required_skills || '',
      eligibility: profile.eligibility || '',
      salary_package: profile.salary_package || '',
      job_location: profile.job_location || '',
      isVerified: profile.isVerified || 0,
      profile_photo: profile.profile_photo,
      recruiter_id: profile.recruiter_id
    };

    res.json(formattedProfile);
  } catch (err) {
    console.error('Error fetching recruiter profile:', err);
    res.status(500).json({ message: "Server error" });
  }
});
 
// ================== UPDATE RECRUITER PROFILE ==================
router.put("/recruiter-profile", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    const role = req.user.role;
    
    if (role !== 'recruiter') {
      return res.status(403).json({ message: "Access denied. Recruiters only." });
    }

    const {
      name, email, company_name, industry_type, website, contact_number,
      recruiter_name, designation, job_title, job_description, required_skills,
      eligibility, salary_package, job_location
    } = req.body;

    console.log('Updating recruiter profile for user:', userId);
    console.log('Received data:', req.body);

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // Update users table
      await pool.query(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, userId]
      );

      // Check if recruiter record exists
      const [existingRecord] = await pool.query(
        "SELECT recruiter_id FROM recruiters WHERE user_id = ?",
        [userId]
      );

      if (existingRecord.length > 0) {
        // Update existing record
        await pool.query(`
          UPDATE recruiters SET
            company_name = ?,
            industry_type = ?,
            website = ?,
            contact_number = ?,
            recruiter_name = ?,
            designation = ?,
            job_title = ?,
            job_description = ?,
            required_skills = ?,
            eligibility = ?,
            salary_package = ?,
            job_location = ?
          WHERE user_id = ?
        `, [
          company_name || null, industry_type || null, website || null,
          contact_number || null, recruiter_name || null, designation || null,
          job_title || null, job_description || null, required_skills || null,
          eligibility || null, salary_package || null, job_location || null,
          userId
        ]);
      } else {
        // Insert new record
        await pool.query(`
          INSERT INTO recruiters (
            user_id, company_name, industry_type, website, contact_number,
            recruiter_name, designation, job_title, job_description, required_skills,
            eligibility, salary_package, job_location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, company_name || null, industry_type || null, website || null,
          contact_number || null, recruiter_name || null, designation || null,
          job_title || null, job_description || null, required_skills || null,
          eligibility || null, salary_package || null, job_location || null
        ]);
      }

      // Handle photo upload if present
      if (req.file) {
        await pool.query(
          "UPDATE recruiters SET profile_photo = ? WHERE user_id = ?",
          [req.file.buffer, userId]
        );
      }

      // Commit transaction
      await pool.query('COMMIT');

      // Verify the update by fetching the record
      const [verifyResult] = await pool.query(
        "SELECT company_name, recruiter_name FROM recruiters WHERE user_id = ?",
        [userId]
      );
      
      console.log('Updated recruiter data:', verifyResult[0]);

      res.json({ 
        message: "Recruiter profile updated successfully",
        updated: true
      });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error('Error updating recruiter profile:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================== GET RECRUITER PHOTO ==================
router.get("/recruiter-photo/:userId", async (req, res) => {
  try {
    const pool = getMySQLPool();
    const userId = req.params.userId;

    // Check if user is a recruiter
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userRows[0].role !== 'recruiter') {
      return res.status(404).json({ message: "User is not a recruiter" });
    }

    const [rows] = await pool.query(
      "SELECT profile_photo FROM recruiters WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0 || !rows[0].profile_photo) {
      return res.status(404).json({ message: "No photo found" });
    }

    res.set("Content-Type", "image/jpeg");
    res.send(rows[0].profile_photo);
  } catch (err) {
    console.error('Error fetching recruiter photo:', err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== RECRUITER DASHBOARD STATS ==================
router.get("/recruiter/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Unauthorized. Recruiter access required.' });
    }

    const pool = getMySQLPool();
    const userId = req.user.id;

    // Check if recruiter is verified
    const [recruiterStatus] = await pool.query(
      "SELECT isVerified FROM recruiters WHERE user_id = ?",
      [userId]
    );

    if (recruiterStatus.length === 0) {
      return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    const isVerified = recruiterStatus[0].isVerified;

    // Get basic stats
    const [totalStudentsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM students"
    );

    // If you have a job_postings table, you can get job-related stats
    // For now, we'll return basic information
    const stats = {
      isVerified: isVerified === 1,
      verificationStatus: isVerified === 1 ? 'approved' : (isVerified === -1 ? 'rejected' : 'pending'),
      totalStudents: totalStudentsResult[0].count,
      // Add more stats as needed when you implement job postings
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching recruiter dashboard stats:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ================== CHECK VERIFICATION STATUS ==================
router.get("/recruiter/verification-status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Unauthorized. Recruiter access required.' });
    }

    const pool = getMySQLPool();
    const userId = req.user.id;

    const [result] = await pool.query(
      "SELECT isVerified, company_name FROM recruiters WHERE user_id = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Recruiter profile not found' });
    }

    const { isVerified, company_name } = result[0];

    res.json({
      isVerified: isVerified === 1,
      status: isVerified === 1 ? 'approved' : (isVerified === -1 ? 'rejected' : 'pending'),
      message: isVerified === 1 
        ? 'Your account has been verified and approved.' 
        : isVerified === -1 
          ? 'Your account verification has been rejected. Please contact support.'
          : 'Your account is pending verification.',
      company_name
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create job post
router.post('/create', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can post jobs' });
    }

    const pool = getMySQLPool();
    
    // Verify recruiter is approved
    const [recruiterStatus] = await pool.query(
      'SELECT isVerified, company_name, recruiter_name FROM recruiters WHERE user_id = ?',
      [req.user.id]
    );

    if (!recruiterStatus.length || recruiterStatus[0].isVerified !== 1) {
      return res.status(403).json({ 
        message: 'Your recruiter account must be verified to post jobs' 
      });
    }

    // Create job post with recruiter verification status
    const jobPostData = {
      ...req.body,
      isVerifiedRecruiter: true
    };

    const jobPost = new JobPost(jobPostData);
    await jobPost.save();

    res.status(201).json({
      message: 'Job posted successfully',
      jobId: jobPost._id,
      slug: jobPost.slug
    });
  } catch (error) {
    console.error('Error creating job post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all job posts (with pagination and filters)
router.get('/posts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      location, 
      type, 
      company,
      verified_only = false 
    } = req.query;

    const query = { status: 'active' };
    
    // Add filters
    if (search) {
      query.$text = { $search: search };
    }
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (type) {
      query.type = type;
    }
    if (company) {
      query['recruiter.company_name'] = new RegExp(company, 'i');
    }
    if (verified_only === 'true') {
      query.isVerifiedRecruiter = true;
    }

    const jobs = await JobPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-applications.applied_users') // Exclude sensitive application data
      .exec();

    const total = await JobPost.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_jobs: total,
        has_more: page * limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike a job post
router.post('/posts/:jobId/like', authenticateToken, async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    const existingLike = jobPost.likes.users.find(
      like => like.user_id === req.user.id
    );

    if (existingLike) {
      // Unlike
      jobPost.likes.users = jobPost.likes.users.filter(
        like => like.user_id !== req.user.id
      );
      jobPost.likes.count = Math.max(0, jobPost.likes.count - 1);
    } else {
      // Like
      jobPost.likes.users.push({
        user_id: req.user.id,
        user_name: req.user.name,
        user_role: req.user.role
      });
      jobPost.likes.count += 1;
    }

    await jobPost.save();

    res.json({
      liked: !existingLike,
      likes_count: jobPost.likes.count
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to job post
router.post('/posts/:jobId/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    const newComment = {
      user: {
        user_id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      content: content.trim()
    };

    jobPost.comments.push(newComment);
    await jobPost.save();

    // Return the newly added comment
    const addedComment = jobPost.comments[jobPost.comments.length - 1];
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply to job
router.post('/posts/:jobId/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply to jobs' });
    }

    const jobPost = await JobPost.findById(req.params.jobId);
    if (!jobPost || jobPost.status !== 'active') {
      return res.status(404).json({ message: 'Job post not found or inactive' });
    }

    // Check if already applied
    const existingApplication = jobPost.applications.applied_users.find(
      app => app.user_id === req.user.id
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Add application
    jobPost.applications.applied_users.push({
      user_id: req.user.id,
      student_name: req.user.name,
      status: 'applied'
    });
    jobPost.applications.count += 1;

    await jobPost.save();

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
