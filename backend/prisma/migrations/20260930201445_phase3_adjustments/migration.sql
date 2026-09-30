-- AlterTable
ALTER TABLE "MedicalCertificate" ADD COLUMN     "content" TEXT,
ADD COLUMN     "enrollmentId" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "documentPath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceReceipt" ADD COLUMN     "isSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MedicalCertificate_enrollmentId_idx" ON "MedicalCertificate"("enrollmentId");

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
