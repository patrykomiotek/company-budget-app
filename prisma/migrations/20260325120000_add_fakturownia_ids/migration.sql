-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "fakturownia_client_id" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "fakturownia_product_id" INTEGER;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "fakturownia_invoice_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "customers_fakturownia_client_id_key" ON "customers"("fakturownia_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_fakturownia_product_id_key" ON "products"("fakturownia_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_fakturownia_invoice_id_key" ON "transactions"("fakturownia_invoice_id");
