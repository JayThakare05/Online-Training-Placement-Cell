import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage (not disk storage)
const storage = multer.memoryStorage(); // Store in memory as Buffer

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage, // Use memory storage
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * GET profile (role-based)
 */
router.get("/", authenticateToken, async (req, res) => {
  const pool = getMySQLPool();

  try {
    // 1. Get basic user details
    const [users] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    const user = users[0];
    let roleData = {};

    // 2. Fetch role-specific details (exclude profile_photo from general response)
    if (user.role === "student") {
      const [rows] = await pool.query(
        "SELECT dob, gender, contact, address, roll_no, college, department, year_of_study, cgpa, marks_10, marks_12, backlogs, skills, certifications, projects, resume_url, job_roles, job_locations, placement_status FROM students WHERE user_id = ?", 
        [user.id]
      );
      roleData = rows[0] || {};
    } else if (user.role === "recruiter") {
      const [rows] = await pool.query(
        "SELECT company_name, industry_type, website, contact_number, recruiter_name, designation, job_title, job_description, required_skills, eligibility, salary_package, job_location FROM recruiters WHERE user_id = ?", 
        [user.id]
      );
      roleData = rows[0] || {};
    } else if (user.role === "admin") {
      const [rows] = await pool.query(
        "SELECT designation, contact_number, official_email, college_id_proof, access_role FROM admins WHERE user_id = ?", 
        [user.id]
      );
      roleData = rows[0] || {};
    }

    // Add hasPhoto flag instead of sending binary data
    const hasPhoto = await checkUserHasPhoto(pool, user.id, user.role);
    
    res.json({ 
      ...user, 
      ...roleData, 
      hasPhoto 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Helper function to check if user has photo
 */
async function checkUserHasPhoto(pool, userId, role) {
  try {
    let query = "";
    if (role === "student") {
      query = "SELECT profile_photo FROM students WHERE user_id = ? AND profile_photo IS NOT NULL";
    } else if (role === "recruiter") {
      query = "SELECT profile_photo FROM recruiters WHERE user_id = ? AND profile_photo IS NOT NULL";
    } else if (role === "admin") {
      query = "SELECT profile_photo FROM admins WHERE user_id = ? AND profile_photo IS NOT NULL";
    }
    
    const [rows] = await pool.query(query, [userId]);
    return rows.length > 0 && rows[0].profile_photo;
  } catch (error) {
    return false;
  }
}

/**
 * UPDATE profile (role-based) with photo upload as BLOB
 */
router.put("/", authenticateToken, upload.single('photo'), async (req, res) => {
  const pool = getMySQLPool();
  const { name, email, ...roleFields } = req.body;

  try {
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update user table
      await connection.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.user.id]);

      // 2. Get photo buffer if uploaded
      const photoBuffer = req.file ? req.file.buffer : null;

      // 3. Update role-specific table (including photo BLOB if uploaded)
      if (req.user.role === "student") {
        const updateQuery = photoBuffer 
          ? `UPDATE students SET dob=?, gender=?, contact=?, address=?, roll_no=?, college=?, department=?, year_of_study=?, cgpa=?, marks_10=?, marks_12=?, backlogs=?, skills=?, certifications=?, projects=?, resume_url=?, job_roles=?, job_locations=?, placement_status=?, profile_photo=? WHERE user_id=?`
          : `UPDATE students SET dob=?, gender=?, contact=?, address=?, roll_no=?, college=?, department=?, year_of_study=?, cgpa=?, marks_10=?, marks_12=?, backlogs=?, skills=?, certifications=?, projects=?, resume_url=?, job_roles=?, job_locations=?, placement_status=? WHERE user_id=?`;
        
        const updateParams = [
          roleFields.dob,
          roleFields.gender,
          roleFields.contact,
          roleFields.address,
          roleFields.roll_no,
          roleFields.college,
          roleFields.department,
          roleFields.year_of_study,
          roleFields.cgpa,
          roleFields.marks_10,
          roleFields.marks_12,
          roleFields.backlogs,
          roleFields.skills,
          roleFields.certifications,
          roleFields.projects,
          roleFields.resume_url,
          roleFields.job_roles,
          roleFields.job_locations,
          roleFields.placement_status
        ];
        
        if (photoBuffer) updateParams.push(photoBuffer);
        updateParams.push(req.user.id);
        
        await connection.query(updateQuery, updateParams);
      } else if (req.user.role === "recruiter") {
        const updateQuery = photoBuffer 
          ? `UPDATE recruiters SET company_name=?, industry_type=?, website=?, contact_number=?, recruiter_name=?, designation=?, job_title=?, job_description=?, required_skills=?, eligibility=?, salary_package=?, job_location=?, profile_photo=? WHERE user_id=?`
          : `UPDATE recruiters SET company_name=?, industry_type=?, website=?, contact_number=?, recruiter_name=?, designation=?, job_title=?, job_description=?, required_skills=?, eligibility=?, salary_package=?, job_location=? WHERE user_id=?`;
        
        const updateParams = [
          roleFields.company_name,
          roleFields.industry_type,
          roleFields.website,
          roleFields.contact_number,
          roleFields.recruiter_name,
          roleFields.designation,
          roleFields.job_title,
          roleFields.job_description,
          roleFields.required_skills,
          roleFields.eligibility,
          roleFields.salary_package,
          roleFields.job_location
        ];
        
        if (photoBuffer) updateParams.push(photoBuffer);
        updateParams.push(req.user.id);
        
        await connection.query(updateQuery, updateParams);
      } else if (req.user.role === "admin") {
        const updateQuery = photoBuffer 
          ? `UPDATE admins SET designation=?, contact_number=?, official_email=?, college_id_proof=?, access_role=?, profile_photo=? WHERE user_id=?`
          : `UPDATE admins SET designation=?, contact_number=?, official_email=?, college_id_proof=?, access_role=? WHERE user_id=?`;
        
        const updateParams = [
          roleFields.designation,
          roleFields.contact_number,
          roleFields.official_email,
          roleFields.college_id_proof,
          roleFields.access_role
        ];
        
        if (photoBuffer) updateParams.push(photoBuffer);
        updateParams.push(req.user.id);
        
        await connection.query(updateQuery, updateParams);
      }

      await connection.commit();
      res.json({ 
        message: "Profile updated successfully",
        photoUploaded: !!req.file
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET user photo as binary data
 */
router.get("/photo/:userId", async (req, res) => {
  const pool = getMySQLPool();
  
  try {
    // Get user role first
    const [users] = await pool.query("SELECT role FROM users WHERE id = ?", [req.params.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = users[0].role;
    let photoBuffer = null;

    // Get photo BLOB from role-specific table
    if (userRole === "student") {
      const [rows] = await pool.query("SELECT profile_photo FROM students WHERE user_id = ?", [req.params.userId]);
      photoBuffer = rows[0]?.profile_photo;
    } else if (userRole === "recruiter") {
      const [rows] = await pool.query("SELECT profile_photo FROM recruiters WHERE user_id = ?", [req.params.userId]);
      photoBuffer = rows[0]?.profile_photo;
    } else if (userRole === "admin") {
      const [rows] = await pool.query("SELECT profile_photo FROM admins WHERE user_id = ?", [req.params.userId]);
      photoBuffer = rows[0]?.profile_photo;
    }
    
    if (!photoBuffer) {
      return res.status(404).json({ message: "Photo not found" });
    }

    // Send the binary data as image
    res.set({
      'Content-Type': 'image/jpeg', // You might want to store and retrieve the actual mime type
      'Content-Length': photoBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    });
    
    res.send(photoBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE user photo
 */
router.delete("/photo", authenticateToken, async (req, res) => {
  const pool = getMySQLPool();
  
  try {
    // Get user role first
    const [users] = await pool.query("SELECT role FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = users[0].role;
    let updateQuery = "";

    // Prepare update query based on role to set photo to NULL
    if (userRole === "student") {
      updateQuery = "UPDATE students SET profile_photo = NULL WHERE user_id = ?";
    } else if (userRole === "recruiter") {
      updateQuery = "UPDATE recruiters SET profile_photo = NULL WHERE user_id = ?";
    } else if (userRole === "admin") {
      updateQuery = "UPDATE admins SET profile_photo = NULL WHERE user_id = ?";
    }

    // Update database to remove photo
    const [result] = await pool.query(updateQuery, [req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Photo not found" });
    }
    
    res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;