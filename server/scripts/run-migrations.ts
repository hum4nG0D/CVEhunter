import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, 'migrations', '0002_add_search_history_constraint.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    await db.execute(sql.raw(migration));
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations(); 