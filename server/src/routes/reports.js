import express from "express";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ================== PLATFORM OVERVIEW REPORT ==================
router.get("/overview", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { startDate } = req.query;
    const pool = getMySQLPool();

    // Get total users
    const [totalUsersResult] = await pool.query(
      `SELECT COUNT(*) as count FROM users ${startDate ? 'WHERE created_at >= ?' : ''}`,
      startDate ? [startDate] : []
    );

    // Get new signups in the period
    const [newSignupsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= ?",
      [startDate]
    );

    // Get verified recruiters
    const [verifiedRecruitersResult] = await pool.query(
      `SELECT COUNT(*) as count FROM recruiters WHERE isVerified = 1 ${startDate ? 'AND EXISTS (SELECT 1 FROM users WHERE users.id = recruiters.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    // Get placement rate
    const [totalStudentsResult] = await pool.query(
      `SELECT COUNT(*) as total FROM students ${startDate ? 'WHERE EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    const [placedStudentsResult] = await pool.query(
      `SELECT COUNT(*) as placed FROM students WHERE isPlaced = 1 ${startDate ? 'AND EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    const placementRate = totalStudentsResult[0].total > 0 
      ? Math.round((placedStudentsResult[0].placed / totalStudentsResult[0].total) * 100)
      : 0;

    // Get top skills from recruiters' required_skills
    const [skillsResult] = await pool.query(`
      SELECT required_skills 
      FROM recruiters 
      WHERE required_skills IS NOT NULL AND required_skills != '' 
      ${startDate ? 'AND EXISTS (SELECT 1 FROM users WHERE users.id = recruiters.user_id AND users.created_at >= ?)' : ''}
    `, startDate ? [startDate] : []);

    // Process skills data
    const skillsMap = {};
    skillsResult.forEach(row => {
      if (row.required_skills) {
        const skills = row.required_skills.split(',').map(s => s.trim().toLowerCase());
        skills.forEach(skill => {
          if (skill) {
            skillsMap[skill] = (skillsMap[skill] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillsMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill, count], index) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        count,
        percentage: Math.max(90 - (index * 15), 10)
      }));

    // Get registration breakdown
    const [studentRegistrationsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student' AND created_at >= ?",
      [startDate]
    );

    const [recruiterRegistrationsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'recruiter' AND created_at >= ?",
      [startDate]
    );

    const [adminRegistrationsResult] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND created_at >= ?",
      [startDate]
    );

    const overview = {
      totalUsers: totalUsersResult[0].count,
      newSignups: newSignupsResult[0].count,
      verifiedRecruiters: verifiedRecruitersResult[0].count,
      placementRate,
      topSkills,
      studentRegistrations: studentRegistrationsResult[0].count,
      recruiterRegistrations: recruiterRegistrationsResult[0].count,
      adminRegistrations: adminRegistrationsResult[0].count
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ================== STUDENT ANALYTICS REPORT ==================
router.get("/students", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const { startDate } = req.query;
    const pool = getMySQLPool();

    // Get total students
    const [totalStudentsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM students ${startDate ? 'WHERE EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    // Get placed students
    const [placedStudentsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM students WHERE isPlaced = 1 ${startDate ? 'AND EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    // Get job ready students (those with resume and skills)
    const [jobReadyStudentsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM students 
       WHERE (resume_url IS NOT NULL OR skills IS NOT NULL) 
       ${startDate ? 'AND EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}`,
      startDate ? [startDate] : []
    );

    // Get top departments
    const [topDepartmentsResult] = await pool.query(`
      SELECT department, COUNT(*) as count 
      FROM students 
      ${startDate ? 'WHERE EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}
      GROUP BY department 
      ORDER BY count DESC 
      LIMIT 5
    `, startDate ? [startDate] : []);

    // Get top colleges
    const [topCollegesResult] = await pool.query(`
      SELECT college, COUNT(*) as count 
      FROM students 
      ${startDate ? 'WHERE EXISTS (SELECT 1 FROM users WHERE users.id = students.user_id AND users.created_at >= ?)' : ''}
      GROUP BY college 
      ORDER BY count DESC 
      LIMIT 5
    `, startDate ? [startDate] : []);

    const studentData = {
      totalStudents: totalStudentsResult[0].count,
      placedStudents: placedStudentsResult[0].count,
      jobReadyStudents: jobReadyStudentsResult[0].count,
      topDepartments: topDepartmentsResult,
      topColleges: topCollegesResult
    };

    res.status(200).json(studentData);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

export default router;