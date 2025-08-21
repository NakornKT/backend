const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const patient = await prisma.patient.create({ data: req.body });
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:patient_id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { patient_id: req.params.patient_id },
    });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;