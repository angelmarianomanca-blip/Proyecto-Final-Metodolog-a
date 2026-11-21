import { apiHandler } from '@/lib/api/handler';
import { valorarInteraccionIa } from '@/services/ia';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    valorarInteraccionIa(user, params.id, await json()),
  { requireAuth: true }
);
