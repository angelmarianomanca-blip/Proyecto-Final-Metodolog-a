import { apiHandler } from '@/lib/api/handler';
import { editarInformacionInstitucional } from '@/services/institucional';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    editarInformacionInstitucional(user, params.id, await json()),
  { requireAuth: true }
);
