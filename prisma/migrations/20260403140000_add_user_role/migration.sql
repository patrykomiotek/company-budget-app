-- Add role field to users
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
