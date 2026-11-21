import { apiHandler } from '@/lib/api/handler';
import {
  inscribirEnCurso,
  listarMisInscripciones,
} from '@/services/inscripciones';

export const GET = apiHandler(
  async ({ user }) => listarMisInscripciones(user),
  { requireAuth: true }
);

export const POST = apiHandler(
  async ({ user, json }) => inscribirEnCurso(user, await json()),
  { requireAuth: true, status: 201 }
);
