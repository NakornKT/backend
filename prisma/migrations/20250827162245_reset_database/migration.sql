/*
  Warnings:

  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[userId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "public"."Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "public"."Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_staffId_idx" ON "public"."Appointment"("staffId");

-- CreateIndex
CREATE INDEX "Appointment_treatmentId_idx" ON "public"."Appointment"("treatmentId");

-- CreateIndex
CREATE INDEX "TreatmentRecord_patientId_idx" ON "public"."TreatmentRecord"("patientId");

-- CreateIndex
CREATE INDEX "TreatmentRecord_doctorId_idx" ON "public"."TreatmentRecord"("doctorId");

-- CreateIndex
CREATE INDEX "TreatmentRecord_treatmentId_idx" ON "public"."TreatmentRecord"("treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "public"."User"("userId");
