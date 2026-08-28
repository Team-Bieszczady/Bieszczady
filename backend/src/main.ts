import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationError } from 'class-validator';

function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath
      ? parentPath + '.' + error.property
      : error.property;
    const messages = Object.values(error.constraints ?? {});

    if (messages.length > 0) {
      fields[path] = messages;
    }

    // A DTO nested inside another DTO reports its own failures here, not in
    // constraints. Without this the child messages are lost.
    if (error.children && error.children.length > 0) {
      Object.assign(fields, formatValidationErrors(error.children, path));
    }
  }

  return fields;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Nieprawidłowe dane',
          fields: formatValidationErrors(errors),
        });
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Retry-After'],
  });

  const config = new DocumentBuilder()
    .setTitle('Bieszczady UL API')
    .setDescription('Virtual office management system')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('users', 'User management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
