-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'public',
ALTER COLUMN "condition" SET DEFAULT 'Français';

-- CreateIndex
CREATE INDEX "Book_visibility_idx" ON "Book"("visibility");
