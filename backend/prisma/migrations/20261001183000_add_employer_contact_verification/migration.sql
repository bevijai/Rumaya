-- AlterTable
ALTER TABLE `Member`
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Member_email_key` ON `Member`(`email`);