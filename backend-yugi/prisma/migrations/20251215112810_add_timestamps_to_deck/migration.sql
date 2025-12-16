/*
  Warnings:

  - The primary key for the `deckcard` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `cardApiId` on the `deckcard` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `deck` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `deckcard` DROP PRIMARY KEY,
    MODIFY `cardApiId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`deckId`, `cardApiId`);
