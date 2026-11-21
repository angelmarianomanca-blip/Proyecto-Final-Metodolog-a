import { apiHandler } from '@/lib/api/handler';
import { registrarUsuario } from '@/services/auth';

export const POST = apiHandler(
  async ({ json }) => {
    const body = await json();
    const user = await registrarUsuario(body);
    return { user };
  },
  { status: 201 }
);
