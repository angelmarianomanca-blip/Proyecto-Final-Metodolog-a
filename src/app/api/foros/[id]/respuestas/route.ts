import { apiHandler } from '@/lib/api/handler';
import { crearRespuestaForo } from '@/services/foros';

export const POST = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    crearRespuestaForo(user, params.id, await json()),
  { requireAuth: true, status: 201 }
);
