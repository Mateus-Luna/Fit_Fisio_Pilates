/*
  Warnings:

  - You are about to drop the column `studentId` on the `ServiceReceipt` table. All the data in the column will be lost.
  - You are about to drop the `DiscountRule` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentId]` on the table `ServiceReceipt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentId` to the `ServiceReceipt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceReceipt" DROP CONSTRAINT "ServiceReceipt_studentId_fkey";

-- DropIndex
DROP INDEX "ServiceReceipt_studentId_key";

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ServiceReceipt" DROP COLUMN "studentId",
ADD COLUMN     "paymentId" TEXT NOT NULL;

-- DropTable
DROP TABLE "DiscountRule";

-- DropEnum
DROP TYPE "DiscountCategory";

-- DropEnum
DROP TYPE "DiscountType";

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReceipt_paymentId_key" ON "ServiceReceipt"("paymentId");

-- AddForeignKey
ALTER TABLE "ServiceReceipt" ADD CONSTRAINT "ServiceReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
