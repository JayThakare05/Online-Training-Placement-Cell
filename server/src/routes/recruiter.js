import express from "express";
import multer from "multer";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Recruiter middleware
const requireRecruiter = (req, res, next) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ message: 'Unauthorized. Recruiter access required.' });
  }
  next();
};

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
export default router;