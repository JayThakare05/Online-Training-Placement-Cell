import express from "express";
import multer from "multer";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// ================== UPLOAD PHOTO ==================
router.post("/upload-photo", authenticateToken, upload.single("photo"), async (req, res) => {
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

// ================== GET PROFILE PHOTO ==================
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

export default router;