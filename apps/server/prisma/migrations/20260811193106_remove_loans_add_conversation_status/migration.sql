/*
  Warnings:

  - You are about to drop the `Loan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookId` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_borrowerId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_lenderId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "bookId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- DropTable
DROP TABLE "Loan";

-- CreateIndex
CREATE INDEX "Conversation_bookId_idx" ON "Conversation"("bookId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
