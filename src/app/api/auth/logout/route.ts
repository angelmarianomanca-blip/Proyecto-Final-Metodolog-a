import { apiHandler } from '@/lib/api/handler';
import { clearSessionCookie } from '@/lib/auth/session';

export const POST = apiHandler(
  async () => {
    await clearSessionCookie();
    return { mensaje: 'Sesión cerrada correctamente.' };
  },
  { requireAuth: true }
);
