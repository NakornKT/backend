const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Register staff
router.post('/register', async (req, res) => {
  const { username, password, fullName, phone } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and fullName are required' });
  }

  try {
    const existingStaff = await prisma.staff.findFirst({
      where: { OR: [{ username }] },
    });
    if (existingStaff) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        phone,
      },
    });

    res.status(201).json({ message: 'Staff registration successful', staff });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
