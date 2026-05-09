// server.js (cleaned)
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Firebase Admin setup
require('./config/firebase');

// ------------- Import routes -------------
const staffRoutes              = require('./routes/staffRoutes');
const galleryRoutes            = require('./routes/galleryRoutes');
const adminRoutes              = require('./routes/adminRoutes');
const activityRoutes           = require('./routes/activityRoutes');
const enquiryRoutes            = require('./routes/enquiryRoutes');
const teacherAssignmentRoutes  = require('./routes/teacherAssignmentRoutes');
const studentRoutes            = require('./routes/studentRoutes');
const noticeRoutes             = require('./routes/noticeRoutes');
const assignmentRoutes         = require('./routes/assignmentRoutes');
const clerkAuthRoutes          = require('./routes/clerkAuthRoutes');
const clerkRoutes              = require('./routes/clerkRoutes');
const admissionRoutes          = require('./routes/admissionRoutes');
const classTeacherRoutes       = require('./routes/classTeacherRoutes');
const attendanceRoutes         = require('./routes/attendanceRoutes');
const teacherAuthRoutes        = require('./routes/teacherAuthRoutes');

const app = express();

// ------------- Middleware -------------
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------- Public test route -------------
app.get('/', (req, res) => {
  res.send('✅ Kilbil School Backend API is running with Firebase!');
});

// ------------- API Routes (each mounted exactly ONCE) -------------
app.use('/api/staff',               staffRoutes);
app.use('/api/gallery',             galleryRoutes);
app.use('/api/admin',               adminRoutes);
app.use('/api/activities',          activityRoutes);
app.use('/api/enquiries',           enquiryRoutes);
app.use('/api/teacher-assignments', teacherAssignmentRoutes);
app.use('/api/students',            studentRoutes);
app.use('/api/notices',             noticeRoutes);
app.use('/api/assignments',         assignmentRoutes);
app.use('/api/class-teacher',       classTeacherRoutes);
app.use('/api/attendance',          attendanceRoutes);
app.use('/api/teacher/auth',        teacherAuthRoutes);
app.use('/api/clerk/auth',          clerkAuthRoutes);
app.use('/api/clerk/admissions',    admissionRoutes);
app.use('/api/clerk',               clerkRoutes);   // general clerk routes (students, fees, donations, etc.)
app.use('/api/toppers', require('./routes/topperRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));


// ------------- Start server -------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});