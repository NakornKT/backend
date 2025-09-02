const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/patients', patientRoutes);

// Server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});