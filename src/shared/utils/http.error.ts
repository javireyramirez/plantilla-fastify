import { Prisma } from '@prisma/client';

import { Response } from 'express';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
  }

  static fromPrisma(error: any): HttpError {
    switch (error.code) {
      case 'P2002':
        return new HttpError(409, 'Conflicto en la BD', 'CONFLICT', error.meta);

      case 'P2025':
        return new HttpError(404, 'Registro no encontrado en la BD', 'NOT_FOUND', error.meta);

      case 'P2003':
        return new HttpError(400, 'Datos recibidos erroneos', 'BAD_REQUEST', error.meta);

      case 'P2022':
        return new HttpError(500, 'Error en la base de datos', 'INTERNAL_SERVER_ERROR', error.meta);

      default:
        return new HttpError(500, 'Error inexperado', 'INTERNAL_SERVER_ERROR', error.meta);
    }
  }
  static fromS3(error: any): HttpError {
    const errorCode = error.name || error.code;

    switch (errorCode) {
      case 'NoSuchBucket':
        return new HttpError(
          500,
          'Configuración de almacenamiento inválida',
          'STORAGE_CONFIG_ERROR',
          error.message,
        );
      case 'AccessDenied':
        return new HttpError(
          403,
          'No hay permisos para escribir en el storage',
          'STORAGE_FORBIDDEN',
          error.message,
        );
      case 'NoSuchKey':
        return new HttpError(404, 'El documento no existe en R2', 'FILE_NOT_FOUND', error.message);
      case 'EntityTooLarge':
        return new HttpError(
          413,
          'El archivo es demasiado grande',
          'FILE_TOO_LARGE',
          error.message,
        );
      default:
        return new HttpError(
          error.$metadata?.httpStatusCode || 500,
          'Error en el servicio de documentos',
          'STORAGE_ERROR',
          error.message,
        );
    }
  }

  static handleError(error: any): HttpError {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return HttpError.fromPrisma(error);
    }
    if (error instanceof HttpError) {
      return error;
    }
    if (error.$metadata) {
      return HttpError.fromS3(error);
    }

    return new HttpError(500, 'Error interno', 'INTERNAL_SERVER_ERROR', error);
  }

  static handleErrorReply(err: unknown, reply: Response): Response {
    return err instanceof HttpError
      ? reply
          .status(err.statusCode)
          .send({ message: err.message, code: err.code, details: err.details })
      : reply.status(500).send({ message: 'Unexpected error', details: err });
  }
}
