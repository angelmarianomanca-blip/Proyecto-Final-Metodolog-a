import { apiHandler } from '@/lib/api/handler';

export const GET = apiHandler(
  async ({ user }) => ({ user }),
  { requireAuth: true }
);
