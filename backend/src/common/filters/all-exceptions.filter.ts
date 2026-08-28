import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from './error-response.interface';

const ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

const GENERIC_MESSAGE = 'Wystąpił błąd serwera';

/**
 * Reads the human-readable message out of an exception body. Returns null when
 * the body carries none, because `exception.message` is then Nest's mangled
 * class name ('Service Unavailable Exception'), which must not reach a client.
 */
function readMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    return body;
  }

  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null;
  }

  const raw = body.message;

  if (typeof raw === 'string') {
    return raw;
  }

  if (Array.isArray(raw)) {
    const texts = raw.filter(
      (item): item is string => typeof item === 'string',
    );
    return texts.length > 0 ? texts.join(', ') : null;
  }

  return null;
}

function readFields(body: unknown): Record<string, string[]> | null {
  if (typeof body !== 'object' || body === null || !('fields' in body)) {
    return null;
  }

  return (body as { fields: Record<string, string[]> | null }).fields;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number;
    let message: string;
    let fields: Record<string, string[]> | null = null;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      status = exception.getStatus();
      fields = readFields(body);
      message = readMessage(body) ?? GENERIC_MESSAGE;
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
      status = 500;
      message = GENERIC_MESSAGE;
    }

    const code = ERROR_CODES[status] ?? 'INTERNAL_ERROR';

    const errorBody: ErrorResponse = { code, message, fields };
    response.status(status).json(errorBody);
  }
}
