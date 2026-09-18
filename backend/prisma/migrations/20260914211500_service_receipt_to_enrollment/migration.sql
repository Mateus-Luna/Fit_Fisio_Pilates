-- DropForeignKey
ALTER TABLE "ServiceReceipt" DROP CONSTRAINT IF EXISTS "ServiceReceipt_paymentId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ServiceReceipt_paymentId_key";

-- AlterTable
ALTER TABLE "ServiceReceipt" DROP COLUMN IF EXISTS "paymentId",
ADD COLUMN IF NOT EXISTS "enrollmentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceReceipt_enrollmentId_key" ON "ServiceReceipt"("enrollmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceReceipt_enrollmentId_idx" ON "ServiceReceipt"("enrollmentId");

-- AddForeignKey
ALTER TABLE "ServiceReceipt" ADD CONSTRAINT "ServiceReceipt_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
