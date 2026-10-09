-- Таблица настроек записи (singleton-строка)
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL,
    "slotStepMinutes" INTEGER NOT NULL DEFAULT 60,
    "horizonDays" INTEGER NOT NULL DEFAULT 14,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "schedule" JSONB NOT NULL,
    "exceptions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- Дефолтные настройки: Пн–Сб 9:00–20:00, Вс — выходной
INSERT INTO "BookingSettings" ("id", "slotStepMinutes", "horizonDays", "capacity", "schedule", "exceptions", "updatedAt")
VALUES (
    'singleton',
    60,
    14,
    1,
    '{"mon":{"enabled":true,"from":"09:00","to":"20:00"},"tue":{"enabled":true,"from":"09:00","to":"20:00"},"wed":{"enabled":true,"from":"09:00","to":"20:00"},"thu":{"enabled":true,"from":"09:00","to":"20:00"},"fri":{"enabled":true,"from":"09:00","to":"20:00"},"sat":{"enabled":true,"from":"09:00","to":"20:00"},"sun":{"enabled":false,"from":"09:00","to":"20:00"}}'::jsonb,
    '{}'::jsonb,
    now()
);

-- Записи «Сам запишусь»
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "car" TEXT,
    "services" TEXT[] NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_scheduledAt_idx" ON "Booking"("scheduledAt");
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- Telegram-сообщения записей (по одному на мастера)
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingMessage_chatId_messageId_key" ON "BookingMessage"("chatId", "messageId");
CREATE INDEX "BookingMessage_bookingId_idx" ON "BookingMessage"("bookingId");

ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
