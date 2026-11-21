import { apiHandler } from '@/lib/api/handler';
import { resetPasswordUsuarioAdmin } from '@/services/usuarios';

export const POST = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    resetPasswordUsuarioAdmin(user, params.id, await json()),
  { requireAuth: true }
);
