-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "customer_id" INTEGER,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_public_id_key" ON "projects"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_user_id_key" ON "projects"("name", "user_id");

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "project_id" INTEGER;

-- CreateIndex
CREATE INDEX "transactions_project_id_idx" ON "transactions"("project_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
