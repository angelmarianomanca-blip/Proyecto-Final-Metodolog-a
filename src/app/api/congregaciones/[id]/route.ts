import { apiHandler } from '@/lib/api/handler';
import { editarCongregacion } from '@/services/congregaciones';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    editarCongregacion(user, params.id, await json()),
  { requireAuth: true }
);
