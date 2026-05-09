const { db } = require('../config/firebase');

const requireClassTeacher = async (req, res, next) => {
  try {
    const teacherId = req.teacher.id;

    // Get ALL class‑teacher assignments for this teacher
    const snapshot = await db.collection('teacherAssignments')
      .where('teacherId', '==', teacherId)
      .where('isClassTeacher', '==', true)
      .get();                                      // ← remove .limit(1)

    if (snapshot.empty) {
      return res.status(403).json({ error: 'Only class teachers can perform this action' });
    }

    // Build an array of all classes the teacher is responsible for
    const classes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      classes.push(data.class);
    });

    // Attach the list of classes
    req.classTeacherClasses = classes;

    // Keep the first assignment as the default for attendance routes
    const firstDoc = snapshot.docs[0];
    const firstData = firstDoc.data();
    req.classTeacher = {
      class: firstData.class,
      teacherId: firstData.teacherId,
      teacherName: firstData.teacherName,
      assignmentId: firstDoc.id
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = requireClassTeacher;