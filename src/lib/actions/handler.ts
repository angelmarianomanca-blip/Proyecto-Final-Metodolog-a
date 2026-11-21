import { isApiError, type ErrorCode, type ErrorDetail } from '@/lib/errors';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: ErrorCode;
        message: string;
        details?: ErrorDetail[];
      };
    };

export async function actionHandler<T>(
  fn: (user: SessionUser | null) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const user = await getSessionUser();
    const data = await fn(user);
    return { ok: true, data };
  } catch (err) {
    if (isApiError(err)) {
      return {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }
    console.error('[ACTION ERROR]', err);
    return {
      ok: false,
      error: {
        code: 'ERROR_INTERNO',
        message: 'Ocurrió un error interno inesperado.',
      },
    };
  }
}
