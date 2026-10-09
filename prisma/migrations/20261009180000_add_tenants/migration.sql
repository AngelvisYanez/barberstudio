-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';

-- Operational rows cannot receive a required tenant after the fact.
-- The platform admin user is kept; everything else is removed.
TRUNCATE TABLE
  "InventoryMovement",
  "Appointment",
  "AccountPayablePayment",
  "Transaction",
  "AccountPayable",
  "AccountReceivable",
  "Product",
  "Service",
  "Barber",
  "Client",
  "Category",
  "BusinessSettings"
RESTART IDENTITY CASCADE;

DELETE FROM "User" WHERE email <> 'admin@barberstudio.com';

-- DropIndex
DROP INDEX "Category_name_type_key";

-- DropIndex
DROP INDEX "Transaction_date_idx";

-- DropIndex
DROP INDEX "AccountReceivable_dueDate_idx";

-- DropIndex
DROP INDEX "AccountReceivable_status_idx";

-- DropIndex
DROP INDEX "AccountPayable_dueDate_idx";

-- DropIndex
DROP INDEX "AccountPayable_status_idx";

-- DropIndex
DROP INDEX "AccountPayablePayment_paidAt_idx";

-- DropIndex
DROP INDEX "Client_name_idx";

-- DropIndex
DROP INDEX "Client_active_idx";

-- DropIndex
DROP INDEX "Barber_name_idx";

-- DropIndex
DROP INDEX "Barber_active_idx";

-- DropIndex
DROP INDEX "Service_active_idx";

-- DropIndex
DROP INDEX "Service_name_key";

-- DropIndex
DROP INDEX "Appointment_startsAt_idx";

-- DropIndex
DROP INDEX "Appointment_status_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Product_name_idx";

-- DropIndex
DROP INDEX "Product_active_idx";

-- DropIndex
DROP INDEX "InventoryMovement_createdAt_idx";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AccountReceivable" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AccountPayable" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AccountPayablePayment" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Barber" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BusinessSettings" ADD COLUMN     "tenantId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "businessName" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_active_idx" ON "Tenant"("active");

-- CreateIndex
CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_name_type_key" ON "Category"("tenantId", "name", "type");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_date_idx" ON "Transaction"("tenantId", "date");

-- CreateIndex
CREATE INDEX "AccountReceivable_tenantId_dueDate_idx" ON "AccountReceivable"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "AccountReceivable_tenantId_status_idx" ON "AccountReceivable"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AccountPayable_tenantId_dueDate_idx" ON "AccountPayable"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "AccountPayable_tenantId_status_idx" ON "AccountPayable"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AccountPayablePayment_tenantId_paidAt_idx" ON "AccountPayablePayment"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Client_tenantId_name_idx" ON "Client"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Client_tenantId_active_idx" ON "Client"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Barber_tenantId_name_idx" ON "Barber"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Barber_tenantId_active_idx" ON "Barber"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Service_tenantId_active_idx" ON "Service"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Service_tenantId_name_key" ON "Service"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_startsAt_idx" ON "Appointment"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_status_idx" ON "Appointment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Product_tenantId_active_idx" ON "Product"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "Product"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "InventoryMovement_tenantId_createdAt_idx" ON "InventoryMovement"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSettings_tenantId_key" ON "BusinessSettings"("tenantId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountReceivable" ADD CONSTRAINT "AccountReceivable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayable" ADD CONSTRAINT "AccountPayable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountPayablePayment" ADD CONSTRAINT "AccountPayablePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSettings" ADD CONSTRAINT "BusinessSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
