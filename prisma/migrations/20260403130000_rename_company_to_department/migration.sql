-- Rename companies table to departments
ALTER TABLE "companies" RENAME TO "departments";

-- Rename company_id columns to department_id
ALTER TABLE "transactions" RENAME COLUMN "company_id" TO "department_id";
ALTER TABLE "merchants" RENAME COLUMN "company_id" TO "department_id";
ALTER TABLE "employees" RENAME COLUMN "company_id" TO "department_id";

-- Add department_id to tables that didn't have company_id
ALTER TABLE "categories" ADD COLUMN "department_id" INTEGER;
ALTER TABLE "customers" ADD COLUMN "department_id" INTEGER;
ALTER TABLE "projects" ADD COLUMN "department_id" INTEGER;
ALTER TABLE "products" ADD COLUMN "department_id" INTEGER;

-- Add foreign key constraints for new department_id columns
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename existing foreign key constraints
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_company_id_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "merchants" DROP CONSTRAINT IF EXISTS "merchants_company_id_fkey";
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_company_id_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename indexes
DROP INDEX IF EXISTS "transactions_company_id_idx";
CREATE INDEX "transactions_department_id_idx" ON "transactions"("department_id");

CREATE INDEX "categories_department_id_idx" ON "categories"("department_id");

-- Update unique constraints for categories
DROP INDEX IF EXISTS "categories_name_type_key";
CREATE UNIQUE INDEX "categories_name_type_department_id_key" ON "categories"("name", "type", "department_id");

-- Partial unique index for global categories (NULL department_id)
CREATE UNIQUE INDEX "categories_name_type_global_unique" ON "categories"("name", "type") WHERE "department_id" IS NULL;

-- Update unique constraint for employees (was name + company_id, now name + department_id)
DROP INDEX IF EXISTS "employees_name_company_id_key";
CREATE UNIQUE INDEX "employees_name_department_id_key" ON "employees"("name", "department_id");
