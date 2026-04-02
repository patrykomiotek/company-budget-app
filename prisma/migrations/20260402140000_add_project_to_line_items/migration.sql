-- AlterTable
ALTER TABLE "transaction_line_items" ADD COLUMN "project_id" INTEGER;

-- CreateIndex
CREATE INDEX "transaction_line_items_project_id_idx" ON "transaction_line_items"("project_id");

-- AddForeignKey
ALTER TABLE "transaction_line_items" ADD CONSTRAINT "transaction_line_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
