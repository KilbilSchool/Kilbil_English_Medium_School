const express = require('express');
const router = express.Router();
const { verifyClerk } = require('../middleware/authMiddleware');
const studentService = require('../services/studentService');
const { db, admin } = require('../config/firebase');

// -----------------------------------------------------------
// STUDENT ENROLLMENT (CLERK)
// -----------------------------------------------------------

router.get('/students', verifyClerk, async (req, res) => {
  try {
    const students = await studentService.getAllStudents();
    const safe = students.map(({ password, ...rest }) => rest);
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/students/:id', verifyClerk, async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const { password, ...safe } = student;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:id', verifyClerk, async (req, res) => {
  try {
    const updated = await studentService.updateStudent(req.params.id, req.body);
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/students/:id', verifyClerk, async (req, res) => {
  try {
    await studentService.deleteStudent(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------
// BONAFIDE CERTIFICATE TEMPLATE
// -----------------------------------------------------------

router.get('/bonafide/template', verifyClerk, async (req, res) => {
  try {
    const doc = await db.collection('templates').doc('bonafide').get();
    if (!doc.exists) return res.json({ template: null });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bonafide/template', verifyClerk, async (req, res) => {
  try {
    const { template } = req.body;
    await db.collection('templates').doc('bonafide').set({
      template,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------
// ID CARD TEMPLATE
// -----------------------------------------------------------

router.get('/idcard/template', verifyClerk, async (req, res) => {
  try {
    const doc = await db.collection('templates').doc('idcard').get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/idcard/template', verifyClerk, async (req, res) => {
  try {
    const { template, bgColor, textColor } = req.body;
    await db.collection('templates').doc('idcard').set({
      template: template || '',
      bgColor: bgColor || '#ffffff',
      textColor: textColor || '#000000',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------
// LEAVING CERTIFICATE (LC)
// -----------------------------------------------------------

router.post('/lc', verifyClerk, async (req, res) => {
  try {
    const {
      studentId,
      dateOfLeaving,
      reasonForLeaving,
      progressInStudy,
      conduct,
      standardStudying,
      sinceWhen,
      remark
    } = req.body;

    if (!studentId || !dateOfLeaving || !reasonForLeaving) {
      return res.status(400).json({ error: 'studentId, dateOfLeaving, reasonForLeaving are required' });
    }

    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) return res.status(404).json({ error: 'Student not found' });
    const student = studentDoc.data();

    const lcRecord = {
      studentId,
      studentName: student.name,
      studentClass: student.currentClass || student.class,
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      nationality: student.nationality || '',
      motherTongue: student.motherTongue || '',
      religion: student.religion || '',
      caste: student.caste || '',
      subCaste: student.subCaste || '',
      placeOfBirth: student.placeOfBirth || {},
      dob: student.dob || '',
      previousSchool: student.previousSchool || '',
      admissionClass: student.admissionClass || '',
      dateOfAdmission: student.dateOfAdmission || '',
      dateOfLeaving,
      reasonForLeaving,
      progressInStudy: progressInStudy || '',
      conduct: conduct || '',
      standardStudying: standardStudying || '',
      sinceWhen: sinceWhen || '',
      remark: remark || '',
      issuedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('lcRecords').add(lcRecord);
    res.status(201).json({ id: ref.id, ...lcRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lc', verifyClerk, async (req, res) => {
  try {
    const snapshot = await db.collection('lcRecords').orderBy('issuedAt', 'desc').get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lc/:id', verifyClerk, async (req, res) => {
  try {
    const doc = await db.collection('lcRecords').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'LC not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------
// FEE COLLECTION (dynamic fee structure)
// -----------------------------------------------------------

router.get('/fees/student/:studentId', verifyClerk, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) return res.status(404).json({ error: 'Student not found' });
    const student = studentDoc.data();

    // Read dynamic fee structure set by admin
    const feeDoc = await db.collection('settings').doc('feeStructure').get();
    const feeMap = feeDoc.exists ? (feeDoc.data().fees || {}) : {};
    const totalFee = feeMap[student.class] || 25000;   // fallback

    const paymentsSnap = await db.collection('feePayments')
      .where('studentId', '==', studentId)
      .orderBy('date', 'desc')
      .get();
    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalFee - totalPaid;

    const lastPaymentDate = payments.length > 0 ? payments[0].date : null;
    const nextInstallmentDate = lastPaymentDate
      ? new Date(new Date(lastPaymentDate).getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString().slice(0, 10)
      : null;

    res.json({
      student: { id: studentId, name: student.name, class: student.class },
      feeStructure: { totalFee, paid: totalPaid, balance, nextInstallmentDate },
      payments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fees/pay', verifyClerk, async (req, res) => {
  try {
    const { studentId, amount, date, mode } = req.body;
    if (!studentId || !amount || !date) {
      return res.status(400).json({ error: 'studentId, amount, date are required' });
    }

    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) return res.status(404).json({ error: 'Student not found' });
    const student = studentDoc.data();

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countSnap = await db.collection('feePayments')
      .where('date', '>=', new Date().toISOString().slice(0, 10))
      .get();
    const receiptNo = `RCP-${today}-${String(countSnap.size + 1).padStart(3, '0')}`;
    const amountWords = numberToWords(amount);

    const payment = {
      studentId,
      studentName: student.name,
      studentClass: student.class,
      amount: parseFloat(amount),
      date,
      mode: mode || 'cash',
      receiptNo,
      amountWords,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('feePayments').add(payment);

    res.status(201).json({
      receipt: payment,
      student: { id: studentId, name: student.name, class: student.class },
      nextInstallmentDate: new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000)
                            .toISOString().slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fees/recent', verifyClerk, async (req, res) => {
  try {
    const snapshot = await db.collection('feePayments')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------
// DONATIONS
// -----------------------------------------------------------

router.post('/donations', verifyClerk, async (req, res) => {
  try {
    const { donorName, amount, date, mode, purpose, receiptNo } = req.body;
    if (!donorName || !amount || !date) {
      return res.status(400).json({ error: 'donorName, amount, date are required' });
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countSnap = await db.collection('donations').get();
    const finalReceiptNo = receiptNo || `DON-${today}-${String(countSnap.size + 1).padStart(3, '0')}`;

    const donation = {
      donorName,
      amount: parseFloat(amount),
      date,
      mode: mode || 'cash',
      purpose: purpose || '',
      receiptNo: finalReceiptNo,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('donations').add(donation);
    res.status(201).json({ id: ref.id, ...donation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/donations', verifyClerk, async (req, res) => {
  try {
    const snapshot = await db.collection('donations').orderBy('createdAt', 'desc').get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Helper ----------
function numberToWords(num) {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + units[num % 10] : '');
  if (num < 1000) return units[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  return 'Large amount';
}

module.exports = router;