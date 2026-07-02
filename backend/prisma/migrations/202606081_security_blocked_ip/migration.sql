CREATE TABLE IF NOT EXISTS `BlockedIp` (
  `id` VARCHAR(191) NOT NULL,
  `ip` VARCHAR(191) NOT NULL,
  `reason` TEXT NULL,
  `blockedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `BlockedIp_ip_key` (`ip`),
  INDEX `BlockedIp_createdAt_idx` (`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
