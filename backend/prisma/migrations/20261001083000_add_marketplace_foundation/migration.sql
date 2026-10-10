-- DropForeignKey
ALTER TABLE `Member` DROP FOREIGN KEY `Member_householdId_fkey`;

-- AlterTable
ALTER TABLE `Member` ADD COLUMN `platformRole` ENUM('user', 'validator', 'admin') NOT NULL DEFAULT 'user',
    MODIFY `householdId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('owner', 'editor', 'helper') NULL;

-- CreateTable
CREATE TABLE `Agency` (
    `id` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `licenceNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('invited', 'pending', 'active', 'suspended', 'rejected') NOT NULL DEFAULT 'invited',
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `licenceVerifiedAt` DATETIME(3) NULL,
    `licenceExpiresAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agency_licenceNumber_key`(`licenceNumber`),
    INDEX `Agency_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgencyMembership` (
    `id` VARCHAR(191) NOT NULL,
    `agencyId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'manager', 'recruiter') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgencyMembership_memberId_idx`(`memberId`),
    UNIQUE INDEX `AgencyMembership_agencyId_memberId_key`(`agencyId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HelperProfile` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `sourceCountry` ENUM('indonesia', 'philippines', 'myanmar') NOT NULL,
    `locationType` ENUM('overseas', 'singapore_transfer') NOT NULL,
    `status` ENUM('draft', 'pending_validation', 'changes_requested', 'published', 'hidden', 'suspended', 'rejected', 'placed') NOT NULL DEFAULT 'draft',
    `bio` TEXT NULL,
    `languages` JSON NOT NULL,
    `yearsExperience` INTEGER NOT NULL DEFAULT 0,
    `availableFrom` DATE NULL,
    `expectedSalary` DECIMAL(10, 2) NULL,
    `introductionType` ENUM('video', 'audio', 'assisted') NULL,
    `introductionStorageKey` VARCHAR(191) NULL,
    `introductionVerifiedAt` DATETIME(3) NULL,
    `lastAvailabilityConfirmedAt` DATETIME(3) NULL,
    `availabilityDueAt` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HelperProfile_memberId_key`(`memberId`),
    INDEX `HelperProfile_status_sourceCountry_locationType_idx`(`status`, `sourceCountry`, `locationType`),
    INDEX `HelperProfile_availabilityDueAt_idx`(`availabilityDueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HelperSkill` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `type` ENUM('infant_care', 'childcare', 'eldercare', 'disability_care', 'cooking', 'pet_care', 'housekeeping', 'other') NOT NULL,
    `proficiency` ENUM('basic', 'intermediate', 'advanced') NOT NULL,
    `yearsExperience` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `HelperSkill_helperProfileId_type_key`(`helperProfileId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfileDocument` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `type` ENUM('passport', 'identity', 'employment_record', 'training_certificate', 'reference', 'other') NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    `expiresAt` DATE NULL,
    `verifiedById` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProfileDocument_helperProfileId_type_idx`(`helperProfileId`, `type`),
    INDEX `ProfileDocument_status_expiresAt_idx`(`status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfileValidation` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `outcome` ENUM('passed', 'failed', 'needs_changes') NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProfileValidation_helperProfileId_completedAt_idx`(`helperProfileId`, `completedAt`),
    INDEX `ProfileValidation_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfileScore` (
    `id` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `identityPoints` INTEGER NOT NULL,
    `skillsPoints` INTEGER NOT NULL,
    `referencesPoints` INTEGER NOT NULL,
    `readinessPoints` INTEGER NOT NULL,
    `completenessPoints` INTEGER NOT NULL,
    `totalPoints` INTEGER NOT NULL,
    `evidence` JSON NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `manualAdjustmentReason` TEXT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,

    INDEX `ProfileScore_helperProfileId_calculatedAt_idx`(`helperProfileId`, `calculatedAt`),
    UNIQUE INDEX `ProfileScore_helperProfileId_version_key`(`helperProfileId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgencyRepresentation` (
    `id` VARCHAR(191) NOT NULL,
    `agencyId` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'accepted', 'declined', 'ended', 'disputed') NOT NULL DEFAULT 'pending',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `endReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgencyRepresentation_helperProfileId_status_idx`(`helperProfileId`, `status`),
    INDEX `AgencyRepresentation_agencyId_status_idx`(`agencyId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployerRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `generalLocation` VARCHAR(191) NULL,
    `householdComposition` JSON NOT NULL,
    `requiredSkills` JSON NOT NULL,
    `preferredLanguages` JSON NOT NULL,
    `preferredLocationType` ENUM('overseas', 'singapore_transfer') NULL,
    `preferredStartDate` DATE NULL,
    `minimumSalary` DECIMAL(10, 2) NULL,
    `maximumSalary` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployerRequirement_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketplaceInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `employerId` VARCHAR(191) NOT NULL,
    `helperProfileId` VARCHAR(191) NOT NULL,
    `agencyId` VARCHAR(191) NOT NULL,
    `status` ENUM('submitted', 'accepted', 'declined', 'clarification_requested', 'interviewing', 'held', 'placement_confirmed', 'cancelled') NOT NULL DEFAULT 'submitted',
    `requirementSnapshot` JSON NOT NULL,
    `employerMessage` TEXT NULL,
    `agencyResponse` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MarketplaceInquiry_employerId_submittedAt_idx`(`employerId`, `submittedAt`),
    INDEX `MarketplaceInquiry_agencyId_status_idx`(`agencyId`, `status`),
    INDEX `MarketplaceInquiry_helperProfileId_status_idx`(`helperProfileId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketplaceConsent` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `type` ENUM('data_processing', 'profile_publication', 'agency_representation', 'interview', 'recording') NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `context` JSON NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    INDEX `MarketplaceConsent_memberId_type_grantedAt_idx`(`memberId`, `type`, `grantedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketplaceAuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `changes` JSON NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MarketplaceAuditEvent_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    INDEX `MarketplaceAuditEvent_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyMembership` ADD CONSTRAINT `AgencyMembership_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyMembership` ADD CONSTRAINT `AgencyMembership_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelperProfile` ADD CONSTRAINT `HelperProfile_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelperProfile` ADD CONSTRAINT `HelperProfile_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HelperSkill` ADD CONSTRAINT `HelperSkill_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileDocument` ADD CONSTRAINT `ProfileDocument_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileDocument` ADD CONSTRAINT `ProfileDocument_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileValidation` ADD CONSTRAINT `ProfileValidation_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileValidation` ADD CONSTRAINT `ProfileValidation_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileScore` ADD CONSTRAINT `ProfileScore_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfileScore` ADD CONSTRAINT `ProfileScore_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyRepresentation` ADD CONSTRAINT `AgencyRepresentation_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgencyRepresentation` ADD CONSTRAINT `AgencyRepresentation_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployerRequirement` ADD CONSTRAINT `EmployerRequirement_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceInquiry` ADD CONSTRAINT `MarketplaceInquiry_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceInquiry` ADD CONSTRAINT `MarketplaceInquiry_helperProfileId_fkey` FOREIGN KEY (`helperProfileId`) REFERENCES `HelperProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceInquiry` ADD CONSTRAINT `MarketplaceInquiry_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceConsent` ADD CONSTRAINT `MarketplaceConsent_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketplaceAuditEvent` ADD CONSTRAINT `MarketplaceAuditEvent_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;