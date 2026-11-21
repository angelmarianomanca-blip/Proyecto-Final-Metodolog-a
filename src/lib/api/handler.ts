import { NextRequest, NextResponse } from 'next/server';
import { ApiError, isApiError } from '@/lib/errors';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export interface ApiContext<TParams = Record<string, string>> {
  req: NextRequest;
  user: SessionUser | null;
  params: TParams;
  searchParams: URLSearchParams;
  json: <T = unknown>() => Promise<T>;
}

interface HandlerOptions {
  requireAuth?: boolean;
  status?: number;
}

export function apiHandler<TParams = Record<string, string>>(
  fn: (ctx: ApiContext<TParams>) => Promise<unknown>,
  options: HandlerOptions = {}
) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<TParams> }
  ): Promise<NextResponse> => {
    try {
      const user = await getSessionUser();
      if (options.requireAuth && !user) {
        throw new ApiError(
          401,
          'NO_AUTENTICADO',
          'Debés iniciar sesión para realizar esta operación.'
        );
      }
      const params = routeCtx?.params ? await routeCtx.params : ({} as TParams);
      const searchParams = req.nextUrl.searchParams;

      const json = async <T = unknown>(): Promise<T> => {
        try {
          return (await req.json()) as T;
        } catch {
          throw new ApiError(
            400,
            'JSON_INVALIDO',
            'El cuerpo de la solicitud no es un JSON válido.'
          );
        }
      };

      const result = await fn({ req, user, params, searchParams, json });

      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result, { status: options.status ?? 200 });
    } catch (err) {
      if (isApiError(err)) {
        return NextResponse.json(err.toJSON(), { status: err.status });
      }
      console.error('[API ERROR]', err);
      const internal = new ApiError(
        500,
        'ERROR_INTERNO',
        'Ocurrió un error interno inesperado.'
      );
      return NextResponse.json(internal.toJSON(), { status: 500 });
    }
  };
}
