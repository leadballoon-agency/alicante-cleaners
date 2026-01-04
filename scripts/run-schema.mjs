import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = neon(process.env.DATABASE_URL);

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

// Remove comments and split by semicolons
const cleanedSchema = schema
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n');

const statements = cleanedSchema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Running ${statements.length} statements...`);

let success = 0;
let failed = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    await sql.unsafe(stmt);
    success++;
    process.stdout.write('.');
  } catch (err) {
    failed++;
    console.error(`\n✗ Statement ${i + 1} failed:`, err.message);
    console.error(`  SQL: ${stmt.substring(0, 80)}...`);
  }
}

console.log(`\n\nDone! ${success} succeeded, ${failed} failed`);
