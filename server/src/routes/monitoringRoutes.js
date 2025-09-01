import express from "express";
import { getMySQLPool } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import os from "os";
import process from "process";

const router = express.Router();

// Store active users and request metrics in memory
let activeUsers = new Set();
let requestMetrics = {
  totalRequests: 0,
  requestsPerMinute: 0,
  responseTimeHistory: [],
  lastMinuteRequests: []
};

// Middleware to track request metrics
export const trackRequest = (req, res, next) => {
  const startTime = Date.now();
  requestMetrics.totalRequests++;
  
  // Track requests per minute
  const now = Date.now();
  requestMetrics.lastMinuteRequests.push(now);
  requestMetrics.lastMinuteRequests = requestMetrics.lastMinuteRequests.filter(
    time => now - time < 60000 // Keep only last minute
  );
  requestMetrics.requestsPerMinute = requestMetrics.lastMinuteRequests.length;

  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    requestMetrics.responseTimeHistory.push(responseTime);
    if (requestMetrics.responseTimeHistory.length > 100) {
      requestMetrics.responseTimeHistory.shift();
    }
  });

  next();
};

// Track active users based on auth token
export const trackActiveUser = (req, res, next) => {
  if (req.user?.id) {
    activeUsers.add(req.user.id);
    // Remove user after 5 minutes of inactivity
    setTimeout(() => {
      activeUsers.delete(req.user.id);
    }, 5 * 60 * 1000);
  }
  next();
};

// ================== SYSTEM METRICS ==================
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const pool = getMySQLPool();
    
    // Get database connection stats
    const [dbStats] = await pool.query("SHOW STATUS LIKE 'Threads_connected'");
    const dbConnections = parseInt(dbStats[0]?.Value || 0);

    // Calculate average response time
    const avgResponseTime = requestMetrics.responseTimeHistory.length > 0
      ? Math.round(requestMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / requestMetrics.responseTimeHistory.length)
      : 0;

    // Get system metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    const cpuUsage = Math.round(process.cpuUsage().user / 1000000); // Convert to percentage

    const metrics = {
      activeUsers: activeUsers.size,
      serverLoad: memoryUsage, // Using memory usage as server load indicator
      databaseConnections: dbConnections,
      responseTime: avgResponseTime,
      requestsPerMinute: requestMetrics.requestsPerMinute,
      totalRequests: requestMetrics.totalRequests,
      systemHealth: {
        cpu: cpuUsage,
        memory: memoryUsage,
        uptime: Math.round(process.uptime() / 60) // in minutes
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================== SYSTEM STATUS ==================
router.get("/status", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const pool = getMySQLPool();
    
    // Check database connectivity
    let dbStatus = 'connected';
    try {
      await pool.query("SELECT 1");
    } catch (dbError) {
      dbStatus = 'disconnected';
    }

    // Check API Gateway (simulate)
    const apiStatus = 'healthy'; // In real app, you'd ping your API endpoints

    // Check CDN (simulate)
    const cdnStatus = 'active';

    // Overall system status
    let overallStatus = 'healthy';
    const memoryUsage = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const avgResponseTime = requestMetrics.responseTimeHistory.length > 0
      ? Math.round(requestMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / requestMetrics.responseTimeHistory.length)
      : 0;

    if (memoryUsage > 90 || avgResponseTime > 1000 || dbStatus === 'disconnected') {
      overallStatus = 'critical';
    } else if (memoryUsage > 70 || avgResponseTime > 500) {
      overallStatus = 'warning';
    }

    const status = {
      overall: overallStatus,
      services: {
        apiGateway: apiStatus,
        database: dbStatus,
        cdn: cdnStatus
      },
      storage: {
        database: Math.floor(Math.random() * 30) + 50, // Simulate 50-80% usage
        fileStorage: Math.floor(Math.random() * 20) + 30 // Simulate 30-50% usage
      }
    };

    res.json(status);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================== SYSTEM ALERTS ==================
router.get("/alerts", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Generate dynamic alerts based on system state
    const alerts = [];
    
    const memoryUsage = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const avgResponseTime = requestMetrics.responseTimeHistory.length > 0
      ? Math.round(requestMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / requestMetrics.responseTimeHistory.length)
      : 0;

    if (memoryUsage > 80) {
      alerts.push({
        id: Date.now() + 1,
        type: 'warning',
        message: `High memory usage detected: ${memoryUsage}%`,
        time: 'Just now'
      });
    }

    if (avgResponseTime > 500) {
      alerts.push({
        id: Date.now() + 2,
        type: 'warning',
        message: `Slow response time: ${avgResponseTime}ms average`,
        time: '1 minute ago'
      });
    }

    if (activeUsers.size > 100) {
      alerts.push({
        id: Date.now() + 3,
        type: 'info',
        message: `High user activity: ${activeUsers.size} active users`,
        time: '2 minutes ago'
      });
    }

    // Add some static alerts for demo
    alerts.push({
      id: Date.now() + 4,
      type: 'info',
      message: 'Database backup completed successfully',
      time: '15 minutes ago'
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================== PERFORMANCE HISTORY ==================
router.get("/performance", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Generate performance data for charts (last 24 hours simulation)
    const hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push({
        time: time.getHours() + ':00',
        activeUsers: Math.floor(Math.random() * 200) + 100,
        serverLoad: Math.floor(Math.random() * 60) + 20,
        responseTime: Math.floor(Math.random() * 100) + 50,
        requests: Math.floor(Math.random() * 1000) + 500
      });
    }

    res.json({ hourlyData: hours });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================== QUICK ACTIONS ==================
router.post("/actions/clear-cache", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Simulate cache clearing
    setTimeout(() => {
      console.log("Cache cleared by admin:", req.user.id);
    }, 1000);

    res.json({ 
      message: 'Cache clearing initiated',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/actions/restart-services", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Simulate service restart
    setTimeout(() => {
      console.log("Services restarted by admin:", req.user.id);
    }, 2000);

    res.json({ 
      message: 'Service restart initiated',
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error restarting services:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/actions/export-logs", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    // Simulate log export
    const logData = {
      timestamp: new Date().toISOString(),
      totalRequests: requestMetrics.totalRequests,
      activeUsers: activeUsers.size,
      systemUptime: process.uptime(),
      exportedBy: req.user.id
    };

    res.json({ 
      message: 'Log export completed',
      status: 'success',
      data: logData,
      downloadUrl: '/api/monitoring/download-logs/' + Date.now()
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ================== DETAILED ANALYTICS ==================
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const pool = getMySQLPool();
    
    // Get user statistics
    const [totalUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [totalStudents] = await pool.query("SELECT COUNT(*) as count FROM students");
    const [totalRecruiters] = await pool.query("SELECT COUNT(*) as count FROM recruiters");
    const [totalAdmins] = await pool.query("SELECT COUNT(*) as count FROM admins");
    
    // Get recent registrations (last 7 days)
    const [recentRegistrations] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get verification statistics
    const [pendingVerifications] = await pool.query(
      "SELECT COUNT(*) as count FROM recruiters WHERE isVerified = 0 OR isVerified IS NULL"
    );
    
    const [approvedRecruiters] = await pool.query(
      "SELECT COUNT(*) as count FROM recruiters WHERE isVerified = 1"
    );

    const analytics = {
      userStats: {
        total: totalUsers[0].count,
        students: totalStudents[0].count,
        recruiters: totalRecruiters[0].count,
        admins: totalAdmins[0].count
      },
      verificationStats: {
        pending: pendingVerifications[0].count,
        approved: approvedRecruiters[0].count
      },
      registrationTrend: recentRegistrations,
      systemMetrics: {
        activeConnections: activeUsers.size,
        totalRequests: requestMetrics.totalRequests,
        requestsPerMinute: requestMetrics.requestsPerMinute,
        averageResponseTime: requestMetrics.responseTimeHistory.length > 0
          ? Math.round(requestMetrics.responseTimeHistory.reduce((a, b) => a + b, 0) / requestMetrics.responseTimeHistory.length)
          : 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;