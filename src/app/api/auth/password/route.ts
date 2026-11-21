import { apiHandler } from '@/lib/api/handler';
import { cambiarPassword } from '@/services/auth';

export const PUT = apiHandler(
  async ({ user, json }) => {
    const body = await json();
    return cambiarPassword(user, body);
  },
  { requireAuth: true }
);
