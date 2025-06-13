import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgregoat:Strongpassword@localhost:5432/cvehunter',
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema }); 