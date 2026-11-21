import { apiHandler } from '@/lib/api/handler';
import { actualizarPerfil } from '@/services/auth';

export const PATCH = apiHandler(
  async ({ user, json }) => {
    const body = await json();
    const updated = await actualizarPerfil(user, body);
    return { user: updated };
  },
  { requireAuth: true }
);
