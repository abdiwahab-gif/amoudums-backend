import dotenv from 'dotenv';
import { initializeTables } from '@/database/schema';
import { addSecurityEnhancements } from '@/database/security-migrations';
import { ensureInitialAdminUser } from '@/database/seed';

dotenv.config();

async function run(): Promise<void> {
  console.log('Seeding database...');

  console.log('1/3 Initializing base tables...');
  await initializeTables();

  console.log('2/3 Applying security enhancements...');
  await addSecurityEnhancements();

  console.log('3/3 Ensuring initial admin user (if configured)...');
  const result = await ensureInitialAdminUser();

  if (result.created) {
    console.log('✓ Initial admin user created');
  } else {
    console.log(`↷ Skipped initial admin user: ${result.reason || 'unknown'}`);
  }

  console.log('✓ Seed complete');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
