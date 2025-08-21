const express = require('express');
const prisma = require('../db');
const router = express.Router();

router.get('/daily/:date', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        issue_date: {
          gte: new Date(req.params.date),
          lte: new Date(req.params.date + 'T23:59:59.999Z'),
        },
      },
    });
    const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
    res.json({ invoices, total });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const start = new Date(`${req.params.year}-${req.params.month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const invoices = await prisma.invoice.findMany({
      where: {
        issue_date: { gte: start, lte: end },
      },
    });
    const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
    res.json({ invoices, total });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;