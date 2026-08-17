import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./services/schema.ts",
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_DATABASE_URL,
  }
});