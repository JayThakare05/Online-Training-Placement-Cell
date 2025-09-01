import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import AdminDashboard from './pages/admin/Dashboard';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import StudentDashboard from './pages/student/Dashboard';

// Profile Pages
import AdminProfile from './pages/admin/Profile';
import RecruiterProfile from './pages/recruiter/Profile';
import StudentProfile from './pages/student/Profile';

// Admin Feature Pages
import ManageTraining from './features/admin/ManageTrainingContent';
import VerifyRecruiters from './features/admin/VerifyRecruiters';
import Reports from './features/admin/Reports';
import MonitorData from './features/admin/MonitorData';
import ManageStudents from './features/admin/ManageStudents';

import PostJob from "./features/recruiter/PostJob";

import CodingBattle from './features/student/CodingBattle';
import JobApplications from './features/student/JobApplications';
import MockInterviews from './features/student/MockInterviews';
import UploadResume from './features/student/UploadResume';


// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/profile" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/training" 
            element={
              <ProtectedRoute allowedRole="admin">
                <ManageTraining />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/manage-students" 
            element={
              <ProtectedRoute allowedRole="admin">
                <ManageStudents />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/verify" 
            element={
              <ProtectedRoute allowedRole="admin">
                <VerifyRecruiters />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRole="admin">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/monitor" 
            element={
              <ProtectedRoute allowedRole="admin">
                <MonitorData />
              </ProtectedRoute>
            } 
          />
          
          {/* Recruiter Routes */}
          <Route 
            path="/recruiter/dashboard" 
            element={
              <ProtectedRoute allowedRole="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/profile" 
            element={
              <ProtectedRoute allowedRole="recruiter">
                <RecruiterProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/post-job" 
            element={
              <ProtectedRoute allowedRole="recruiter">
                <PostJob/>
              </ProtectedRoute>
            } 
          />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/profile" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/resume" 
            element={
              <ProtectedRoute allowedRole="student">
                <UploadResume />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/interviews" 
            element={
              <ProtectedRoute allowedRole="student">
                <MockInterviews />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/coding" 
            element={
              <ProtectedRoute allowedRole="student">
                <CodingBattle />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/applications" 
            element={
              <ProtectedRoute allowedRole="student">
                <JobApplications />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to appropriate dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;