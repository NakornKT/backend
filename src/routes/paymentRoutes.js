const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const payment = await prisma.payment.create({ data: req.body });
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;