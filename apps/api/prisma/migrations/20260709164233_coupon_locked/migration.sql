-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Coupon_eventId_locked_idx" ON "Coupon"("eventId", "locked");
