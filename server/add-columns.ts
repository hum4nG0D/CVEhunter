import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cvehunter',
  });

  try {
    console.log('Adding new columns...');
    
    await pool.query(`
      ALTER TABLE cve_records 
      ADD COLUMN IF NOT EXISTS threat_intelligence TEXT,
      ADD COLUMN IF NOT EXISTS threat_context TEXT;
    `);

    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Failed to add columns:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error); 