import { apiHandler } from '@/lib/api/handler';
import {
  crearCongregacion,
  listarCongregaciones,
} from '@/services/congregaciones';

export const GET = apiHandler(async ({ user }) => listarCongregaciones(user));

export const POST = apiHandler(
  async ({ user, json }) => crearCongregacion(user, await json()),
  { requireAuth: true, status: 201 }
);
