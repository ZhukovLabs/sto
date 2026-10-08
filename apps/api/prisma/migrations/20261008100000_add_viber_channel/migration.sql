-- Канал Viber через SMSC в настройках уведомлений
ALTER TABLE "NotificationSettings" ADD COLUMN "viberEnabled" BOOLEAN NOT NULL DEFAULT true;
