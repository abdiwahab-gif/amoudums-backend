import { AuthService } from '@/services/auth.service';
import { query } from '@/database/connection';

type SeedResult = {
  created: boolean;
  skipped: boolean;
  reason?: string;
};

export async function ensureInitialAdminUser(): Promise<SeedResult> {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    return { created: false, skipped: true, reason: 'INITIAL_ADMIN_EMAIL/PASSWORD not set' };
  }

  const firstName = (process.env.INITIAL_ADMIN_FIRST_NAME || 'Admin').trim() || 'Admin';
  const lastName = (process.env.INITIAL_ADMIN_LAST_NAME || 'User').trim() || 'User';

  const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length > 0) {
    return { created: false, skipped: true, reason: 'User already exists' };
  }

  await AuthService.registerUser(email, password, firstName, lastName, 'admin');
  return { created: true, skipped: false };
}
