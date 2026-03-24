-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PRODUCT', 'SERVICE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SERVICE';
