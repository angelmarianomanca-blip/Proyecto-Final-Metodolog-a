import { apiHandler } from '@/lib/api/handler';
import { listarMisInteraccionesIa } from '@/services/ia';

export const GET = apiHandler(
  async ({ user }) => listarMisInteraccionesIa(user),
  { requireAuth: true }
);
