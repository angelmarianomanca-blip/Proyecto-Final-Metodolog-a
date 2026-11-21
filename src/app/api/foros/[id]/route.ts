import { apiHandler } from '@/lib/api/handler';
import {
  editarConsultaForo,
  eliminarConsultaForo,
  obtenerConsultaForoDetalle,
} from '@/services/foros';

export const GET = apiHandler<{ id: string }>(
  async ({ user, params }) => obtenerConsultaForoDetalle(user, params.id),
  { requireAuth: true }
);

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    editarConsultaForo(user, params.id, await json()),
  { requireAuth: true }
);

export const DELETE = apiHandler<{ id: string }>(
  async ({ user, params }) => eliminarConsultaForo(user, params.id),
  { requireAuth: true }
);
