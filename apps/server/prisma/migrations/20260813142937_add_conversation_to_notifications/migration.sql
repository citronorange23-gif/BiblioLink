/*
  Warnings:

  - Made the column `conversationId` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "conversationId" SET NOT NULL;
