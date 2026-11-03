import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

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
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const error = this.normalizeError(exception);

    if (error.statusCode === Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `Erro não tratado em ${request.method} ${request.url}`,
        stack,
      );
    }

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

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
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

      if (exception.code === 'P2023' || exception.code === 'P2000') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Parâmetro ou formato de dado inválido.',
          details: [],
        };
      }

      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro não encontrado.',
          details: [],
        };
      }
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
