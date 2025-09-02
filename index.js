import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json()); // สำคัญ!

app.post("/api/register", async (req, res) => {
  const { username, password, email, fullName, birthDate, phone, address, chronicDisease, drugAllergy, foodAllergy } = req.body;

  try {
    // สร้าง patientId แบบ พ.ศ. + running number
    const currentYear = new Date().getFullYear() + 543;
    const yearSuffix = (currentYear % 100).toString().padStart(2, "0");

    const lastPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: "desc" },
      where: { patientId: { startsWith: yearSuffix } },
    });

    let sequence = "0000";
    if (lastPatient) {
      const lastSeq = parseInt(lastPatient.patientId.split("-")[1]);
      sequence = (lastSeq + 1).toString().padStart(4, "0");
    }
    const patientId = `${yearSuffix}-${sequence}`;

    const newPatient = await prisma.patient.create({
      data: {
        patientId,
        username,
        password,
        email,
        fullName,
        birthDate,
        phone,
        address,
        chronicDisease,
        drugAllergy,
        foodAllergy,
      },
    });

    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(400).json({ error: "Registration failed" });
  }
});

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});
