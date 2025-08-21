const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const appointment = await prisma.appointment.create({ data: req.body });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/patient/:patient_id', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patient_id: req.params.patient_id },
    });
    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:appoint_id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { appoint_id: parseInt(req.params.appoint_id) },
      data: { appoint_status: req.body.status },
    });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:appoint_id/confirm', async (req, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { appoint_id: parseInt(req.params.appoint_id) },
      data: { appoint_status: 'CONFIRMED' },
    });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;