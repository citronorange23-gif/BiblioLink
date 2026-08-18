-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "deletedByAAt" TIMESTAMP(3),
ADD COLUMN     "deletedByBAt" TIMESTAMP(3);
