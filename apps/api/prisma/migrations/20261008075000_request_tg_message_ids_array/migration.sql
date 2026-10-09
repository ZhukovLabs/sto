-- AlterTable: перенос единственного id в массив
ALTER TABLE "Request" ADD COLUMN "tgMessageIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
UPDATE "Request" SET "tgMessageIds" = ARRAY["tgMessageId"] WHERE "tgMessageId" IS NOT NULL;
ALTER TABLE "Request" DROP COLUMN "tgMessageId";
