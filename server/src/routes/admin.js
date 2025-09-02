import express from "express";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { excelDateToSQL } from "../utils/helpers.js";
import { upload } from "../utils/upload.js"
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Content from '../models/Content.js';   // Mongoose model
import { v4 as uuidv4 } from 'uuid';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/content');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const uploadContent = multer({ storage });

const router = express.Router();

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
  }
  next();
};

// ================== ADMIN DASHBOARD STATS ==================
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


// ================== GET ALL RECRUITERS ==================

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

// ================== APPROVE/RECRUITER ==================
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

// ================== DELETE RECRUITER ==================
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

// ================== GET ALL STUDENTS ==================
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

// ================== UPDATE STUDENT ==================
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

// ================== DELETE STUDENT ==================
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

// ================== UPLOAD FILE ==================
router.post('/content/upload', authenticateToken, uploadContent.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });
    const fileUrl = `/uploads/content/${req.file.filename}`;
    res.json({ success: true, fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// ================== GET CONTENT (TREE OR LIST) ==================
router.get('/content/tree', authenticateToken, async (req, res) => {
  try {
    const { search, type } = req.query;
    const match = {};
    if (search) match.title = { $regex: search, $options: 'i' };
    if (type && type !== 'all') match.type = type;
    const tree = await buildTree(null, match);
    res.json({ success: true, data: tree });
  } catch (err) {
    console.error('Tree fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/content/list', authenticateToken, async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (type && type !== 'all') filter.type = type;
    const items = await Content.find(filter).populate('parent_id', 'title').sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('List fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== CREATE CONTENT ==================
router.post('/content', authenticateToken, async (req, res) => {
  try {
    const doc = new Content({ ...req.body, created_by: req.user.id });
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== UPDATE CONTENT ==================
router.put('/content/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== DELETE CONTENT ==================
router.delete('/content/:id', authenticateToken, async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: Recursively build tree
async function buildTree(parentId, match) {
  const children = await Content.find({ parent_id: parentId, ...match }).sort({ order: 1 });
  return Promise.all(
    children.map(async (child) => ({
      ...child.toObject(),
      children: child.type === 'folder' ? await buildTree(child._id, match) : []
    }))
  );
}

export default router;