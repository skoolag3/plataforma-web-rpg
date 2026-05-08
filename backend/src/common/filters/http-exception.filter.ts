import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type ErrorDetail = {
  field?: string;
  messages: string[];
};

type ErrorResponseBody = {
  message?: string | string[];
  error?: string;
  details?: ErrorDetail[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();
    const error = this.normalizeError(exception);

    response.status(error.statusCode).json({
      statusCode: error.statusCode,
      error: error.error,
      message: error.message,
      details: error.details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeError(exception: unknown) {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const parsedBody = this.parseResponseBody(body);

      return {
        statusCode,
        error: parsedBody.error ?? exception.name,
        message: this.normalizeMessage(parsedBody.message, exception.message),
        details: parsedBody.details ?? [],
      };
    }

    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002'
    ) {
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Registro duplicado.',
        details: [
          {
            field: this.getPrismaTarget(exception),
            messages: ['Ja existe um registro com este valor.'],
          },
        ],
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno no servidor.',
      details: [],
    };
  }

  private parseResponseBody(body: string | object): ErrorResponseBody {
    if (typeof body === 'string') {
      return { message: body };
    }

    return body as ErrorResponseBody;
  }

  private normalizeMessage(
    message: string | string[] | undefined,
    fallback: string,
  ) {
    if (Array.isArray(message)) {
      return message.join(' ');
    }

    return message ?? fallback;
  }

  private getPrismaTarget(exception: Prisma.PrismaClientKnownRequestError) {
    const target = exception.meta?.target;

    if (Array.isArray(target) && typeof target[0] === 'string') {
      return target[0];
    }

    return undefined;
  }
}
