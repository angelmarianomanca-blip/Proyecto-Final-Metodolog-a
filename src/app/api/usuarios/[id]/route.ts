import { apiHandler } from '@/lib/api/handler';
import { editarUsuarioAdmin } from '@/services/usuarios';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    editarUsuarioAdmin(user, params.id, await json()),
  { requireAuth: true }
);
