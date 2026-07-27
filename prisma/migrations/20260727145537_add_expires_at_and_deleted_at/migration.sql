-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3);
