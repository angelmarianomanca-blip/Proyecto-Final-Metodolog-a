import { apiHandler } from '@/lib/api/handler';
import { obtenerInscripcionDetalle } from '@/services/inscripciones';

export const GET = apiHandler<{ id: string }>(
  async ({ user, params }) => obtenerInscripcionDetalle(user, params.id),
  { requireAuth: true }
);
