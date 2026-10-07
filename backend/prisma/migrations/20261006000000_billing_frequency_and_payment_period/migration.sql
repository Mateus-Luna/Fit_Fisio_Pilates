-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('MONTHLY', 'BIWEEKLY');

-- CreateEnum
CREATE TYPE "PaymentPeriod" AS ENUM ('MONTHLY', 'FIRST_FORTNIGHT', 'SECOND_FORTNIGHT');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN "billingFrequency" "BillingFrequency" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "period" "PaymentPeriod" NOT NULL DEFAULT 'MONTHLY';

-- DropIndex
DROP INDEX IF EXISTS "Payment_enrollmentId_referenceYear_referenceMonth_key";

-- CreateIndex
CREATE UNIQUE INDEX "Payment_enrollmentId_referenceYear_referenceMonth_period_key" ON "Payment"("enrollmentId", "referenceYear", "referenceMonth", "period");
