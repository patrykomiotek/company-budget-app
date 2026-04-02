-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "public_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "invoice_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false;
