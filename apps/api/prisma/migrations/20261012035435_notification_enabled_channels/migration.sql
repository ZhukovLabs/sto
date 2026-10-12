-- AlterTable
ALTER TABLE "NotificationSettings" ADD COLUMN     "enabledChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
