-- Рассылка заявок нескольким мастерам: Master (чаты), RequestMessage (сообщения по чатам).
ALTER TABLE "Request" DROP COLUMN "tgMessageIds";

CREATE TABLE "Master" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "telegramChatId" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Master_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Master_telegramChatId_key" ON "Master"("telegramChatId");

CREATE TABLE "RequestMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "RequestMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RequestMessage_chatId_messageId_key" ON "RequestMessage"("chatId", "messageId");
CREATE INDEX "RequestMessage_requestId_idx" ON "RequestMessage"("requestId");

ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
