import { ApiError } from '@/lib/errors';
import type { SessionUser } from '@/lib/auth/session';
import type { RolNombre } from '@/lib/constants';

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new ApiError(
      401,
      'NO_AUTENTICADO',
      'Debés iniciar sesión para realizar esta operación.'
    );
  }
  return user;
}

export function requireRoles(
  user: SessionUser | null,
  allowed: readonly RolNombre[]
): SessionUser {
  const authed = requireAuth(user);
  if (!allowed.includes(authed.rol)) {
    throw new ApiError(
      403,
      'SIN_PERMISO',
      'No tenés permisos suficientes para realizar esta operación.'
    );
  }
  return authed;
}

export function nowIso(): string {
  return new Date().toISOString();
}
