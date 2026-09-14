import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Locally the connection strings live in .env.local; hosted environments provide them directly.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DIRECT_DATABASE_URL;
if (!url) throw new Error("DIRECT_DATABASE_URL is not set");

// Migrations use the direct connection, never the transaction pooler.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
