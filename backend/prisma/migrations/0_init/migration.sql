-- Homepay initial schema — generated from prisma/schema.prisma via
-- `npx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script`
-- Paste this whole file into Hostinger's phpMyAdmin "SQL" tab to create all tables.

-- CreateTable
CREATE TABLE `Household` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'editor', 'helper') NOT NULL,
    `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Member_phone_key`(`phone`),
    INDEX `Member_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractTerms` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `helperName` VARCHAR(191) NOT NULL,
    `employerName` VARCHAR(191) NOT NULL,
    `basicSalary` DECIMAL(10, 2) NOT NULL,
    `restDayRateOverride` DECIMAL(10, 2) NULL,
    `contractStart` DATE NOT NULL,
    `contractLengthMonths` INTEGER NOT NULL DEFAULT 24,
    `agreedRestDaysPerMonth` INTEGER NOT NULL DEFAULT 1,
    `homeLeaveAllowanceDays` INTEGER NOT NULL DEFAULT 15,
    `payDayWorkingDayN` INTEGER NOT NULL DEFAULT 2,
    `unpaidHome` BOOLEAN NOT NULL DEFAULT false,
    `unpaidExtraDayOff` BOOLEAN NOT NULL DEFAULT true,
    `unpaidSick` BOOLEAN NOT NULL DEFAULT false,
    `unpaidOther` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContractTerms_householdId_key`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayField` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `PayField_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    INDEX `Holiday_householdId_idx`(`householdId`),
    UNIQUE INDEX `Holiday_householdId_date_key`(`householdId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Month` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `yyyymm` VARCHAR(191) NOT NULL,
    `restDaysTaken` INTEGER NULL,
    `sundaysDuringLeaveOverride` INTEGER NULL,
    `unpaidLeaveDaysOverride` INTEGER NULL,
    `paidOn` DATE NULL,
    `fieldValues` JSON NULL,
    `signed` BOOLEAN NOT NULL DEFAULT false,
    `tallyInPerson` BOOLEAN NOT NULL DEFAULT false,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `paidById` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `netSnapshot` DECIMAL(10, 2) NULL,
    `lastById` VARCHAR(191) NULL,
    `lastAt` DATETIME(3) NULL,
    `resetAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Month_householdId_idx`(`householdId`),
    UNIQUE INDEX `Month_householdId_yyyymm_key`(`householdId`, `yyyymm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentLine` (
    `id` VARCHAR(191) NOT NULL,
    `monthId` VARCHAR(191) NOT NULL,
    `method` ENUM('cash', 'bank', 'mother_account', 'other') NOT NULL,
    `amount` DECIMAL(10, 2) NULL,

    INDEX `PaymentLine_monthId_idx`(`monthId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `type` ENUM('home', 'extra_day_off', 'sick', 'other') NOT NULL,
    `fromDate` DATE NOT NULL,
    `toDate` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'declined', 'cancelled') NOT NULL DEFAULT 'pending',
    `cancelled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeaveRequest_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveDecision` (
    `id` VARCHAR(191) NOT NULL,
    `leaveRequestId` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'declined', 'cancelled') NOT NULL,
    `decidedById` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `snapshotFrom` DATE NOT NULL,
    `snapshotTo` DATE NOT NULL,
    `decidedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LeaveDecision_leaveRequestId_key`(`leaveRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tally` (
    `id` VARCHAR(191) NOT NULL,
    `monthId` VARCHAR(191) NOT NULL,
    `helperId` VARCHAR(191) NOT NULL,
    `helperResponse` ENUM('agree', 'disagree') NULL,
    `helperOff` INTEGER NULL,
    `employerOff` INTEGER NULL,
    `employerLeaveSundays` INTEGER NULL,
    `comment` VARCHAR(191) NULL,
    `respondedAt` DATETIME(3) NULL,
    `invalidated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Tally_monthId_key`(`monthId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `byId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NULL,
    `changes` JSON NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_householdId_idx`(`householdId`),
    INDEX `ActivityLog_at_idx`(`at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractTerms` ADD CONSTRAINT `ContractTerms_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayField` ADD CONSTRAINT `PayField_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Holiday` ADD CONSTRAINT `Holiday_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Month` ADD CONSTRAINT `Month_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentLine` ADD CONSTRAINT `PaymentLine_monthId_fkey` FOREIGN KEY (`monthId`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDecision` ADD CONSTRAINT `LeaveDecision_leaveRequestId_fkey` FOREIGN KEY (`leaveRequestId`) REFERENCES `LeaveRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDecision` ADD CONSTRAINT `LeaveDecision_decidedById_fkey` FOREIGN KEY (`decidedById`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tally` ADD CONSTRAINT `Tally_monthId_fkey` FOREIGN KEY (`monthId`) REFERENCES `Month`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tally` ADD CONSTRAINT `Tally_helperId_fkey` FOREIGN KEY (`helperId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_byId_fkey` FOREIGN KEY (`byId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
