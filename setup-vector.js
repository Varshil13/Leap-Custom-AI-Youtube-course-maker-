import { neon } from '@neondatabase/serverless';
import "dotenv/config";

async function setup() {
  console.log("Setting up pgvector extension...");
  const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL);
  
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("pgvector extension created successfully.");
  } catch (err) {
    console.error("Failed to create pgvector extension:", err);
  }
}

setup();
