import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationError } from 'class-validator';

function formatValidationErrors(errors: ValidationError[]): Record<string, string[]>{
 const pairs = errors.map((error) => [error.property, Object.values(error.constraints ?? {})]);
return Object.fromEntries(pairs);
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
          message: "Nieprawidłowe dane",
          fields: formatValidationErrors(errors),
        })
      }
    }),
    
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
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
