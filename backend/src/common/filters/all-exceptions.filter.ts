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
};

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

      if (typeof body === 'object' && body !== null && 'fields' in body) {
        const typedBody = body as {
          message: string;
          fields: Record<string, string[]> | null;
        };
        message = typedBody.message;
        fields = typedBody.fields;
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
      status = 500;
      message = 'Wystąpił błąd serwera';
    }

    const code = ERROR_CODES[status] ?? 'INTERNAL_ERROR';

    const errorBody: ErrorResponse = { code, message, fields };
    response.status(status).json(errorBody);
  }
}
