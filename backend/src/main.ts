import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './core/app/app.module';

function formatValidationErrors(errors: ValidationError[]) {
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
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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
bootstrap();
