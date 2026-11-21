import { apiHandler } from '@/lib/api/handler';
import { obtenerDatosTablero } from '@/services/tablero';

export const GET = apiHandler(
  async ({ user, searchParams }) => {
    const dias = Number(searchParams.get('dias') ?? 7);
    return obtenerDatosTablero(user, dias);
  },
  { requireAuth: true }
);
