import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './core/app/app.module';

type ValidationErrorDetail = {
  field: string;
  messages: string[];
};

function getAllowedOrigins(): string[] {
  return (
    process.env.FRONTEND_URLS ??
    process.env.FRONTEND_URL ??
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  return (
    allowedOrigins.includes(origin) ||
    /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.ngrok\.app$/i.test(origin)
  );
}

function formatValidationErrors(
  errors: ValidationError[],
): ValidationErrorDetail[] {
  return errors.flatMap((error) => {
    const messages = Object.values(error.constraints ?? {});
    const children = error.children?.length
      ? formatValidationErrors(error.children).map((child) => ({
          ...child,
          field: `${error.property}.${child.field}`,
        }))
      : [];

    return [
      ...(messages.length
        ? [
            {
              field: error.property,
              messages,
            },
          ]
        : []),
      ...children,
    ];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Dados invalidos.',
          details: formatValidationErrors(errors),
        }),
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
