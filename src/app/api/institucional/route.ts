import { apiHandler } from '@/lib/api/handler';
import {
  crearInformacionInstitucional,
  listarInformacionInstitucional,
} from '@/services/institucional';

export const GET = apiHandler(async () => listarInformacionInstitucional());

export const POST = apiHandler(
  async ({ user, json }) => crearInformacionInstitucional(user, await json()),
  { requireAuth: true, status: 201 }
);
