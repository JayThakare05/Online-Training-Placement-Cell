import jwt from "jsonwebtoken";

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = user; // Contains { id, role }
    next();
  });
};

// Role-based authorization middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorizeRoles("admin");

// Student only middleware  
export const studentOnly = authorizeRoles("student");

// Recruiter only middleware
export const recruiterOnly = authorizeRoles("recruiter");

// Admin or Student middleware
export const adminOrStudent = authorizeRoles("admin", "student");

// Admin or Recruiter middleware
export const adminOrRecruiter = authorizeRoles("admin", "recruiter");