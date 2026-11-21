export type ErrorCode =
  | 'JSON_INVALIDO'
  | 'NO_AUTENTICADO'
  | 'CREDENCIALES_INVALIDAS'
  | 'SIN_PERMISO'
  | 'NO_ENCONTRADO'
  | 'EMAIL_DUPLICADO'
  | 'NOMBRE_DUPLICADO'
  | 'YA_INSCRIPTO'
  | 'CONSULTA_CON_RESPUESTAS'
  | 'CONGREGACION_EN_USO'
  | 'VALIDACION'
  | 'CURSO_NO_PUBLICADO'
  | 'CURSO_NO_FINALIZADO'
  | 'FORO_CERRADO'
  | 'TOKEN_INVALIDO_O_EXPIRADO'
  | 'CONTRASENA_ACTUAL_INCORRECTA'
  | 'OPERACION_SOBRE_SI_MISMO'
  | 'ERROR_INTERNO';

export interface ErrorDetail {
  campo: string;
  mensaje: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && this.details.length > 0
          ? { details: this.details }
          : {}),
      },
    };
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
