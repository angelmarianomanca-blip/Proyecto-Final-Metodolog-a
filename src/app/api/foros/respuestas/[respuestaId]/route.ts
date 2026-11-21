import { apiHandler } from '@/lib/api/handler';
import { eliminarRespuestaForo } from '@/services/foros';

export const DELETE = apiHandler<{ respuestaId: string }>(
  async ({ user, params }) => eliminarRespuestaForo(user, params.respuestaId),
  { requireAuth: true }
);
