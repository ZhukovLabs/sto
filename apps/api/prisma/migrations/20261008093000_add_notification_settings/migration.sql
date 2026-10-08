-- Настройки каналов подтверждений (Telegram-личка / SMS)
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "NotificationSettings" ("id", "telegramEnabled", "smsEnabled", "updatedAt")
VALUES ('singleton', true, true, now());
