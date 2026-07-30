import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit corre como processo standalone (fora do Next.js), por isso não
// beneficia do carregamento automático de .env.local que o Next faz — tem de
// ser explícito aqui.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
