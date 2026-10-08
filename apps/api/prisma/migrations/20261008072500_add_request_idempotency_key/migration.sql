-- AlterTable
ALTER TABLE "Request" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Request_idempotencyKey_key" ON "Request"("idempotencyKey");
