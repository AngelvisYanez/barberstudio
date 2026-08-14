-- AlterTable
ALTER TABLE "AccountPayable" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "AccountReceivable" ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "AccountPayable_status_idx" ON "AccountPayable"("status");

-- CreateIndex
CREATE INDEX "AccountReceivable_status_idx" ON "AccountReceivable"("status");
