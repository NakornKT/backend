const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const treatment = await prisma.treatment.create({ data: req.body });
    res.status(201).json(treatment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/doctor/:license_number', async (req, res) => {
  try {
    const treatments = await prisma.treatment.findMany({
      where: { dentist_license: req.params.license_number },
    });
    res.json(treatments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;