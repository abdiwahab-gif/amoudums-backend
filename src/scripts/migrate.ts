import dotenv from 'dotenv';
import { initializeTables } from '@/database/schema';
import { addSecurityEnhancements } from '@/database/security-migrations';

dotenv.config();

async function run(): Promise<void> {
  console.log('Running database migrations...');

  console.log('1/2 Initializing base tables...');
  await initializeTables();

  console.log('2/2 Applying security enhancements...');
  await addSecurityEnhancements();

  console.log('✓ Migrations complete');
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
