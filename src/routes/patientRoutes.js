const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test database connection on startup
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err));

function getYearSuffix() {
  const year = new Date().getFullYear();
  return (year % 100).toString().padStart(2, '0');
}

async function generateUserId(role) {
  const yearSuffix = getYearSuffix();
  const usersThisYear = await prisma.user.count({
    where: { userId: { startsWith: yearSuffix }, role },
  });

  let sequence = usersThisYear.toString().padStart(4, '0');
  let userId = `${yearSuffix}-${sequence}`;

  let existingUser = await prisma.user.findUnique({ where: { userId } });
  let newSequence = usersThisYear;

  while (existingUser) {
    newSequence++;
    sequence = newSequence.toString().padStart(4, '0');
    userId = `${yearSuffix}-${sequence}`;
    existingUser = await prisma.user.findUnique({ where: { userId } });
  }

  return userId;
}

router.post('/register', async (req, res) => {
  const {
    username,
    password,
    email,
    fullName,
    phone,
    birthDate,
    address,
    chronicDisease,
    drugAllergy,
    foodAllergy,
    role = 'patient',
  } = req.body;

  const requiredFields = [
    'username',
    'password',
    'email',
    'fullName',
    'phone',
    'birthDate',
    'address',
    'chronicDisease',
    'drugAllergy',
    'foodAllergy',
  ];

  const emptyFields = requiredFields.filter((field) => !req.body[field] || (typeof req.body[field] === 'string' && !req.body[field].trim()));
  if (emptyFields.length > 0) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: `Missing required fields: ${emptyFields.join(', ')}` };
    console.log('Registration log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Invalid email format' };
    console.log('Registration log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  if (!/^\d{10}$/.test(phone)) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Phone must be 10 digits' };
    console.log('Registration log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  const birthDateObj = new Date(birthDate);
  if (isNaN(birthDateObj) || birthDateObj > new Date()) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Invalid or future birth date' };
    console.log('Registration log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  try {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existingUser) {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Username or email already exists' };
      console.log('Registration log:', log);
      return res.status(400).json({ error: log.message, log });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await generateUserId(role);

    const user = await prisma.user.create({
      data: {
        userId,
        username,
        password: hashedPassword,
        email,
        fullName,
        phone,
        birthDate: birthDateObj,
        address,
        chronicDisease,
        drugAllergy,
        foodAllergy,
        role,
      },
    });

    const log = { timestamp: new Date().toISOString(), status: 'success', message: 'Registration successful', userId: user.userId };
    console.log('Registration log:', log);
    res.status(201).json({
      message: log.message,
      user: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        role: user.role,
      },
      log,
    });
  } catch (error) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Registration failed', details: error.message };
    console.error('Registration log:', log);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username or email already exists', log });
    }
    res.status(500).json({ error: log.message, details: log.details, log });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Username and password are required' };
    console.log('Login log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  console.log(`Attempting login for username: ${username}`);
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Invalid username or password' };
      console.log('Login log:', log);
      return res.status(401).json({ error: log.message, log });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Invalid username or password' };
      console.log('Login log:', log);
      return res.status(401).json({ error: log.message, log });
    }

    const log = { timestamp: new Date().toISOString(), status: 'success', message: 'Login successful', userId: user.userId };
    console.log('Login log:', log);
    res.status(200).json({
      user: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        birthDate: user.birthDate,
        address: user.address,
        chronicDisease: user.chronicDisease,
        drugAllergy: user.drugAllergy,
        foodAllergy: user.foodAllergy,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      log,
    });
  } catch (error) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Server error', details: error.message };
    console.error('Login log:', log);
    res.status(500).json({ error: log.message, details: log.details, log });
  }
});

router.get('/dashboard', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Username is required' };
    console.log('Dashboard log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { patientAppointments: { include: { staff: true, treatment: true } } },
    });

    if (!user) {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'User not found' };
      console.log('Dashboard log:', log);
      return res.status(404).json({ error: log.message, log });
    }

    const appointment = user.patientAppointments?.[0] || {};
    const dashboardData = {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      birthDate: user.birthDate,
      phone: user.phone,
      address: user.address,
      chronicDisease: user.chronicDisease,
      drugAllergy: user.drugAllergy,
      foodAllergy: user.foodAllergy,
      role: user.role,
      appointmentDate: appointment.dateTime || null,
      status: appointment.status || 'pending',
      staffId: appointment.staff?.userId || null,
      treatmentId: appointment.treatmentId || null,
    };

    const log = { timestamp: new Date().toISOString(), status: 'success', message: 'Dashboard data fetched', userId: user.userId };
    console.log('Dashboard log:', log);
    res.status(200).json({ data: dashboardData, log });
  } catch (error) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Failed to fetch dashboard data', details: error.message };
    console.error('Dashboard log:', log);
    res.status(500).json({ error: log.message, details: log.details, log });
  }
});

router.post('/dashboard/admin', async (req, res) => {
  const { username, newRole, adminUsername } = req.body;

  if (!username || !newRole || !adminUsername) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'username, newRole, and adminUsername are required' };
    console.log('Admin dashboard log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  if (!['patient', 'doctor', 'staff'].includes(newRole)) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Invalid role' };
    console.log('Admin dashboard log:', log);
    return res.status(400).json({ error: log.message, log });
  }

  try {
    const adminUser = await prisma.user.findUnique({ where: { username: adminUsername } });
    if (!adminUser || adminUser.role !== 'staff') {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Only staff can change role' };
      console.log('Admin dashboard log:', log);
      return res.status(403).json({ error: log.message, log });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      const log = { timestamp: new Date().toISOString(), status: 'error', message: 'User not found' };
      console.log('Admin dashboard log:', log);
      return res.status(404).json({ error: log.message, log });
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: { role: newRole },
    });

    const log = { timestamp: new Date().toISOString(), status: 'success', message: 'Role updated successfully', userId: updatedUser.userId };
    console.log('Admin dashboard log:', log);
    res.status(200).json({
      message: log.message,
      user: updatedUser,
      log,
    });
  } catch (error) {
    const log = { timestamp: new Date().toISOString(), status: 'error', message: 'Failed to update role', details: error.message };
    console.error('Admin dashboard log:', log);
    res.status(500).json({ error: log.message, details: log.details, log });
  }
});

module.exports = router;