import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cvehunter',
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  
  await migrate(db, {
    migrationsFolder: join(__dirname, 'migrations'),
  });

  console.log('Migrations completed!');
  
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
}); 