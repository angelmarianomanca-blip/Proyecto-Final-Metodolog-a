import { apiHandler } from '@/lib/api/handler';
import {
  editarEntradaSoporte,
  eliminarEntradaSoporte,
} from '@/services/soporte';

export const PATCH = apiHandler<{ id: string }>(
  async ({ user, params, json }) =>
    editarEntradaSoporte(user, params.id, await json()),
  { requireAuth: true }
);

export const DELETE = apiHandler<{ id: string }>(
  async ({ user, params }) => eliminarEntradaSoporte(user, params.id),
  { requireAuth: true }
);
