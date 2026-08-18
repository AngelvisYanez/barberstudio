-- AlterTable
ALTER TABLE "AccountPayable" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "AccountPayablePayment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountPayablePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountPayablePayment_accountId_idx" ON "AccountPayablePayment"("accountId");

-- CreateIndex
CREATE INDEX "AccountPayablePayment_paidAt_idx" ON "AccountPayablePayment"("paidAt");

-- CreateIndex
CREATE INDEX "AccountPayable_categoryId_idx" ON "AccountPayable"("categoryId");

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayablePayment" ADD CONSTRAINT "AccountPayablePayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountPayable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill payments already registered before this table existed
INSERT INTO "AccountPayablePayment" ("id", "accountId", "amount", "paidAt", "note", "createdAt")
SELECT
  CONCAT('backfill_', "id"),
  "id",
  "paidAmount",
  COALESCE("updatedAt", "createdAt"),
  'Migración de abonos previos',
  CURRENT_TIMESTAMP
FROM "AccountPayable"
WHERE "paidAmount" > 0;

