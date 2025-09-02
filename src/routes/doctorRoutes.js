const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// สมัครหมอใหม่
router.post('/register', async (req, res) => {
  const { username, password, name, specialization } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = await req.prisma.doctor.create({
      data: { username, password: hashedPassword, name, specialization },
    });
    res.json(doctor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Doctor registration failed' });
  }
});

// เข้าสู่ระบบหมอ
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const doctor = await req.prisma.doctor.findUnique({ where: { username } });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid password' });

    res.json({ message: 'Login successful', doctor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Doctor login failed' });
  }
});

// ดึงรายการนัดหมายของหมอ
router.get('/:doctorId/appointments', async (req, res) => {
  const { doctorId } = req.params;
  try {
    const appointments = await req.prisma.appointment.findMany({
      where: { doctorId: Number(doctorId) },
      include: { patient: true },
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// บันทึกการรักษา
router.post('/:doctorId/treatments', async (req, res) => {
  const { doctorId } = req.params;
  const { appointmentId, description } = req.body;
  try {
    const treatment = await req.prisma.treatment.create({
      data: {
        description,
        doctorId: Number(doctorId),
        appointmentId: Number(appointmentId),
      },
    });
    res.json(treatment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record treatment' });
  }
});

module.exports = router;
