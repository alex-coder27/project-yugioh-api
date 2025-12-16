/*
  Warnings:

  - The primary key for the `deckcard` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `deckcard` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `deckcard` DROP FOREIGN KEY `DeckCard_deckId_fkey`;

-- DropIndex
DROP INDEX `DeckCard_deckId_cardApiId_isExtraDeck_key` ON `deckcard`;

-- AlterTable
ALTER TABLE `deckcard` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ALTER COLUMN `updatedAt` DROP DEFAULT,
    ADD PRIMARY KEY (`deckId`, `cardApiId`, `isExtraDeck`);

-- AddForeignKey
ALTER TABLE `DeckCard` ADD CONSTRAINT `DeckCard_deckId_fkey` FOREIGN KEY (`deckId`) REFERENCES `Deck`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
