CREATE TYPE "public"."product_status" AS ENUM('pantry', 'shopping_list', 'in_cart');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" "product_status" DEFAULT 'pantry' NOT NULL;