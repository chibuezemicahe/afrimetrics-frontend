-- CreateTable
CREATE TABLE `Stock` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `percentChange` DOUBLE NULL,
    `volume` INTEGER NOT NULL,
    `value` DOUBLE NOT NULL,
    `trades` INTEGER NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `market` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Stock_symbol_market_key`(`symbol`, `market`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockHistory` (
    `id` VARCHAR(191) NOT NULL,
    `stockId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `price` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `percentChange` DOUBLE NULL,
    `volume` INTEGER NOT NULL,
    `value` DOUBLE NOT NULL,
    `trades` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `sector` VARCHAR(191) NULL,

    INDEX `StockHistory_stockId_idx`(`stockId`),
    INDEX `StockHistory_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketIndex` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `value` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `percentChange` DOUBLE NOT NULL,
    `market` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sector` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,

    UNIQUE INDEX `MarketIndex_symbol_market_key`(`symbol`, `market`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketIndexHistory` (
    `id` VARCHAR(191) NOT NULL,
    `indexId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `value` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `percentChange` DOUBLE NOT NULL,
    `sector` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `MarketIndexHistory_indexId_idx`(`indexId`),
    INDEX `MarketIndexHistory_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StockHistory` ADD CONSTRAINT `StockHistory_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketIndexHistory` ADD CONSTRAINT `MarketIndexHistory_indexId_fkey` FOREIGN KEY (`indexId`) REFERENCES `MarketIndex`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

