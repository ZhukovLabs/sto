-- Порядок каналов подтверждений вместо трёх булевых флагов
ALTER TABLE "NotificationSettings" DROP COLUMN IF EXISTS "telegramEnabled";
ALTER TABLE "NotificationSettings" DROP COLUMN IF EXISTS "viberEnabled";
ALTER TABLE "NotificationSettings" DROP COLUMN IF EXISTS "smsEnabled";
ALTER TABLE "NotificationSettings" ADD COLUMN "channelOrder" TEXT[] NOT NULL DEFAULT ARRAY['telegram','viber','sms'];
